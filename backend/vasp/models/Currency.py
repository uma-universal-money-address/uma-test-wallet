from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, ForeignKey
from vasp.models.Base import Base
from typing import TYPE_CHECKING, Dict, Any
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.Wallet import Wallet

"""Stores currencies for wallets."""


class Currency(Base):

    __tablename__ = "currency"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    wallet_id: Mapped[int] = mapped_column(ForeignKey("wallet.id"))
    code: Mapped[str] = mapped_column(String)

    wallet: Mapped["Wallet"] = relationship(back_populates="currency")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "wallet_id": self.wallet_id,
            "code": self.code,
        }

    def __repr__(self) -> str:
        return f"Currency(id={self.id!r}, code={self.code!r})"
