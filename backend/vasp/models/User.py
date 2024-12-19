from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, LargeBinary, Enum
from typing import Optional
from vasp.models.Base import Base
from vasp.models.Transaction import Transaction
from vasp.models.Uma import Uma
from vasp.models.Wallet import Wallet
from vasp.models.Preference import Preference
from vasp.models.PushSubscription import PushSubscription
from vasp.models.WebAuthnCredential import WebAuthnCredential
from vasp.models.PayReqResponse import PayReqResponse
from typing import List
from uma import KycStatus
from vasp.utils import generate_uuid


class User(Base):
    __tablename__ = "user"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    google_id: Mapped[Optional[str]] = mapped_column(String)
    phone_number: Mapped[Optional[str]] = mapped_column(String)
    webauthn_credentials: Mapped[List["WebAuthnCredential"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy=True
    )
    kyc_status: Mapped[KycStatus] = mapped_column(Enum(KycStatus))
    email_address: Mapped[Optional[str]] = mapped_column(String)
    full_name: Mapped[Optional[str]] = mapped_column(String)
    avatar: Mapped[Optional[LargeBinary]] = mapped_column(LargeBinary)
    umas: Mapped[List[Uma]] = relationship(back_populates="user")
    wallets: Mapped[List[Wallet]] = relationship(back_populates="user")

    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    preferences: Mapped[List["Preference"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    push_subscriptions: Mapped[List["PushSubscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    payreq_responses: Mapped[List["PayReqResponse"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, umas={self.umas!r} kyc_status={self.kyc_status!r}, email_address={self.email_address!r}"
