"""Dashboard aggregation.

Everything here derives from one rule: on-hand quantity is never stored, it is
SUM(stock_movements.quantity) with signed values (+ in, - out). Stock totals,
stock value, low-stock counts, capacity bars and the in/out chart all fall out
of that one ledger.
"""

from collections import OrderedDict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.activity.models import ActivityEvent, NotificationRead
from app.activity.service import log_event
from app.appsettings.models import AppSetting
from app.items.models import Product, StockMovement, Supplier
from app.orders.models import Order
from app.users.models import User
from app.warehouses.models import Warehouse
# --------------------------------------------------------------------------
# Shared: on-hand quantity + stock value (used by nearly every endpoint)
# --------------------------------------------------------------------------


def on_hand_by_product(db: Session, warehouse_id: int | None = None) -> dict[int, int]:
    """product_id -> on-hand qty. Optionally scoped to one warehouse."""
    q = db.query(
        StockMovement.product_id,
        func.coalesce(func.sum(StockMovement.quantity), 0),
    )
    if warehouse_id is not None:
        q = q.filter(StockMovement.warehouse_id == warehouse_id)
    return {pid: int(qty) for pid, qty in q.group_by(StockMovement.product_id).all()}


def on_hand_by_warehouse(db: Session) -> dict[int, int]:
    """warehouse_id -> on-hand qty. Powers the capacity bars."""
    rows = (
        db.query(StockMovement.warehouse_id, func.coalesce(func.sum(StockMovement.quantity), 0))
        .group_by(StockMovement.warehouse_id)
        .all()
    )
    return {wid: int(qty) for wid, qty in rows}


def stock_value(db: Session, warehouse_id: int | None = None) -> Decimal:
    """SUM(on-hand x unit_cost) — the money currently sitting on the shelves."""
    q = db.query(func.coalesce(func.sum(StockMovement.quantity * Product.unit_cost), 0)).join(
        Product, StockMovement.product_id == Product.id
    )
    if warehouse_id is not None:
        q = q.filter(StockMovement.warehouse_id == warehouse_id)
    return Decimal(str(q.scalar() or 0))


def low_stock_product_ids(db: Session, warehouse_id: int | None = None) -> list[int]:
    """Products whose on-hand has fallen to or below their reorder level."""
    on_hand = on_hand_by_product(db, warehouse_id)
    products = db.query(Product.id, Product.reorder_level).all()
    return [pid for pid, reorder in products if on_hand.get(pid, 0) <= reorder]


# --------------------------------------------------------------------------
# Formatting — the frontend's StatusCard/Product contracts take pre-formatted
# strings ("$41,111", "120 units"), so the formatting lives server-side.
# --------------------------------------------------------------------------


DEFAULT_AVATAR = "/images/ellipse-2.png"


def _money(value: Decimal | float | int) -> str:
    return f"${Decimal(str(value)):,.0f}"


def _change(current: float, previous: float) -> tuple[str, str]:
    """(changeText, changeDirection) for a KPI card, current vs previous period."""
    if previous == 0:
        pct = 100.0 if current > 0 else 0.0
    else:
        pct = (current - previous) / abs(previous) * 100
    direction = "down" if pct < 0 else "up"
    return f"{abs(pct):.1f}% vs last period", direction


# --------------------------------------------------------------------------
# GET /status-cards — 6 KPIs, each computed twice (current vs previous period)
# so the up/down arrows are real rather than hardcoded.
# --------------------------------------------------------------------------


def _kpis_asof(db: Session, cutoff: datetime, window_start: datetime) -> dict[str, float]:
    """KPI values as of `cutoff`. Stock figures are cumulative (the ledger up to
    that instant); revenue/orders are flow figures over [window_start, cutoff)."""
    total_stock = (
        db.query(func.coalesce(func.sum(StockMovement.quantity), 0))
        .filter(StockMovement.occurred_at < cutoff)
        .scalar()
        or 0
    )
    value = (
        db.query(func.coalesce(func.sum(StockMovement.quantity * Product.unit_cost), 0))
        .join(Product, StockMovement.product_id == Product.id)
        .filter(StockMovement.occurred_at < cutoff)
        .scalar()
        or 0
    )
    suppliers = db.query(func.count(Supplier.id)).filter(Supplier.created_at < cutoff).scalar() or 0
    revenue = (
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.status == "fulfilled", Order.placed_at >= window_start, Order.placed_at < cutoff)
        .scalar()
        or 0
    )
    orders = (
        db.query(func.count(Order.id))
        .filter(Order.placed_at >= window_start, Order.placed_at < cutoff)
        .scalar()
        or 0
    )

    # Low stock as-of a past cutoff needs the ledger truncated to that instant.
    on_hand_rows = (
        db.query(StockMovement.product_id, func.coalesce(func.sum(StockMovement.quantity), 0))
        .filter(StockMovement.occurred_at < cutoff)
        .group_by(StockMovement.product_id)
        .all()
    )
    on_hand = {pid: int(q) for pid, q in on_hand_rows}
    low_stock = sum(
        1 for pid, reorder in db.query(Product.id, Product.reorder_level).all() if on_hand.get(pid, 0) <= reorder
    )

    return {
        "stocks": float(total_stock),
        "value": float(value),
        "suppliers": float(suppliers),
        "revenue": float(revenue),
        "lowStock": float(low_stock),
        "orders": float(orders),
    }
def get_sales_overview(db: Session):
    number_of_sales = db.query(func.count(Order.id)).filter(Order.status == "fulfilled").scalar()
    total_sales = db.query(func.coalesce(func.sum(Order.total),0)).filter(Order.status == "fulfilled").scalar()
    setting = db.get(AppSetting, "sales_target")
    return {
        "numberOfSales" : number_of_sales,
        "totalSales" : total_sales,
        "target" : int(setting.value) if setting else 0
    }

def update_sales_goal(db: Session, target : int):
    target_row = db.get(AppSetting,"sales_target")
    if target_row:
        target_row.value = str(target)
    else:
        db.add(AppSetting(key="sales_target", value = str(target)))
    db.commit()
    return get_sales_overview(db)

def get_activities(db: Session):
    activity_list = db.query(ActivityEvent).order_by(ActivityEvent.occurred_at.desc()).limit(10).all()
    result = []
    for event in activity_list:
        result.append(
            {
                "id" : event.id,
                "name": event.actor_name,
                "role": event.actor_role,
                "avatar": DEFAULT_AVATAR,
                "description":event.description,
                "date" : event.occurred_at.strftime("%d %b %Y"),
                "time" : event.occurred_at.strftime("%I:%M %p")
            }
        )
    return result

def get_warehouses(db: Session):
    warehouse_list = db.query(Warehouse).order_by(Warehouse.name).all()
    used_capacity_list = on_hand_by_warehouse(db=db)
    result = []
    for warehouse in warehouse_list:
        result.append(
            {
                "id": warehouse.id,
                "name": warehouse.name,
                "image": warehouse.image,
                "lastInspection": _fmt_date(warehouse.last_inspection),
                "warehouseId": warehouse.code,
                "location": warehouse.location,
                "manager": warehouse.manager,
                "capacityUsed" : used_capacity_list.get(warehouse.id,0),
                "capacityTotal": warehouse.capacity_total
            }
        )

    return result
        
    
    
def get_status_cards(db: Session, period_days: int = 30) -> list[dict]:
    now = datetime.now(timezone.utc)
    prev_cutoff = now - timedelta(days=period_days)
    current = _kpis_asof(db, now, prev_cutoff)
    previous = _kpis_asof(db, prev_cutoff, prev_cutoff - timedelta(days=period_days))

    specs = [
        ("stocks", "Total Stocks", lambda v: f"{int(v):,}"),
        ("value", "Stock Value", _money),
        ("suppliers", "Suppliers", lambda v: f"{int(v):,}"),
        ("revenue", "Revenue", _money),
        ("lowStock", "Low Stock Items", lambda v: f"{int(v):,}"),
        ("orders", "Orders", lambda v: f"{int(v):,}"),
    ]

    cards = []
    for key, label, fmt in specs:
        change_text, direction = _change(current[key], previous[key])
        # More low-stock items is bad news — invert the arrow so "up" always reads as good.
        if key == "lowStock":
            direction = "up" if direction == "down" else "down"
        cards.append(
            {
                "id": key,
                "label": label,
                "value": fmt(current[key]),
                "changeText": change_text,
                "changeDirection": direction,
                "icon": key,
            }
        )
    return cards


# --------------------------------------------------------------------------
# GET /inventory-statistics — all three periods in one payload; the chart
# toggles days/months/years client-side without refetching.
# --------------------------------------------------------------------------

_IN = func.sum(case((StockMovement.quantity > 0, StockMovement.quantity), else_=0))
_OUT = func.sum(case((StockMovement.quantity < 0, -StockMovement.quantity), else_=0))


def _bucket(db: Session, since: datetime, fmt: str) -> list[dict]:
    """Group movements into buckets by strftime pattern.

    ponytail: strftime is SQLite/Postgres-portable enough here via func.strftime
    on SQLite and to_char on PG; we normalize in Python instead to stay portable.
    """
    rows = (
        db.query(
            StockMovement.occurred_at,
            StockMovement.quantity,
            Product.unit_cost,
        )
        .join(Product, StockMovement.product_id == Product.id)
        .filter(StockMovement.occurred_at >= since)
        .order_by(StockMovement.occurred_at)
        .all()
    )

    buckets: OrderedDict[str, dict] = OrderedDict()
    for occurred_at, qty, unit_cost in rows:
        label = occurred_at.strftime(fmt)
        b = buckets.setdefault(label, {"label": label, "stockIn": 0, "stockOut": 0, "stockValue": 0.0})
        if qty > 0:
            b["stockIn"] += qty
        else:
            b["stockOut"] += -qty
        b["stockValue"] += float(qty * Decimal(str(unit_cost)))

    # stockValue is the running on-hand value, so accumulate across buckets.
    running = 0.0
    for b in buckets.values():
        running += b["stockValue"]
        b["stockValue"] = round(running, 2)
    return list(buckets.values())


def get_inventory_statistics(db: Session) -> dict[str, list[dict]]:
    now = datetime.now(timezone.utc)
    return {
        "days": _bucket(db, now - timedelta(days=14), "%d %b"),
        "months": _bucket(db, now - timedelta(days=365), "%b"),
        "years": _bucket(db, now - timedelta(days=365 * 5), "%Y"),
    }


# --------------------------------------------------------------------------
# GET /products/top?period= — revenue = outbound qty x unit_price over the
# period. The frontend's period dropdown is wired to this and must actually
# filter (today it refetches nothing).
# --------------------------------------------------------------------------

PERIOD_DAYS = {
    "This week": 7,
    "This month": 30,
    "This quarter": 90,
    "This year": 365,
}


def get_top_products(db: Session, period: str = "This month", limit: int = 6) -> list[dict]:
    days = PERIOD_DAYS.get(period, 30)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    sold = func.coalesce(func.sum(-StockMovement.quantity), 0)
    rows = (
        db.query(
            Product.id,
            Product.name,
            Product.image,
            Product.category,
            sold.label("qty"),
            (sold * Product.unit_price).label("revenue"),
        )
        .join(StockMovement, StockMovement.product_id == Product.id)
        .filter(StockMovement.quantity < 0, StockMovement.occurred_at >= since)
        .group_by(Product.id, Product.name, Product.image, Product.category, Product.unit_price)
        .order_by((sold * Product.unit_price).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": pid,
            "name": name,
            "image": image,
            "category": category,
            "quantity": f"{int(qty):,} units",
            "revenue": _money(revenue),
        }
        for pid, name, image, category, qty, revenue in rows
    ]


# --------------------------------------------------------------------------
# GET /warehouses/{id} — WarehouseDetail. The fat one.
# --------------------------------------------------------------------------

_STATUS_LABEL = {"active": "Active", "maintenance": "Under Maintenance", "closed": "Closed"}
_MOVEMENT_LABEL = {
    "inbound": "Inbound",
    "outbound": "Outbound",
    "transfer_in": "Transfer In",
    "transfer_out": "Transfer Out",
    "adjustment": "Inbound",
}


def _stock_status(on_hand: int, reorder: int) -> str:
    if on_hand <= reorder * 0.5:
        return "Critical"
    if on_hand <= reorder:
        return "Low"
    return "Normal"


def _fmt_date(value: date | datetime | None) -> str:
    return value.strftime("%d-%m-%Y") if value else ""



def get_warehouse_detail(db: Session, warehouse) -> dict:
    """Takes an already-fetched Warehouse (router does the 404)."""
    wid = warehouse.id
    on_hand = on_hand_by_product(db, wid)
    now = datetime.now(timezone.utc)

    products = db.query(Product).all()
    product_rows = []
    for p in products:
        qty = on_hand.get(p.id, 0)
        if qty == 0:
            continue  # not stocked here
        product_rows.append(
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "quantity": qty,
                "status": _stock_status(qty, p.reorder_level),
                "lastUpdated": _fmt_date(now),
            }
        )

    recent = (
        db.query(StockMovement, Product.name)
        .join(Product, StockMovement.product_id == Product.id)
        .filter(StockMovement.warehouse_id == wid)
        .order_by(StockMovement.occurred_at.desc())
        .limit(20)
        .all()
    )
    movements = [
        {
            "id": m.id,
            "item": pname,
            "type": _MOVEMENT_LABEL.get(m.kind, "Inbound"),
            "qty": m.quantity,
            "date": _fmt_date(m.occurred_at),
        }
        for m, pname in recent
    ]

    # 7-day inbound/outbound for the mini bar chart.
    daily = []
    for offset in range(6, -1, -1):
        day_start = (now - timedelta(days=offset)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        row = (
            db.query(_IN, _OUT)
            .filter(
                StockMovement.warehouse_id == wid,
                StockMovement.occurred_at >= day_start,
                StockMovement.occurred_at < day_end,
            )
            .one()
        )
        daily.append(
            {"day": day_start.strftime("%a"), "inbound": int(row[0] or 0), "outbound": int(row[1] or 0)}
        )

    low_stock_count = sum(1 for r in product_rows if r["status"] in ("Low", "Critical"))
    pending_inbound = (
        db.query(func.coalesce(func.sum(StockMovement.quantity), 0))
        .filter(
            StockMovement.warehouse_id == wid,
            StockMovement.quantity > 0,
            StockMovement.occurred_at >= now - timedelta(days=7),
        )
        .scalar()
        or 0
    )
    throughput = sum(d["inbound"] + d["outbound"] for d in daily)

    return {
        "id": wid,
        "name": warehouse.name,
        "image": warehouse.image,
        "lastInspection": _fmt_date(warehouse.last_inspection),
        "warehouseId": warehouse.code,
        "location": warehouse.location,
        "manager": warehouse.manager,
        "capacityUsed": sum(on_hand.values()),
        "capacityTotal": warehouse.capacity_total,
        "status": _STATUS_LABEL.get(warehouse.status, "Active"),
        "phone": warehouse.phone,
        "email": warehouse.email,
        "address": warehouse.location,
        "nextInspection": _fmt_date(warehouse.next_inspection),
        "totalSkus": len(product_rows),
        "lowStockCount": low_stock_count,
        "pendingInbound": int(pending_inbound),
        "throughput": throughput,
        "dailyMovement": daily,
        "movements": movements,
        "products": product_rows,
        "activities": get_activities(db),
    }


# --------------------------------------------------------------------------
# Warehouse create / profile update
# --------------------------------------------------------------------------


def create_warehouse(db: Session, data, actor: User | None = None) -> dict:
    warehouse = Warehouse(
        name=data.name,
        code="",  # needs the PK, so it is set after the flush below
        location=data.location,
        manager=data.manager,
        capacity_total=data.capacityTotal,
        image=data.image or DEFAULT_AVATAR,
        last_inspection=datetime.now(timezone.utc).date(),
        created_by=actor.id if actor else None,
    )
    db.add(warehouse)
    db.flush()  # assigns the id that the code is derived from
    warehouse.code = f"WH-{warehouse.id:03d}"

    log_event(
        db,
        kind="user",
        title="Warehouse added",
        description=f"{warehouse.name} ({warehouse.code}) was created",
        actor=actor,
    )
    db.commit()
    db.refresh(warehouse)

    return {
        "id": warehouse.id,
        "name": warehouse.name,
        "image": warehouse.image,
        "lastInspection": _fmt_date(warehouse.last_inspection),
        "warehouseId": warehouse.code,
        "location": warehouse.location,
        "manager": warehouse.manager,
        "capacityUsed": 0,  # brand new: no movements yet
        "capacityTotal": warehouse.capacity_total,
    }


def _parse_date(value: str) -> date | None:
    """The frontend sends dates as DD-MM-YYYY (the same format _fmt_date emits)."""
    try:
        return datetime.strptime(value, "%d-%m-%Y").date()
    except (ValueError, TypeError):
        return None


def update_warehouse_profile(db: Session, warehouse: Warehouse, data, actor: User | None = None) -> dict:
    warehouse.manager = data.manager
    warehouse.location = data.address  # WarehouseDetail exposes location as "address"
    warehouse.phone = data.phone
    warehouse.email = data.email
    warehouse.next_inspection = _parse_date(data.nextInspection)
    if data.image:
        warehouse.image = data.image
    warehouse.updated_by = actor.id if actor else None

    log_event(
        db,
        kind="user",
        title="Warehouse updated",
        description=f"{warehouse.name} profile was updated",
        actor=actor,
    )
    db.commit()

    return {
        "manager": warehouse.manager,
        "address": warehouse.location,
        "phone": warehouse.phone,
        "email": warehouse.email,
        "nextInspection": _fmt_date(warehouse.next_inspection),
        "image": warehouse.image,
    }


# --------------------------------------------------------------------------
# Notifications — alert-kind events, with read state per user.
# --------------------------------------------------------------------------


def _relative_time(when: datetime) -> str:
    # SQLite drops tzinfo on the way out (Postgres keeps it), so a round-tripped
    # UTC timestamp comes back naive. Re-attach UTC rather than crash on the
    # naive/aware subtraction.
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - when
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    days = hours // 24
    if days == 1:
        return "Yesterday"
    return f"{days} days ago"


def get_notifications(db: Session, user: User, limit: int = 20) -> list[dict]:
    read_ids = {
        row[0]
        for row in db.query(NotificationRead.event_id).filter(NotificationRead.user_id == user.id).all()
    }
    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.is_alert.is_(True))
        .order_by(ActivityEvent.occurred_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "type": e.kind,
            "title": e.title,
            "description": e.description,
            "time": _relative_time(e.occurred_at),
            "unread": e.id not in read_ids,
        }
        for e in events
    ]


def mark_notification_read(db: Session, user: User, event_id: int) -> None:
    if db.get(ActivityEvent, event_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    already = (
        db.query(NotificationRead)
        .filter(NotificationRead.event_id == event_id, NotificationRead.user_id == user.id)
        .first()
    )
    if already:
        return  # idempotent: the unique constraint would reject a second insert
    db.add(NotificationRead(event_id=event_id, user_id=user.id))
    db.commit()


def mark_all_notifications_read(db: Session, user: User) -> None:
    read_ids = {
        row[0]
        for row in db.query(NotificationRead.event_id).filter(NotificationRead.user_id == user.id).all()
    }
    unread = (
        db.query(ActivityEvent.id)
        .filter(ActivityEvent.is_alert.is_(True), ActivityEvent.id.notin_(read_ids or [0]))
        .all()
    )
    for (event_id,) in unread:
        db.add(NotificationRead(event_id=event_id, user_id=user.id))
    db.commit()


# --------------------------------------------------------------------------
# Search index + staff stats
# --------------------------------------------------------------------------


def get_search_index(db: Session) -> dict:
    # Search covers the whole catalog, so it is not the revenue-ranked top-6.
    products = [
        {
            "id": p.id,
            "name": p.name,
            "image": p.image,
            "category": p.category,
            "quantity": f"{on_hand.get(p.id, 0):,} units",
            "revenue": _money(Decimal(str(p.unit_price)) * on_hand.get(p.id, 0)),
        }
        for on_hand in [on_hand_by_product(db)]
        for p in db.query(Product).order_by(Product.name).all()
    ]
    return {"products": products, "warehouses": get_warehouses(db)}


def get_staff_stats(db: Session, user: User) -> list[dict]:
    """Scoped to the staff member's warehouse; admins ("all") see every warehouse."""
    wid = None if user.warehouse_id == "all" else int(user.warehouse_id)

    orders_q = db.query(func.count(Order.id)).filter(Order.status == "pending")
    if wid is not None:
        orders_q = orders_q.filter(Order.warehouse_id == wid)
    pending_orders = orders_q.scalar() or 0

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    deliveries_q = db.query(func.count(StockMovement.id)).filter(
        StockMovement.quantity > 0, StockMovement.occurred_at >= week_ago
    )
    if wid is not None:
        deliveries_q = deliveries_q.filter(StockMovement.warehouse_id == wid)
    deliveries = deliveries_q.scalar() or 0

    low_stock = len(low_stock_product_ids(db, wid))

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    movements_q = db.query(func.count(StockMovement.id)).filter(StockMovement.occurred_at >= today)
    if wid is not None:
        movements_q = movements_q.filter(StockMovement.warehouse_id == wid)
    today_movements = movements_q.scalar() or 0

    return [
        {"id": 1, "title": "Orders Pending", "value": int(pending_orders),
         "description": "Orders waiting for completion", "color": "blue"},
        {"id": 2, "title": "Purchase Deliveries", "value": int(deliveries),
         "description": "Incoming purchase deliveries", "color": "green"},
        {"id": 3, "title": "Low Stock Alerts", "value": low_stock,
         "description": "Items requiring attention", "color": "amber"},
        {"id": 4, "title": "Today's Movements", "value": int(today_movements),
         "description": "Stock in & out today", "color": "red"},
    ]


