from dataclasses import dataclass
from typing import List, Optional
from sqlalchemy import LargeBinary
from uma import KycStatus
from sqlalchemy.orm import Session
import logging

from vasp.utils import get_vasp_domain
from vasp.db import db
from vasp.models.Uma import Uma as UmaModel
from vasp.models.User import User as UserModel
from vasp.models.Currency import Currency
from vasp.uma_vasp.uma_exception import UmaException


log: logging.Logger = logging.getLogger(__name__)


def get_default_uma(umas: List[UmaModel]) -> Optional[UmaModel]:
    return next((uma for uma in umas if uma.default), None)


@dataclass
class User:
    id: str
    umas: List["UmaModel"]
    kyc_status: KycStatus
    email_address: Optional[str]
    full_name: Optional[str]
    currencies: List["Currency"]
    avatar: Optional[LargeBinary] = None

    def get_default_uma(self) -> Optional[UmaModel]:
        default_uma = get_default_uma(self.umas)
        if default_uma is None:
            log.error(f"User {self.id} has no default UMA.")
            raise UmaException(
                f"User {self.id} has no default UMA.",
                status_code=400,
            )

    def get_default_uma_address(self) -> str:
        default_uma = self.get_default_uma()
        if default_uma is None:
            log.error(f"User {self.id} has no default UMA.")
            raise UmaException(
                f"User {self.id} has no default UMA.",
                status_code=400,
            )
        return f"${default_uma.username}@{get_vasp_domain()}"

    @classmethod
    def from_model(cls, user_model: UserModel) -> "User":
        # Assumes there's a valid session
        return cls(
            id=user_model.id,
            umas=user_model.umas,
            kyc_status=KycStatus(user_model.kyc_status),
            email_address=user_model.email_address,
            full_name=user_model.full_name,
            currencies=user_model.currencies,
            avatar=user_model.avatar,
        )

    @classmethod
    def from_id(cls, user_id: int) -> Optional["User"]:
        with Session(db.engine) as db_session:
            user_model: UserModel = db_session.get(UserModel, user_id)
            if user_model:
                return cls(
                    id=user_model.id,
                    umas=user_model.umas,
                    kyc_status=user_model.kyc_status,
                    email_address=user_model.email_address,
                    full_name=user_model.full_name,
                    currencies=user_model.currencies,
                    avatar=user_model.avatar,
                )

    @classmethod
    def from_model_uma(cls, uma_user_name: str) -> Optional["User"]:
        with Session(db.engine) as db_session:
            user_model = (
                db_session.query(UserModel)
                .filter(UserModel.umas.any(UmaModel.username == uma_user_name))
                .first()
            )
            if user_model is not None:
                return User.from_model(user_model)
            return None
