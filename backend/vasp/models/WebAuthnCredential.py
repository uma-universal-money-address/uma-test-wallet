from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import ForeignKey, String, LargeBinary
from vasp.models.Base import Base
from typing import TYPE_CHECKING, Dict, Any
from vasp.utils import generate_uuid

if TYPE_CHECKING:
    from vasp.models.User import User


class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credential"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"), nullable=False)
    credential_id: Mapped[str] = mapped_column(String, nullable=False)
    credential_public_key: Mapped[LargeBinary] = mapped_column(
        LargeBinary, nullable=False
    )

    user: Mapped["User"] = relationship(
        back_populates="webauthn_credentials", foreign_keys=[user_id]
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "credential_id": self.credential_id,
        }

    def __repr__(self) -> str:
        return f"Credential(user_id={self.user_id}, credential_id={self.credential_id})"
