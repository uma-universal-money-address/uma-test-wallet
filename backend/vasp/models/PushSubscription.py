from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import ForeignKey, String
from vasp.models.Base import Base
from typing import TYPE_CHECKING
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User

"""Stores push notification subscriptions."""


class PushSubscription(Base):
    __tablename__ = "push_subscription"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    subscription_json: Mapped[str] = mapped_column(String)

    user: Mapped["User"] = relationship(
        back_populates="push_subscriptions", foreign_keys=[user_id]
    )

    def __repr__(self) -> str:
        return f"PushSubscription(id={self.id!r}, user_id={self.user_id!r}, subscription_json={self.subscription_json!r})"
