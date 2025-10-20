from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, Boolean, String
from vasp.models.Base import Base
from typing import Dict, Any
from vasp.utils import generate_uuid


class WalletCounterpartyRequest(Base):
    __tablename__ = "wallet_counterparty_request"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    wallet_id: Mapped[str] = mapped_column(ForeignKey("wallet.id"), unique=True)

    # Flags for requested counterparty data fields
    request_name: Mapped[bool] = mapped_column(Boolean, default=False)
    request_email: Mapped[bool] = mapped_column(Boolean, default=False)
    request_identifier: Mapped[bool] = mapped_column(Boolean, default=True)
    request_account_identifier: Mapped[bool] = mapped_column(Boolean, default=False)
    request_compliance: Mapped[bool] = mapped_column(Boolean, default=True)
    request_postal_address: Mapped[bool] = mapped_column(Boolean, default=False)

    # Additional requestable fields
    request_phone_number: Mapped[bool] = mapped_column(Boolean, default=False)
    request_country_of_residence: Mapped[bool] = mapped_column(Boolean, default=False)
    request_birth_date: Mapped[bool] = mapped_column(Boolean, default=False)
    request_account_name: Mapped[bool] = mapped_column(Boolean, default=False)
    request_financial_institution_lei: Mapped[bool] = mapped_column(
        Boolean, default=False
    )

    # Optional free-form note or versioning field
    note: Mapped[str | None] = mapped_column(String, default=None)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "wallet_id": self.wallet_id,
            "name": self.request_name,
            "email": self.request_email,
            "identifier": self.request_identifier,
            "accountIdentifier": self.request_account_identifier,
            "compliance": self.request_compliance,
            "postalAddress": self.request_postal_address,
            "phoneNumber": self.request_phone_number,
            "countryOfResidence": self.request_country_of_residence,
            "birthDate": self.request_birth_date,
            "accountName": self.request_account_name,
            "financialInstitutionLei": self.request_financial_institution_lei,
        }
