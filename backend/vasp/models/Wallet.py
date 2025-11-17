from datetime import datetime
import enum
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import ForeignKey, Integer, String, Enum, DateTime, Date, JSON
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.sql import func
from typing import Optional, Dict, Any, List, Union
from datetime import date
from uma import KycStatus
from vasp.models.Base import Base
from vasp.uma_vasp.currencies import CURRENCIES
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


class BankAccountNameMatchingStatus(enum.Enum):
    UNKNOWN = "UNKNOWN"
    MATCHED = "MATCHED"
    NOT_MATCHED = "NOT_MATCHED"


class WalletUserType(enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"


class RequiredCounterpartyField(enum.Enum):
    FULL_NAME = "FULL_NAME"
    BIRTH_DATE = "BIRTH_DATE"
    NATIONALITY = "NATIONALITY"
    PHONE_NUMBER = "PHONE_NUMBER"
    EMAIL = "EMAIL"
    POSTAL_ADDRESS = "POSTAL_ADDRESS"
    TAX_ID = "TAX_ID"
    REGISTRATION_NUMBER = "REGISTRATION_NUMBER"
    USER_TYPE = "USER_TYPE"
    COUNTRY_OF_RESIDENCE = "COUNTRY_OF_RESIDENCE"
    ACCOUNT_IDENTIFIER = "ACCOUNT_IDENTIFIER"
    FI_LEGAL_ENTITY_NAME = "FI_LEGAL_ENTITY_NAME"
    FI_ADDRESS = "FI_ADDRESS"
    PURPOSE_OF_PAYMENT = "PURPOSE_OF_PAYMENT"
    ULTIMATE_INSTITUTION_COUNTRY = "ULTIMATE_INSTITUTION_COUNTRY"
    IDENTIFIER = "IDENTIFIER"


class Wallet(Base):
    __tablename__ = "wallet"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    # Amount in the lowest denomination of the currency, e.g. 1234 for $12.34
    amount_in_lowest_denom: Mapped[int] = mapped_column(Integer)
    color: Mapped[Color] = mapped_column(Enum(Color))

    device_token: Mapped[Optional[str]] = mapped_column(String)
    kyc_status: Mapped[KycStatus] = mapped_column(Enum(KycStatus))
    email_address: Mapped[Optional[str]] = mapped_column(String)
    full_name: Mapped[Optional[str]] = mapped_column(String)
    country_of_residence: Mapped[Optional[str]] = mapped_column(String(2))
    birthday: Mapped[Optional[date]] = mapped_column(Date)
    _required_counterparty_fields: Mapped[List[str]] = mapped_column(
        "required_counterparty_fields",
        MutableList.as_mutable(JSON),
        nullable=False,
        default=list,
    )
    bank_account_name_matching_status: Mapped[BankAccountNameMatchingStatus] = (
        mapped_column(
            Enum(BankAccountNameMatchingStatus),
            default=BankAccountNameMatchingStatus.UNKNOWN,
            server_default=BankAccountNameMatchingStatus.UNKNOWN.value,
        )
    )
    phone_number: Mapped[Optional[str]] = mapped_column(String)
    nationality: Mapped[Optional[str]] = mapped_column(String(2))
    address: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        MutableDict.as_mutable(JSON)
    )
    tax_id: Mapped[Optional[str]] = mapped_column(String)
    financial_institution_lei: Mapped[Optional[str]] = mapped_column(String)
    account_name: Mapped[Optional[str]] = mapped_column(String)
    account_identifier: Mapped[Optional[str]] = mapped_column(String)
    user_type: Mapped[Optional[WalletUserType]] = mapped_column(Enum(WalletUserType))
    fi_legal_entity_name: Mapped[Optional[str]] = mapped_column(String)
    ultimate_institution_country: Mapped[Optional[str]] = mapped_column(String(2))

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
        currency_payload: Optional[Dict[str, Any]]
        if self.currency:
            currency_info = CURRENCIES.get(self.currency.code)
            currency_payload = {
                "code": self.currency.code,
                "name": getattr(currency_info, "name", None)
                if currency_info
                else None,
                "symbol": getattr(currency_info, "symbol", None)
                if currency_info
                else None,
                "decimals": getattr(currency_info, "decimals", None)
                if currency_info
                else None,
            }
        else:
            currency_payload = None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount_in_lowest_denom": self.amount_in_lowest_denom,
            "color": self.color.value,
            "device_token": self.device_token,
            "kyc_status": self.kyc_status.value if self.kyc_status else None,
            "email_address": self.email_address,
            "full_name": self.full_name,
            "country_of_residence": self.country_of_residence,
            "birthday": self.birthday.isoformat() if self.birthday else None,
            "required_counterparty_fields": [
                field.value for field in self.required_counterparty_fields
            ],
            "bank_account_name_matching_status": self.bank_account_name_matching_status.value
            if self.bank_account_name_matching_status
            else None,
            "phone_number": self.phone_number,
            "nationality": self.nationality,
            "address": self.address,
            "tax_id": self.tax_id,
            "financial_institution_lei": self.financial_institution_lei,
            "account_name": self.account_name,
            "account_identifier": self.account_identifier,
            "user_type": self.user_type.value if self.user_type else None,
            "fi_legal_entity_name": self.fi_legal_entity_name,
            "ultimate_institution_country": self.ultimate_institution_country,
            "uma": self.uma.to_dict() if self.uma else None,
            "currency": currency_payload,
        }

    @property
    def required_counterparty_fields(self) -> List[RequiredCounterpartyField]:
        return [
            RequiredCounterpartyField(value)
            for value in (self._required_counterparty_fields or [])
        ]

    @required_counterparty_fields.setter
    def required_counterparty_fields(
        self, values: Optional[List[Union[RequiredCounterpartyField, str]]]
    ) -> None:
        if values is None:
            self._required_counterparty_fields = []
            return

        normalized: List[str] = []
        for value in values:
            if isinstance(value, RequiredCounterpartyField):
                normalized.append(value.value)
            elif isinstance(value, str):
                normalized.append(RequiredCounterpartyField(value).value)
            else:
                raise ValueError(
                    "required_counterparty_fields must contain enum values or strings."
                )
        self._required_counterparty_fields = normalized

    def __repr__(self) -> str:
        return f"Wallet(id={self.id!r}, user_id={self.user.id}, uma_username:{self.uma.username} amount_in_lowest_denom={self.amount_in_lowest_denom!r})"
