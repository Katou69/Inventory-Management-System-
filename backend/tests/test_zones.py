"""Zone maker-checker: authorization, identity, and the notification flow.

These endpoints had no coverage at all, which is how two holes survived:
identity was taken from the request body (so a manager could author a proposal
as the admin), and require_role checked the role but never the warehouse (so a
manager of warehouse 1 could edit warehouse 3).
"""

from datetime import date

import pytest

from app.activity.models import ActivityEvent
from app.auth.dependencies import get_current_user
from app.main import app
from app.users.models import User
from app.warehouses.models import Warehouse
from app.zones.models import LayoutRequest, ZoneSection


@pytest.fixture()
def setup(db_session):
    """Two warehouses; an admin (global), plus a manager/staff pinned to warehouse 1."""
    db_session.add_all([
        Warehouse(id=1, name="Main", code="WH-001"),
        Warehouse(id=2, name="North", code="WH-002"),
    ])
    db_session.flush()

    admin = User(id="u-admin", name="Admin User", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    manager = User(id="u-mgr", name="Manager User", email="manager@grandroyal.com",
                   hashed_password="x", role="manager", warehouse_id=1,
                   status="active", joined_date=date(2024, 1, 1))
    staff = User(id="u-staff", name="Staff User", email="staff@grandroyal.com",
                 hashed_password="x", role="staff", warehouse_id=1,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([admin, manager, staff])

    db_session.add_all([
        ZoneSection(id=10, warehouse_id=1, kind="shelf", code="A", name="Rack A",
                    x=0, y=0, width=10, height=10, capacity=100),
        ZoneSection(id=20, warehouse_id=2, kind="shelf", code="B", name="Rack B",
                    x=0, y=0, width=10, height=10, capacity=100),
    ])
    db_session.commit()
    return {"admin": admin, "manager": manager, "staff": staff}


def as_user(user: User) -> None:
    """Authenticate the TestClient as `user`."""
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


def _update(section_id: int, **fields):
    return {"actionType": "update", "sectionId": section_id, "proposedData": fields}


# ---------------------------------------------------------------------------
# Warehouse scoping — require_role checks the role, never the warehouse
# ---------------------------------------------------------------------------


def test_manager_cannot_propose_on_another_warehouse(client, setup):
    as_user(setup["manager"])  # pinned to warehouse 1
    r = client.post(
        "/warehouses/2/layout-requests",
        json={"items": [_update(20, code="SPOOF")], "requestNote": "not my warehouse"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "You are not assigned to this warehouse"


def test_manager_can_propose_on_own_warehouse(client, setup):
    as_user(setup["manager"])
    r = client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=200)], "requestNote": "bump capacity"},
    )
    assert r.status_code == 201


def test_admin_is_global_and_may_act_on_any_warehouse(client, setup, db_session):
    as_user(setup["admin"])  # warehouse_id is None == all
    r = client.post(
        "/warehouses/2/layout-requests/direct",
        json={"item": _update(20, name="Renamed by admin")},
    )
    assert r.status_code == 201
    db_session.expire_all()
    assert db_session.get(ZoneSection, 20).name == "Renamed by admin"


def test_staff_cannot_read_another_warehouses_layout(client, setup):
    as_user(setup["staff"])  # pinned to warehouse 1
    assert client.get("/warehouses/2/zones").status_code == 403
    assert client.get("/warehouses/1/zones").status_code == 200


def test_staff_cannot_edit_the_layout_at_all(client, setup):
    as_user(setup["staff"])
    r = client.post("/warehouses/1/layout-requests/direct", json={"item": _update(10, code="X")})
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# Identity — the author must come from the session, never from the body
# ---------------------------------------------------------------------------


def test_author_comes_from_the_session_not_the_body(client, setup, db_session):
    """A manager POSTing requestedBy=<admin id> must still be recorded as themselves."""
    as_user(setup["manager"])
    r = client.post(
        "/warehouses/1/layout-requests",
        json={
            "items": [_update(10, capacity=150)],
            "requestNote": "sneaky",
            "requestedBy": "u-admin",  # injected -- must be ignored
        },
    )
    assert r.status_code == 201
    db_session.expire_all()
    assert db_session.get(LayoutRequest, r.json()["id"]).requested_by == "u-mgr"


def test_reviewer_comes_from_the_session_not_the_body(client, setup, db_session):
    as_user(setup["manager"])
    rid = client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=150)], "requestNote": "please review"},
    ).json()["id"]

    as_user(setup["admin"])
    assert client.post(f"/layout-requests/{rid}/approve", json={"reviewedBy": "u-mgr"}).status_code == 204
    db_session.expire_all()
    assert db_session.get(LayoutRequest, rid).reviewed_by == "u-admin"


# ---------------------------------------------------------------------------
# The maker-checker flow itself
# ---------------------------------------------------------------------------


def test_proposal_does_not_touch_sections_until_approved(client, setup, db_session):
    as_user(setup["manager"])
    rid = client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=999)], "requestNote": "big bump"},
    ).json()["id"]

    db_session.expire_all()
    assert db_session.get(ZoneSection, 10).capacity == 100  # untouched while pending

    as_user(setup["admin"])
    client.post(f"/layout-requests/{rid}/approve")

    db_session.expire_all()
    assert db_session.get(ZoneSection, 10).capacity == 999  # applied on approve


def test_batched_proposal_applies_every_item(client, setup, db_session):
    """Managers batch several changes under one note -- all of them must land."""
    as_user(setup["manager"])
    rid = client.post(
        "/warehouses/1/layout-requests",
        json={
            "items": [_update(10, capacity=250), _update(10, name="Rack A (fast)")],
            "requestNote": "re-layout",
        },
    ).json()["id"]

    as_user(setup["admin"])
    client.post(f"/layout-requests/{rid}/approve")

    db_session.expire_all()
    section = db_session.get(ZoneSection, 10)
    assert (section.capacity, section.name) == (250, "Rack A (fast)")


def test_rejection_requires_a_note_and_leaves_sections_alone(client, setup, db_session):
    as_user(setup["manager"])
    rid = client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=999)], "requestNote": "big bump"},
    ).json()["id"]

    as_user(setup["admin"])
    assert client.post(f"/layout-requests/{rid}/reject", json={"reviewNote": "   "}).status_code == 422
    assert client.post(f"/layout-requests/{rid}/reject", json={"reviewNote": "too big"}).status_code == 204

    db_session.expire_all()
    assert db_session.get(ZoneSection, 10).capacity == 100
    assert db_session.get(LayoutRequest, rid).review_note == "too big"


def test_a_reviewed_request_cannot_be_reviewed_twice(client, setup):
    as_user(setup["manager"])
    rid = client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=150)], "requestNote": "once"},
    ).json()["id"]

    as_user(setup["admin"])
    assert client.post(f"/layout-requests/{rid}/approve").status_code == 204
    assert client.post(f"/layout-requests/{rid}/approve").status_code == 409


def test_proposal_requires_a_note_and_at_least_one_change(client, setup):
    as_user(setup["manager"])
    assert client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=150)], "requestNote": "  "},
    ).status_code == 422
    assert client.post(
        "/warehouses/1/layout-requests",
        json={"items": [], "requestNote": "nothing to do"},
    ).status_code == 422


# ---------------------------------------------------------------------------
# Notifications — nothing told the admin a proposal was waiting
# ---------------------------------------------------------------------------


def test_proposing_alerts_the_admin(client, setup, db_session):
    as_user(setup["manager"])
    client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=150), _update(10, name="X")], "requestNote": "review please"},
    )

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.is_alert is True  # or it never reaches the notification bell
    assert event.actor_name == "Manager User"
    assert "2 updates" in event.description  # batch summarized and pluralized


def test_review_alerts_and_admin_direct_edit_does_not(client, setup, db_session):
    as_user(setup["manager"])
    rid = client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=150)], "requestNote": "please"},
    ).json()["id"]

    as_user(setup["admin"])
    client.post(f"/layout-requests/{rid}/approve")
    approved = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert approved.is_alert is True  # closes the loop for the waiting manager
    assert approved.title == "Layout change approved"

    # An admin editing directly needs nobody's attention: logged, but not an alert.
    client.post("/warehouses/1/layout-requests/direct", json={"item": _update(10, capacity=175)})
    direct = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert direct.title == "Layout updated"
    assert direct.is_alert is False


def test_layout_events_use_a_kind_the_notification_schema_accepts(client, setup, db_session):
    """The bell 500s on an unknown kind -- kinds are a closed set (stock|order|alert|user)."""
    as_user(setup["manager"])
    client.post(
        "/warehouses/1/layout-requests",
        json={"items": [_update(10, capacity=150)], "requestNote": "n"},
    )
    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.kind in {"stock", "order", "alert", "user"}
