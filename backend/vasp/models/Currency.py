from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, ForeignKey
from vasp.models.Base import Base
from typing import TYPE_CHECKING
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User

"""Stores preferred currencies for users."""


class Currency(Base):

    __tablename__ = "currency"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    code: Mapped[str] = mapped_column(String)

    user: Mapped["User"] = relationship(back_populates="currencies")

    def __repr__(self) -> str:
        return f"Currency(id={self.id!r}, code={self.code!r})"
