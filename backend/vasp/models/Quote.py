from datetime import datetime
from typing import Any
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, Float, Integer, String, ForeignKey, func
from vasp.models.Base import Base

"""Stores quotes fetched by users."""


class Quote(Base):
    __tablename__ = "quote"

    id: Mapped[int] = mapped_column(primary_key=True)
    payment_hash: Mapped[str] = mapped_column(String, index=True, unique=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    multiplier: Mapped[float] = mapped_column(Float)
    sending_currency_code: Mapped[str] = mapped_column(String)
    receiving_currency_code: Mapped[str] = mapped_column(String)
    fees: Mapped[int] = mapped_column(Integer)
    total_receiving_amount: Mapped[int] = mapped_column(Integer)
    total_sending_amount: Mapped[int] = mapped_column(Integer)
    callback_uuid: Mapped[str] = mapped_column(String)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    settled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"Quote(id={self.id!r}, payment_hash={self.payment_hash!r}, expires_at={self.expires_at!r}, multiplier={self.multiplier!r}, sending_currency_code={self.sending_currency_code!r}, receiving_currency_code={self.receiving_currency_code!r}, fees={self.fees!r}, total_receiving_amount={self.total_receiving_amount!r}, total_sending_amount={self.total_sending_amount!r}, callback_uuid={self.callback_uuid!r})"

    def to_dict(self) -> dict[str, Any]:
        return {
            "payment_hash": self.payment_hash,
            "expires_at": self.expires_at,
            "multiplier": self.multiplier,
            "sending_currency_code": self.sending_currency_code,
            "receiving_currency_code": self.receiving_currency_code,
            "fees": self.fees,
            "total_receiving_amount": self.total_receiving_amount,
            "total_sending_amount": self.total_sending_amount,
            "callback_uuid": self.callback_uuid,
            "user_id": self.user_id,
            "created_at": self.created_at,
            "settled_at": self.settled_at,
        }
