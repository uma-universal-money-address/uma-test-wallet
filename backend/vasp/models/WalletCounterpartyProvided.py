from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, String, Date
from vasp.models.Base import Base
from typing import Dict, Any, Optional
from vasp.utils import generate_uuid


class WalletCounterpartyProvided(Base):
    __tablename__ = "wallet_counterparty_provided"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    wallet_id: Mapped[str] = mapped_column(ForeignKey("wallet.id"), unique=True)

    # Fields user provides per wallet (see UMA counterparty info)
    name: Mapped[Optional[str]] = mapped_column(String)
    email: Mapped[Optional[str]] = mapped_column(String)
    phone_number: Mapped[Optional[str]] = mapped_column(String)
    user_type: Mapped[Optional[str]] = mapped_column(String)  # INDIVIDUAL or BUSINESS
    nationality: Mapped[Optional[str]] = mapped_column(String(2))
    country_of_residence: Mapped[Optional[str]] = mapped_column(String(2))
    birth_date: Mapped[Optional[str]] = mapped_column(String)  # ISO-8601 date
    account_name: Mapped[Optional[str]] = mapped_column(String)
    financial_institution_lei: Mapped[Optional[str]] = mapped_column(String)
    # Postal address fields
    address_line1: Mapped[Optional[str]] = mapped_column(String)
    address_line2: Mapped[Optional[str]] = mapped_column(String)
    city: Mapped[Optional[str]] = mapped_column(String)
    state: Mapped[Optional[str]] = mapped_column(String)
    postal_code: Mapped[Optional[str]] = mapped_column(String)
    country: Mapped[Optional[str]] = mapped_column(String(2))

    def to_payee_data(self, account_identifier: Optional[str]) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "accountIdentifier": account_identifier,
        }
        if self.name:
            data["name"] = self.name
        if self.email:
            data["email"] = self.email
        if self.phone_number:
            data["phoneNumber"] = self.phone_number
        if self.user_type:
            data["userType"] = self.user_type
        if self.country_of_residence:
            data["countryOfResidence"] = self.country_of_residence
        if self.nationality:
            data["nationality"] = self.nationality
        if self.birth_date:
            data["birthDate"] = self.birth_date
        if self.account_name:
            data["accountName"] = self.account_name
        if self.financial_institution_lei:
            data["financialInstitutionLei"] = self.financial_institution_lei

        address_fields = [
            self.address_line1,
            self.address_line2,
            self.city,
            self.state,
            self.postal_code,
            self.country,
        ]
        if any(address_fields):
            data["postalAddress"] = {
                "addressLine1": self.address_line1,
                "addressLine2": self.address_line2,
                "city": self.city,
                "state": self.state,
                "postalCode": self.postal_code,
                "country": self.country,
            }
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "wallet_id": self.wallet_id,
            "name": self.name,
            "email": self.email,
            "phoneNumber": self.phone_number,
            "userType": self.user_type,
            "nationality": self.nationality,
            "countryOfResidence": self.country_of_residence,
            "birthDate": self.birth_date,
            "accountName": self.account_name,
            "financialInstitutionLei": self.financial_institution_lei,
            "postalAddress": {
                "addressLine1": self.address_line1,
                "addressLine2": self.address_line2,
                "city": self.city,
                "state": self.state,
                "postalCode": self.postal_code,
                "country": self.country,
            },
        }
