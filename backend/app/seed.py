import random
from datetime import date, datetime, timedelta, timezone

from app.activity.models import ActivityEvent
from app.appsettings.models import AppSetting
from app.auth.jwt import hash_password
from app.db.session import SessionLocal
from app.items.models import Product, StockMovement, Supplier
from app.orders.models import Order
from app.users.models import User
from app.warehouses.models import Warehouse
from app.zones.models import ZoneSection, ZoneStockEntry

DEV_USERS = [
    {
        "name": "Morgan Lee",
        "email": "admin@grandroyal.com",
        "password": "password123",
        "role": "admin",
        "warehouse_id": "all",
        "status": "active",
        "joined_date": date(2024, 1, 1),
    },
    {
        "name": "Manager User",
        "email": "manager@grandroyal.com",
        "password": "password123",
        "role": "manager",
        "warehouse_id": "1",
        "status": "active",
        "joined_date": date(2024, 1, 1),
    },
]


DEV_WAREHOUSES = [
    {"id": 1, "name": "Main Warehouse", "code": "WH-001", "location": "Yangon, MM",
     "manager": "Morgan Lee", "capacity_total": 5000, "phone": "+95 9 111 2222",
     "email": "main@grandroyal.com"},
    {"id": 2, "name": "North Depot", "code": "WH-002", "location": "Mandalay, MM",
     "manager": "Aye Chan", "capacity_total": 3000, "phone": "+95 9 333 4444",
     "email": "north@grandroyal.com"},
    {"id": 3, "name": "South Hub", "code": "WH-003", "location": "Bago, MM",
     "manager": "Kyaw Zin", "capacity_total": 2000, "phone": "+95 9 555 6666",
     "email": "south@grandroyal.com"},
]

DEV_ZONES = [
    {"warehouse_id": 1, "kind": "zone", "code": "ZONE1", "name": "Receiving Bay", "x": 20, "y": 20, "width": 320, "height": 220, "capacity": 0},
    {"warehouse_id": 1, "kind": "shelf", "code": "S1", "name": "Shelf A", "x": 40, "y": 40, "width": 120, "height": 80, "capacity": 200},
    {"warehouse_id": 1, "kind": "shelf", "code": "S2", "name": "Shelf B", "x": 180, "y": 40, "width": 120, "height": 80, "capacity": 200},
]

DEV_STOCK = [
    {"section_code": "S1", "item_name": "Widget A", "quantity": 120},
    {"section_code": "S2", "item_name": "Widget B", "quantity": 200},
]

DEV_SUPPLIERS = [
    {"name": "Acme Supply Co", "contact_email": "sales@acme.example"},
    {"name": "Nordic Components", "contact_email": "hello@nordic.example"},
    {"name": "Pacific Traders", "contact_email": "orders@pacific.example"},
    {"name": "Delta Logistics", "contact_email": "info@delta.example"},
]

# (sku, name, category, unit_price, unit_cost, reorder_level)
DEV_PRODUCTS = [
    ("SKU-1001", "Wireless Mouse", "Electronics", 25.00, 14.00, 40),
    ("SKU-1002", "Mechanical Keyboard", "Electronics", 89.00, 52.00, 25),
    ("SKU-1003", "USB-C Hub", "Electronics", 45.00, 26.00, 30),
    ("SKU-1004", "27\" Monitor", "Electronics", 220.00, 155.00, 15),
    ("SKU-2001", "Office Chair", "Furniture", 180.00, 110.00, 10),
    ("SKU-2002", "Standing Desk", "Furniture", 420.00, 280.00, 8),
    ("SKU-2003", "Filing Cabinet", "Furniture", 130.00, 78.00, 12),
    ("SKU-3001", "A4 Paper (500)", "Stationery", 8.50, 4.20, 100),
    ("SKU-3002", "Ballpoint Pens (50)", "Stationery", 12.00, 5.50, 80),
    ("SKU-3003", "Sticky Notes Pack", "Stationery", 6.00, 2.80, 90),
    ("SKU-4001", "Packing Tape", "Packaging", 3.50, 1.60, 150),
    ("SKU-4002", "Cardboard Box (L)", "Packaging", 2.20, 0.95, 200),
    ("SKU-4003", "Bubble Wrap Roll", "Packaging", 18.00, 9.00, 50),
    ("SKU-5001", "Safety Helmet", "Safety", 32.00, 18.00, 35),
    ("SKU-5002", "Hi-Vis Vest", "Safety", 15.00, 7.50, 60),
]


def _seed_inventory(db, rng: random.Random) -> None:
    """Products, suppliers, and ~18 months of signed movements.

    The movement spread is what gives the days/months/years chart real shape —
    without it every dashboard widget renders zeros and nothing is verifiable.
    """
    if db.query(Supplier).first():
        return  # already seeded

    suppliers = [Supplier(**s) for s in DEV_SUPPLIERS]
    db.add_all(suppliers)
    db.flush()

    products = []
    for sku, name, category, price, cost, reorder in DEV_PRODUCTS:
        p = Product(
            sku=sku,
            name=name,
            category=category,
            unit_price=price,
            unit_cost=cost,
            reorder_level=reorder,
            supplier_id=rng.choice(suppliers).id,
        )
        products.append(p)
    db.add_all(products)
    db.flush()

    now = datetime.now(timezone.utc)
    warehouse_ids = [w["id"] for w in DEV_WAREHOUSES]

    for product in products:
        # Seed each product with an opening inbound so on-hand starts positive,
        # then alternate restocks and sales across the last 18 months.
        for wid in warehouse_ids:
            db.add(
                StockMovement(
                    product_id=product.id,
                    warehouse_id=wid,
                    kind="inbound",
                    quantity=rng.randint(80, 250),
                    occurred_at=now - timedelta(days=rng.randint(500, 545)),
                    note="Opening stock",
                )
            )

        for _ in range(rng.randint(8, 16)):
            wid = rng.choice(warehouse_ids)
            days_ago = rng.randint(0, 500)
            if rng.random() < 0.45:
                qty = rng.randint(20, 120)  # inbound
                kind = "inbound"
            else:
                qty = -rng.randint(5, 60)  # outbound (sale)
                kind = "outbound"
            db.add(
                StockMovement(
                    product_id=product.id,
                    warehouse_id=wid,
                    kind=kind,
                    quantity=qty,
                    occurred_at=now - timedelta(days=days_ago, hours=rng.randint(0, 23)),
                )
            )

    # Recent activity so the 14-day chart and 7-day warehouse bars aren't empty.
    # Balanced in/out so pendingInbound and throughput both land non-zero.
    for i in range(60):
        product = rng.choice(products)
        wid = rng.choice(warehouse_ids)
        outbound = i % 2 == 0
        db.add(
            StockMovement(
                product_id=product.id,
                warehouse_id=wid,
                kind="outbound" if outbound else "inbound",
                quantity=-rng.randint(2, 25) if outbound else rng.randint(10, 60),
                occurred_at=now - timedelta(days=rng.randint(0, 6), hours=rng.randint(0, 23)),
            )
        )

    # Drain three products below their reorder level so the low-stock KPI and the
    # Low/Critical badges render against real data instead of always reading zero.
    # Drained across EVERY warehouse: the global KPI sums on-hand over all of
    # them, so draining only one warehouse leaves the card at 0 while the
    # warehouse detail shows Critical — both correct, but confusing to look at.
    db.flush()
    for product in products[:3]:
        for wid in warehouse_ids:
            on_hand = sum(
                m.quantity
                for m in db.query(StockMovement)
                .filter(StockMovement.product_id == product.id, StockMovement.warehouse_id == wid)
                .all()
            )
            target = int(product.reorder_level * 0.4 / len(warehouse_ids))  # -> "Critical"
            if on_hand > target:
                db.add(
                    StockMovement(
                        product_id=product.id,
                        warehouse_id=wid,
                        kind="outbound",
                        quantity=-(on_hand - target),
                        occurred_at=now - timedelta(days=1),
                        note="Bulk sale",
                    )
                )


def _seed_orders(db, rng: random.Random) -> None:
    if db.query(Order).first():
        return

    now = datetime.now(timezone.utc)
    customers = ["Ace Retail", "BlueMart", "CityStore", "Dawn Traders", "EverShop", "Fresh Foods"]
    for i in range(1, 61):
        placed = now - timedelta(days=rng.randint(0, 60), hours=rng.randint(0, 23))
        status = rng.choices(["fulfilled", "pending", "cancelled"], weights=[7, 2, 1])[0]
        db.add(
            Order(
                order_no=f"ORD-{i:04d}",
                customer_name=rng.choice(customers),
                status=status,
                total=round(rng.uniform(120, 4800), 2),
                placed_at=placed,
                warehouse_id=rng.choice([1, 2, 3]),
            )
        )


def _seed_activity(db, rng: random.Random, admin: User | None) -> None:
    if db.query(ActivityEvent).first():
        return

    now = datetime.now(timezone.utc)
    samples = [
        ("stock", "Stock received", "Restocked Wireless Mouse (+120)", False),
        ("order", "Order fulfilled", "ORD-0042 shipped to BlueMart", False),
        ("alert", "Low stock warning", "Cardboard Box (L) below reorder level", True),
        ("user", "User added", "New staff account created", False),
        ("stock", "Stock adjusted", "Cycle count correction on Shelf B", False),
        ("alert", "Inspection due", "North Depot inspection due this week", True),
        ("order", "Order placed", "ORD-0058 received from CityStore", False),
        ("stock", "Transfer completed", "Moved 60 units to South Hub", False),
    ]
    for i in range(20):
        kind, title, description, is_alert = samples[i % len(samples)]
        db.add(
            ActivityEvent(
                actor_id=admin.id if admin else None,
                actor_name=admin.name if admin else "System",
                actor_role=admin.role if admin else "system",
                kind=kind,
                title=title,
                description=description,
                is_alert=is_alert,
                occurred_at=now - timedelta(hours=rng.randint(1, 240)),
            )
        )


def seed() -> None:
    rng = random.Random(42)  # deterministic: reseeding gives the same numbers
    db = SessionLocal()
    try:
        for data in DEV_USERS:
            if db.query(User).filter(User.email == data["email"]).first():
                continue
            user = User(
                name=data["name"],
                email=data["email"],
                hashed_password=hash_password(data["password"]),
                role=data["role"],
                warehouse_id=data["warehouse_id"],
                status=data["status"],
                joined_date=data["joined_date"],
            )
            db.add(user)

        now = datetime.now(timezone.utc)
        for data in DEV_WAREHOUSES:
            if db.get(Warehouse, data["id"]):
                continue
            db.add(
                Warehouse(
                    **data,
                    last_inspection=(now - timedelta(days=30)).date(),
                    next_inspection=(now + timedelta(days=60)).date(),
                )
            )
        db.flush()

        section_by_code: dict[str, ZoneSection] = {}
        for data in DEV_ZONES:
            existing = (
                db.query(ZoneSection)
                .filter(ZoneSection.warehouse_id == data["warehouse_id"], ZoneSection.code == data["code"])
                .first()
            )
            if existing:
                section_by_code[data["code"]] = existing
                continue
            section = ZoneSection(**data)
            db.add(section)
            db.flush()
            section_by_code[data["code"]] = section

        for data in DEV_STOCK:
            section = section_by_code.get(data["section_code"])
            if not section:
                continue
            existing = (
                db.query(ZoneStockEntry)
                .filter(ZoneStockEntry.section_id == section.id, ZoneStockEntry.item_name == data["item_name"])
                .first()
            )
            if existing:
                continue
            db.add(ZoneStockEntry(section_id=section.id, item_name=data["item_name"], quantity=data["quantity"]))

        _seed_inventory(db, rng)
        _seed_orders(db, rng)

        admin = db.query(User).filter(User.role == "admin").first()
        _seed_activity(db, rng, admin)

        if not db.get(AppSetting, "sales_target"):
            db.add(AppSetting(key="sales_target", value="21365"))

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed complete.")
