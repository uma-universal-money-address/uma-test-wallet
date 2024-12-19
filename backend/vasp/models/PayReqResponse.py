from datetime import datetime
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, ForeignKey, Integer, DateTime, Float
from sqlalchemy.sql import func
from vasp.models.Base import Base
from typing import TYPE_CHECKING
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User
    from vasp.models.Uma import Uma

"""Stores payreq response information."""


class PayReqResponse(Base):
    __tablename__ = "payreq_response"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)

    # Receiving user who is creating the payreq response.
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    # Receiving UMA who is creating the payreq response.
    uma_id: Mapped[int] = mapped_column(ForeignKey("uma.id"))

    # Payment/transaction hash used to identify received payments
    payment_hash: Mapped[str] = mapped_column(String)

    # Amount in the lowest denomination of the currency, e.g. 1234 for $12.34
    amount_in_lowest_denom: Mapped[int] = mapped_column(Integer)
    currency_code: Mapped[str] = mapped_column(String)

    exchange_fees_msats: Mapped[int] = mapped_column(Integer)
    multiplier: Mapped[float] = mapped_column(Float)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # UMA address of the sender, not necessarily a registered user.
    sender_uma: Mapped[str] = mapped_column(String)

    user: Mapped["User"] = relationship(back_populates="payreq_responses")
    uma: Mapped["Uma"] = relationship(back_populates="payreq_responses")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"PayReqResponse(id={self.id!r}, user_id={self.user_id!r}, uma_id={self.uma_id!r}, sender_uma={self.sender_uma!r}, payment_hash={self.payment_hash!r}, amount_in_lowest_denom={self.amount_in_lowest_denom!r}, currency_code={self.currency_code!r}, exchange_fees_msats={self.exchange_fees_msats!r}, multiplier={self.multiplier!r}, created_at={self.created_at!r})"
