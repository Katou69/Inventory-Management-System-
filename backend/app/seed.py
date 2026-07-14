import random
from datetime import date, datetime, timedelta, timezone

from app.activity.models import ActivityEvent
from app.appsettings.models import AppSetting
from app.auth.jwt import hash_password
from app.db.session import SessionLocal
from app.items.models import Category, Product, StockMovement, Supplier
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
        "warehouse_id": None,  # NULL = all warehouses
        "status": "active",
        "joined_date": date(2024, 1, 1),
    },
    {
        "name": "Manager User",
        "email": "manager@grandroyal.com",
        "password": "password123",
        "role": "manager",
        "warehouse_id": 1,
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
    {"section_code": "S1", "sku": "GRB-2202", "quantity": 120},
    {"section_code": "S2", "sku": "GRS-2203", "quantity": 200},
]

DEV_SUPPLIERS = [
    {"name": "Grand Royal Group International", "contact_email": "sales@grandroyal.com"},
    {"name": "Glan Master Distillers", "contact_email": "orders@glanmaster.com"},
    {"name": "Myanmar Distillery Co.", "contact_email": "contact@myanmardistillery.com"},
    {"name": "Royal Club Breweries", "contact_email": "supply@royalclub.com"},
]

# Grand Royal Group International: Myanmar spirits producer. Prices are per
# bottle in USD — keep them in this range, not the MMK ticket price (12,000 a
# bottle made Stock Value render as "$54,494,500", which is unreadable on a card).
# The first 8 are the products the frontend mock data references
# (src/data/inventory-data.ts, orders-data.ts, purchase-data.ts) — keep them in
# sync or the mock and the real backend describe different businesses.
# (sku, name, category, unit_price, unit_cost, reorder_level)
DEV_PRODUCTS = [
    ("GRB-2202", "Grand Royal Black", "Whisky", 12.00, 7.20, 500),
    ("GRS-2203", "Grand Royal Signature", "Whisky", 15.00, 9.00, 500),
    ("GSM-2201", "Grand Royal Smooth", "Whisky", 10.00, 6.00, 500),
    ("GRC-2204", "Grand Royal Sherry Cask", "Whisky", 18.00, 11.00, 500),
    ("GRW-2205", "Grand Royal SRW", "Whisky", 9.00, 5.40, 500),
    ("GMF-3301", "Glan Master Finest", "Whisky", 11.00, 6.60, 300),
    ("GMD-3302", "Glan Master Double Smooth", "Whisky", 13.00, 7.80, 300),
    ("RCG-4401", "Royal Club Green", "Whisky", 8.00, 4.80, 300),
    ("GRR-5501", "Grand Royal Rum Gold", "Rum", 7.50, 4.40, 400),
    ("GRR-5502", "Grand Royal Rum White", "Rum", 7.00, 4.10, 400),
    ("GRG-6601", "Grand Royal Dry Gin", "Gin", 9.50, 5.60, 300),
    ("GRG-6602", "Grand Royal Premium Gin", "Gin", 14.00, 8.40, 250),
    ("GRV-7701", "Grand Royal Vodka", "Vodka", 8.50, 5.00, 350),
    ("GRB-8801", "Royal Club Lager", "Beer", 2.50, 1.40, 1000),
    ("GRB-8802", "Royal Club Strong", "Beer", 3.00, 1.70, 1000),
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

    categories: dict[str, Category] = {}
    for _, _, category_name, *_rest in DEV_PRODUCTS:
        if category_name not in categories:
            categories[category_name] = Category(name=category_name)
    db.add_all(categories.values())
    db.flush()

    products = []
    for sku, name, category_name, price, cost, reorder in DEV_PRODUCTS:
        p = Product(
            sku=sku,
            name=name,
            category_id=categories[category_name].id,
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
        status = rng.choices(["completed", "pending", "cancelled"], weights=[7, 2, 1])[0]
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
        ("stock", "Stock received", "Restocked Grand Royal Black (+120)", False),
        ("order", "Order fulfilled", "ORD-0042 shipped to BlueMart", False),
        ("alert", "Low stock warning", "Royal Club Lager below reorder level", True),
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

        # Products must exist before shelf stock can reference them.
        _seed_inventory(db, rng)

        for data in DEV_STOCK:
            section = section_by_code.get(data["section_code"])
            if not section:
                continue
            product = db.query(Product).filter(Product.sku == data["sku"]).first()
            if not product:
                continue
            existing = (
                db.query(ZoneStockEntry)
                .filter(ZoneStockEntry.section_id == section.id, ZoneStockEntry.product_id == product.id)
                .first()
            )
            if existing:
                continue
            db.add(ZoneStockEntry(section_id=section.id, product_id=product.id, quantity=data["quantity"]))

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
