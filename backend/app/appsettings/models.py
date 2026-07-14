from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import AuditMixin
from app.db.session import Base


class AppSetting(Base, AuditMixin):
    """Key/value app settings. Today: sales_target (the dashboard gauge goal).

    A table beats a migration every time a knob is added.
    """

    # ponytail: key/value with str values — split into typed columns if this grows past a handful of keys
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(String, nullable=False)
