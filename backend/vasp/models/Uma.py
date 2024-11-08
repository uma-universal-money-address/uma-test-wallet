from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import ForeignKey, String, Boolean
from vasp.models.Base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from vasp.models.User import User
    from vasp.models.Wallet import Wallet

"""Stores uma information users."""


class Uma(Base):
    __tablename__ = "uma"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    wallet_id: Mapped[int] = mapped_column(ForeignKey("wallet.id"))
    username: Mapped[str] = mapped_column(String, unique=True)
    default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="uma")
    wallet: Mapped["Wallet"] = relationship(back_populates="uma")

    def __repr__(self) -> str:
        return f"Uma(id={self.id!r}, user_id={self.user_id}, wallet_id={self.wallet_id}, username={self.username!r})"
