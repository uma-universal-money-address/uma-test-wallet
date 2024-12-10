from datetime import datetime
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, ForeignKey, Integer, DateTime
from sqlalchemy.sql import func
from vasp.models.Base import Base
from typing import TYPE_CHECKING
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User
    from vasp.models.Uma import Uma

"""Stores transaction information."""


class Transaction(Base):
    __tablename__ = "transaction"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)

    # User who either sent or received the transaction.
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    # UMA who either sent or received the transaction.
    uma_id: Mapped[int] = mapped_column(ForeignKey("uma.id"))

    # Transaction hash used to identify received payments
    transaction_hash: Mapped[str] = mapped_column(String)

    # Amount in the lowest denomination of the currency, e.g. 1234 for $12.34
    amount_in_lowest_denom: Mapped[int] = mapped_column(Integer)
    currency_code: Mapped[str] = mapped_column(String)

    # UMA address of the sender, not necessarily a registered user.
    sender_uma: Mapped[str] = mapped_column(String)
    # UMA address of the receiver, not necessarily a registered user.
    receiver_uma: Mapped[str] = mapped_column(String)

    user: Mapped["User"] = relationship(back_populates="transactions")
    uma: Mapped["Uma"] = relationship(back_populates="transactions")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"Transaction(id={self.id!r}, sender_uma={self.sender_uma!r}, receiver_uma={self.receiver_uma!r}, amount_in_lowest_denom={self.amount_in_lowest_denom!r}, currency_code={self.currency_code!r})"
