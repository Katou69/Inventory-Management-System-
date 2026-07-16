import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import text

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
     "manager": "Morgan Lee", "phone": "+95 9 111 2222",
     "email": "main@grandroyal.com"},
    {"id": 2, "name": "North Depot", "code": "WH-002", "location": "Mandalay, MM",
     "manager": "Aye Chan", "phone": "+95 9 333 4444",
     "email": "north@grandroyal.com"},
    {"id": 3, "name": "South Hub", "code": "WH-003", "location": "Bago, MM",
     "manager": "Kyaw Zin", "phone": "+95 9 555 6666",
     "email": "south@grandroyal.com"},
]

# Warehouse floor plans for the zone layout map.
#
# `kind: zone` boxes are free-form grouping containers (capacity 0) drawn behind
# the `kind: shelf` blocks that sit spatially inside them. Warehouse 1 follows a
# real flow -- Receiving -> Storage -> Packing -> Shipping, plus an Office.
#
# Capacities are deliberately a mix against DEV_STOCK below, so the map exercises
# all three occupancy colors (gray empty / amber partial / red full) instead of
# rendering a uniform wall of one state.
DEV_ZONES = [
    # --- Warehouse 1: Main Warehouse -------------------------------------
    {"warehouse_id": 1, "kind": "zone", "code": "Z-SHIP", "name": "Shipping Bay",  "x": 60,  "y": 120, "width": 460, "height": 290, "capacity": 0},
    {"warehouse_id": 1, "kind": "zone", "code": "Z-RECV", "name": "Receiving Bay", "x": 820, "y": 120, "width": 480, "height": 220, "capacity": 0},
    {"warehouse_id": 1, "kind": "zone", "code": "Z-STOR", "name": "Storage Hall",  "x": 520, "y": 420, "width": 780, "height": 640, "capacity": 0},
    {"warehouse_id": 1, "kind": "zone", "code": "Z-PACK", "name": "Packing Area",  "x": 80,  "y": 440, "width": 340, "height": 200, "capacity": 0},
    {"warehouse_id": 1, "kind": "zone", "code": "Z-OFFC", "name": "Office",        "x": 80,  "y": 700, "width": 320, "height": 190, "capacity": 0},

    {"warehouse_id": 1, "kind": "shelf", "code": "R1", "name": "Receiving Rack 1", "x": 850,  "y": 190, "width": 120, "height": 90, "capacity": 150},
    {"warehouse_id": 1, "kind": "shelf", "code": "R2", "name": "Receiving Rack 2", "x": 1000, "y": 190, "width": 120, "height": 90, "capacity": 150},
    {"warehouse_id": 1, "kind": "shelf", "code": "R3", "name": "Receiving Rack 3", "x": 1150, "y": 190, "width": 120, "height": 90, "capacity": 150},

    {"warehouse_id": 1, "kind": "shelf", "code": "S1", "name": "Shipping Rack 1", "x": 90,  "y": 190, "width": 110, "height": 90, "capacity": 120},
    {"warehouse_id": 1, "kind": "shelf", "code": "S2", "name": "Shipping Rack 2", "x": 220, "y": 190, "width": 110, "height": 90, "capacity": 120},
    {"warehouse_id": 1, "kind": "shelf", "code": "S3", "name": "Shipping Rack 3", "x": 350, "y": 190, "width": 110, "height": 90, "capacity": 120},
    {"warehouse_id": 1, "kind": "shelf", "code": "S4", "name": "Shipping Narrow Rack", "x": 90, "y": 300, "width": 110, "height": 90, "capacity": 80},

    {"warehouse_id": 1, "kind": "shelf", "code": "ST-L1", "name": "Storage Left 1",  "x": 560, "y": 460, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-R1", "name": "Storage Right 1", "x": 920, "y": 460, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-L2", "name": "Storage Left 2",  "x": 560, "y": 560, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-R2", "name": "Storage Right 2", "x": 920, "y": 560, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-L3", "name": "Storage Left 3",  "x": 560, "y": 660, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-R3", "name": "Storage Right 3", "x": 920, "y": 660, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-L4", "name": "Storage Left 4",  "x": 560, "y": 760, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-R4", "name": "Storage Right 4", "x": 920, "y": 760, "width": 300, "height": 80, "capacity": 300},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-BULK", "name": "Storage Bulk Floor",  "x": 560,  "y": 860, "width": 660, "height": 80,  "capacity": 600},
    {"warehouse_id": 1, "kind": "shelf", "code": "ST-RSV",  "name": "Storage Reserve Rack", "x": 1240, "y": 460, "width": 40, "height": 480, "capacity": 400},

    {"warehouse_id": 1, "kind": "shelf", "code": "PK1", "name": "Packing Bench 1", "x": 110, "y": 490, "width": 130, "height": 90, "capacity": 100},
    {"warehouse_id": 1, "kind": "shelf", "code": "PK2", "name": "Packing Bench 2", "x": 260, "y": 490, "width": 130, "height": 90, "capacity": 100},

    # --- Warehouse 2: North Depot ----------------------------------------
    {"warehouse_id": 2, "kind": "zone",  "code": "Z-MAIN", "name": "Main Hall",   "x": 40,  "y": 40,  "width": 620, "height": 380, "capacity": 0},
    {"warehouse_id": 2, "kind": "shelf", "code": "N-A", "name": "North Rack A", "x": 80,  "y": 100, "width": 160, "height": 100, "capacity": 250},
    {"warehouse_id": 2, "kind": "shelf", "code": "N-B", "name": "North Rack B", "x": 280, "y": 100, "width": 160, "height": 100, "capacity": 250},
    {"warehouse_id": 2, "kind": "shelf", "code": "N-C", "name": "North Rack C", "x": 480, "y": 100, "width": 160, "height": 100, "capacity": 250},
    {"warehouse_id": 2, "kind": "shelf", "code": "N-D", "name": "North Rack D", "x": 80,  "y": 250, "width": 160, "height": 100, "capacity": 200},
    {"warehouse_id": 2, "kind": "shelf", "code": "N-E", "name": "North Rack E", "x": 280, "y": 250, "width": 160, "height": 100, "capacity": 200},
    {"warehouse_id": 2, "kind": "shelf", "code": "N-BULK", "name": "North Bulk Floor", "x": 480, "y": 250, "width": 160, "height": 100, "capacity": 500},

    # --- Warehouse 3: South Hub ------------------------------------------
    {"warehouse_id": 3, "kind": "zone",  "code": "Z-COLD", "name": "Cold Chain",   "x": 420, "y": 20,  "width": 200, "height": 240, "capacity": 0},
    {"warehouse_id": 3, "kind": "shelf", "code": "SH-A", "name": "Bulk Storage 1", "x": 40,  "y": 40,  "width": 150, "height": 150, "capacity": 450},
    {"warehouse_id": 3, "kind": "shelf", "code": "SH-B", "name": "Bulk Storage 2", "x": 240, "y": 40,  "width": 150, "height": 150, "capacity": 300},
    {"warehouse_id": 3, "kind": "shelf", "code": "SH-C", "name": "Bulk Storage 3", "x": 40,  "y": 240, "width": 150, "height": 150, "capacity": 350},
    {"warehouse_id": 3, "kind": "shelf", "code": "SH-COLD", "name": "Cold Store",  "x": 440, "y": 60,  "width": 150, "height": 150, "capacity": 120},
]

# (warehouse_id, section_code) -> product. Codes repeat across warehouses, so the
# warehouse id is part of the key.
#
# Deliberately uneven: some shelves are full (qty == capacity), some partial, and
# several are left out entirely so they render empty. ST-R3 holds two SKUs to
# exercise the mixed-product shelf path.
DEV_STOCK = [
    # Warehouse 1
    {"warehouse_id": 1, "section_code": "R1",      "sku": "GRB-2202", "quantity": 150},  # full
    {"warehouse_id": 1, "section_code": "R3",      "sku": "GRG-6601", "quantity": 60},   # partial
    {"warehouse_id": 1, "section_code": "S1",      "sku": "GRV-7701", "quantity": 120},  # full
    {"warehouse_id": 1, "section_code": "S3",      "sku": "GRS-2203", "quantity": 45},   # partial
    {"warehouse_id": 1, "section_code": "S4",      "sku": "GRB-2202", "quantity": 80},   # full
    {"warehouse_id": 1, "section_code": "ST-L1",   "sku": "GRV-7701", "quantity": 300},  # full
    {"warehouse_id": 1, "section_code": "ST-L2",   "sku": "GRG-6601", "quantity": 150},  # partial
    {"warehouse_id": 1, "section_code": "ST-R2",   "sku": "GRR-5501", "quantity": 300},  # full
    {"warehouse_id": 1, "section_code": "ST-R3",   "sku": "GRB-2202", "quantity": 100},  # mixed SKU...
    {"warehouse_id": 1, "section_code": "ST-R3",   "sku": "GRG-6601", "quantity": 80},   # ...180/300 partial
    {"warehouse_id": 1, "section_code": "ST-L4",   "sku": "GSM-2201", "quantity": 300},  # full
    {"warehouse_id": 1, "section_code": "ST-BULK", "sku": "GRB-8801", "quantity": 600},  # full
    {"warehouse_id": 1, "section_code": "ST-RSV",  "sku": "GRC-2204", "quantity": 200},  # partial
    {"warehouse_id": 1, "section_code": "PK1",     "sku": "GRW-2205", "quantity": 40},   # partial
    # R2, S2, ST-R1, ST-L3, ST-R4, PK2 intentionally empty.

    # Warehouse 2
    {"warehouse_id": 2, "section_code": "N-A",    "sku": "GMF-3301", "quantity": 250},  # full
    {"warehouse_id": 2, "section_code": "N-B",    "sku": "GMD-3302", "quantity": 90},   # partial
    {"warehouse_id": 2, "section_code": "N-D",    "sku": "RCG-4401", "quantity": 200},  # full
    {"warehouse_id": 2, "section_code": "N-BULK", "sku": "GRB-8802", "quantity": 180},  # partial
    # N-C, N-E intentionally empty.

    # Warehouse 3
    {"warehouse_id": 3, "section_code": "SH-A",    "sku": "GRS-2203", "quantity": 450},  # full
    {"warehouse_id": 3, "section_code": "SH-B",    "sku": "GRC-2204", "quantity": 60},   # partial
    {"warehouse_id": 3, "section_code": "SH-COLD", "sku": "GRR-5502", "quantity": 120},  # full
    # SH-C intentionally empty.
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
        last_inspection = (now - timedelta(days=30)).date()
        next_inspection = (now + timedelta(days=60)).date()
        for data in DEV_WAREHOUSES:
            existing = db.get(Warehouse, data["id"])
            if existing:
                # Backfill rather than skip. A warehouse created before the profile
                # columns existed keeps them blank forever under a plain `continue`,
                # which is exactly how WH-001 ended up with no manager or address.
                # Only empty fields are filled, so real edits are never overwritten.
                for field, value in data.items():
                    if not getattr(existing, field, None):
                        setattr(existing, field, value)
                if existing.last_inspection is None:
                    existing.last_inspection = last_inspection
                if existing.next_inspection is None:
                    existing.next_inspection = next_inspection
                continue
            db.add(
                Warehouse(
                    **data,
                    last_inspection=last_inspection,
                    next_inspection=next_inspection,
                )
            )
        db.flush()

        # DEV_WAREHOUSES inserts explicit ids, which never advances the
        # warehouses_id_seq — the next ORM insert then collides on the PK.
        db.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('warehouses', 'id'), "
                "(SELECT COALESCE(MAX(id), 1) FROM warehouses))"
            )
        )

        # Keyed by (warehouse_id, code): codes are only unique within a warehouse,
        # and every warehouse now has a floor plan.
        section_by_code: dict[tuple[int, str], ZoneSection] = {}
        for data in DEV_ZONES:
            key = (data["warehouse_id"], data["code"])
            existing = (
                db.query(ZoneSection)
                .filter(ZoneSection.warehouse_id == data["warehouse_id"], ZoneSection.code == data["code"])
                .first()
            )
            if existing:
                section_by_code[key] = existing
                continue
            section = ZoneSection(**data)
            db.add(section)
            db.flush()
            section_by_code[key] = section

        # Products must exist before shelf stock can reference them.
        _seed_inventory(db, rng)

        for data in DEV_STOCK:
            section = section_by_code.get((data["warehouse_id"], data["section_code"]))
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
