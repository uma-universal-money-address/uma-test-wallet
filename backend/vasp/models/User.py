from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, LargeBinary, Enum
from typing import Optional
from vasp.models.Base import Base
from vasp.models.Transaction import Transaction
from vasp.models.Currency import Currency
from vasp.models.Uma import Uma
from vasp.models.Wallet import Wallet
from vasp.models.Preference import Preference
from typing import List
from uma import KycStatus


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    google_id: Mapped[Optional[str]] = mapped_column(String)
    phone_number: Mapped[Optional[str]] = mapped_column(String)
    webauthn_id: Mapped[Optional[str]] = mapped_column(String)
    kyc_status: Mapped[KycStatus] = mapped_column(Enum(KycStatus))
    email_address: Mapped[Optional[str]] = mapped_column(String)
    full_name: Mapped[Optional[str]] = mapped_column(String)
    avatar: Mapped[Optional[LargeBinary]] = mapped_column(LargeBinary)
    umas: Mapped[List[Uma]] = relationship(back_populates="user")
    currencies: Mapped[List["Currency"]] = relationship(back_populates="user")
    wallet: Mapped[Wallet] = relationship(back_populates="user")

    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    preferences: Mapped[List["Preference"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, umas={self.umas!r} kyc_status={self.kyc_status!r}, email_address={self.email_address!r}, currencies={self.currencies!r}"
