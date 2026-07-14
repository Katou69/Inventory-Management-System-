import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app
from app.auth import models as auth_models  # noqa: F401  (register tables on Base.metadata)
from app.users import models as user_models  # noqa: F401
from app.warehouses import models as warehouse_models  # noqa: F401
from app.zones import models as zone_models  # noqa: F401
from app.items import models as item_models  # noqa: F401
from app.orders import models as order_models  # noqa: F401
from app.purchases import models as purchase_models  # noqa: F401
from app.activity import models as activity_models  # noqa: F401
from app.appsettings import models as appsetting_models  # noqa: F401

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
