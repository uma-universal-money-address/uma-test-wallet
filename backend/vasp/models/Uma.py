from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import ForeignKey, String, Boolean
from vasp.models.Base import Base
from typing import TYPE_CHECKING, Dict, Any
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User
    from vasp.models.Wallet import Wallet

"""Stores uma information users."""


class Uma(Base):
    __tablename__ = "uma"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    wallet_id: Mapped[str] = mapped_column(ForeignKey("wallet.id"))
    username: Mapped[str] = mapped_column(String, unique=True)
    default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="umas", foreign_keys=[user_id])
    wallet: Mapped["Wallet"] = relationship(
        back_populates="uma", foreign_keys=[wallet_id]
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "wallet_id": self.wallet_id,
            "username": self.username,
            "default": self.default,
        }

    def __repr__(self) -> str:
        return f"Uma(id={self.id!r}, user_id={self.user_id}, wallet_id={self.wallet_id}, username={self.username!r})"
