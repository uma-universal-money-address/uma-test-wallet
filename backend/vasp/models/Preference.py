import enum
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, ForeignKey, Enum
from vasp.models.Base import Base
from typing import TYPE_CHECKING
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User

"""Stores user preference information."""


class PreferenceType(enum.Enum):
    WALLET_SKIN = "WALLET_SKIN"
    PUSH_NOTIFICATIONS = "PUSH_NOTIFICATIONS"
    DEBUG_MODE = "DEBUG_MODE"
    CUSTOM_LIGHTSPARK_BASE_URL = "CUSTOM_LIGHTSPARK_BASE_URL"


class Preference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)

    # User who this preference belongs to.
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    preference_type: Mapped[PreferenceType] = mapped_column(
        Enum(PreferenceType), nullable=False
    )
    value: Mapped[String] = mapped_column(String)

    user: Mapped["User"] = relationship(back_populates="preferences")

    def __repr__(self) -> str:
        return f"Preference(id={self.id!r}, user_id={self.user_id!r}, preference_type={self.preference_type!r}, value={self.value!r})"
