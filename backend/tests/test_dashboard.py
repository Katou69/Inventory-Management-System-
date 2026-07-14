"""Dashboard aggregation tests.

The only genuinely non-trivial logic here is the signed-ledger math: on-hand is
SUM(stock_movements.quantity) with + in / - out. These assertions fail if that
sign convention is ever broken.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.dashboard import service
from app.items.models import Category, Product, StockMovement
from app.warehouses.models import Warehouse


def _setup(db):
    now = datetime.now(timezone.utc)
    wh = Warehouse(id=1, name="Test WH", code="WH-001", capacity_total=1000)
    db.add(wh)

    electronics = Category(name="Electronics")
    db.add(electronics)
    db.flush()

    # reorder_level 40: on-hand lands at 100, comfortably Normal.
    widget = Product(sku="SKU-1", name="Widget", category_id=electronics.id,
                     unit_price=Decimal("10.00"), unit_cost=Decimal("4.00"), reorder_level=40)
    # reorder_level 50: on-hand lands at 20, i.e. below reorder -> low stock.
    gadget = Product(sku="SKU-2", name="Gadget", category_id=electronics.id,
                     unit_price=Decimal("20.00"), unit_cost=Decimal("9.00"), reorder_level=50)
    db.add_all([widget, gadget])
    db.flush()

    db.add_all([
        StockMovement(product_id=widget.id, warehouse_id=1, kind="inbound",
                      quantity=150, occurred_at=now - timedelta(days=5)),
        StockMovement(product_id=widget.id, warehouse_id=1, kind="outbound",
                      quantity=-50, occurred_at=now - timedelta(days=2)),  # -> 100
        StockMovement(product_id=gadget.id, warehouse_id=1, kind="inbound",
                      quantity=30, occurred_at=now - timedelta(days=5)),
        StockMovement(product_id=gadget.id, warehouse_id=1, kind="outbound",
                      quantity=-10, occurred_at=now - timedelta(days=1)),  # -> 20
    ])
    db.commit()
    return widget, gadget


def test_on_hand_nets_signed_movements(db_session):
    widget, gadget = _setup(db_session)
    on_hand = service.on_hand_by_product(db_session)

    assert on_hand[widget.id] == 100  # 150 - 50
    assert on_hand[gadget.id] == 20  # 30 - 10


def test_stock_value_uses_unit_cost(db_session):
    _setup(db_session)
    # 100 widgets @ 4.00 + 20 gadgets @ 9.00 = 400 + 180
    assert service.stock_value(db_session) == Decimal("580.00")


def test_low_stock_flags_products_at_or_below_reorder(db_session):
    widget, gadget = _setup(db_session)
    low = service.low_stock_product_ids(db_session)

    assert gadget.id in low  # 20 on hand vs reorder 50
    assert widget.id not in low  # 100 on hand vs reorder 40


def test_status_cards_report_the_ledger_totals(db_session):
    _setup(db_session)
    cards = {c["id"]: c for c in service.get_status_cards(db_session)}

    assert cards["stocks"]["value"] == "120"  # 100 + 20
    assert cards["value"]["value"] == "$580"
    assert cards["lowStock"]["value"] == "1"
    assert set(cards) == {"stocks", "value", "suppliers", "revenue", "lowStock", "orders"}


def test_top_products_rank_by_outbound_revenue(db_session):
    widget, gadget = _setup(db_session)
    top = service.get_top_products(db_session, period="This month")

    # widget: 50 sold @ 10.00 = $500; gadget: 10 sold @ 20.00 = $200
    assert [p["id"] for p in top] == [widget.id, gadget.id]
    assert top[0]["quantity"] == "50 units"
    assert top[0]["revenue"] == "$500"


def test_inventory_statistics_splits_in_and_out(db_session):
    _setup(db_session)
    stats = service.get_inventory_statistics(db_session)

    assert set(stats) == {"days", "months", "years"}
    days = stats["days"]
    assert sum(d["stockIn"] for d in days) == 180  # 150 + 30
    assert sum(d["stockOut"] for d in days) == 60  # 50 + 10, unsigned


def test_sales_goal_round_trips(db_session):
    service.update_sales_goal(db_session, 30000)
    assert service.get_sales_overview(db_session)["target"] == 30000

    # Updating an existing setting must overwrite, not insert a second row.
    service.update_sales_goal(db_session, 45000)
    assert service.get_sales_overview(db_session)["target"] == 45000


def test_notifications_read_state_is_per_user(db_session):
    """Two users reading the same alert must not clobber each other's badge."""
    from app.activity.models import ActivityEvent
    from app.users.models import User

    def _user(email, role):
        u = User(name=email, email=email, hashed_password="x", role=role,
                 warehouse_id=1, status="active", joined_date=date(2024, 1, 1))
        db_session.add(u)
        return u

    alice, bob = _user("a@grandroyal.com", "staff"), _user("b@grandroyal.com", "staff")
    db_session.add(ActivityEvent(kind="alert", title="Low stock", description="x", is_alert=True))
    db_session.commit()

    event_id = service.get_notifications(db_session, alice)[0]["id"]
    service.mark_notification_read(db_session, alice, event_id)

    assert service.get_notifications(db_session, alice)[0]["unread"] is False
    assert service.get_notifications(db_session, bob)[0]["unread"] is True  # unaffected

    # Marking twice must not blow up on the unique constraint.
    service.mark_notification_read(db_session, alice, event_id)


def test_create_warehouse_derives_code_from_id(db_session):
    from app.dashboard.schemas import CreateWarehouseIn

    created = service.create_warehouse(
        db_session,
        CreateWarehouseIn(name="North", location="Bago", manager="Aye", capacityTotal=900),
    )
    assert created["warehouseId"] == f"WH-{created['id']:03d}"
    assert created["capacityUsed"] == 0  # no movements yet
