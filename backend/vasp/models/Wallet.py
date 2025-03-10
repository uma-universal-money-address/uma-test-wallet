from datetime import datetime
import enum
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import ForeignKey, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
from typing import Optional, Dict, Any
from vasp.models.Base import Base
from typing import TYPE_CHECKING
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User
    from vasp.models.Uma import Uma
    from vasp.models.Currency import Currency

"""Stores user wallet information."""


class Color(enum.Enum):
    ONE = "ONE"
    TWO = "TWO"
    THREE = "THREE"
    FOUR = "FOUR"
    FIVE = "FIVE"
    SIX = "SIX"
    SEVEN = "SEVEN"
    EIGHT = "EIGHT"
    NINE = "NINE"
    TEN = "TEN"


class Wallet(Base):
    __tablename__ = "wallet"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    # Amount in the lowest denomination of the currency, e.g. 1234 for $12.34
    amount_in_lowest_denom: Mapped[int] = mapped_column(Integer)
    color: Mapped[Color] = mapped_column(Enum(Color))

    device_token: Mapped[Optional[str]] = mapped_column(String)

    user: Mapped["User"] = relationship(
        back_populates="wallets", foreign_keys=[user_id]
    )
    uma: Mapped["Uma"] = relationship(
        back_populates="wallet", cascade="all, delete-orphan"
    )
    currency: Mapped["Currency"] = relationship(
        back_populates="wallet", cascade="all, delete-orphan"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount_in_lowest_denom": self.amount_in_lowest_denom,
            "color": self.color.value,
            "device_token": self.device_token,
            "uma_id": self.uma.id,
            "currency_id": self.currency.id,
        }

    def __repr__(self) -> str:
        return f"Wallet(id={self.id!r}, user_id={self.user.id}, uma_username:{self.uma.username} amount_in_lowest_denom={self.amount_in_lowest_denom!r})"
