from dataclasses import dataclass
from typing import List, Optional
from sqlalchemy import LargeBinary
from uma import KycStatus
from sqlalchemy.orm import Session
import logging
from flask_login import UserMixin
import json
from pywebpush import webpush, WebPushException

from vasp.utils import get_uma_from_username, is_dev
from vasp.db import db
from vasp.models.Uma import Uma as UmaModel
from vasp.models.User import User as UserModel
from vasp.models.PushSubscription import PushSubscription
from vasp.models.Wallet import Wallet
from vasp.models.WebAuthnCredential import WebAuthnCredential
from vasp.uma_vasp.uma_exception import UmaException
from vasp.uma_vasp.config import Config

log: logging.Logger = logging.getLogger(__name__)


def get_default_uma(umas: List[UmaModel]) -> Optional[UmaModel]:
    return next((uma for uma in umas if uma.default), None)


@dataclass
class User(UserMixin):
    id: str
    google_id: Optional[str]
    phone_number: Optional[str]
    webauthn_credentials: Optional[List["WebAuthnCredential"]]
    umas: List["UmaModel"]
    kyc_status: KycStatus
    email_address: Optional[str]
    full_name: Optional[str]
    wallets: List["Wallet"]
    avatar: Optional[LargeBinary] = None

    def get_id(self) -> str:
        return self.id

    def get_default_uma(self) -> UmaModel:
        default_uma = get_default_uma(self.umas)
        if default_uma is None:
            log.error(f"User {self.id} has no default UMA.")
            raise UmaException(
                f"User {self.id} has no default UMA.",
                status_code=400,
            )
        return default_uma

    def get_default_uma_address(self) -> str:
        default_uma = self.get_default_uma()
        return get_uma_from_username(default_uma.username)

    def send_push_notification(
        self,
        config: Config,
        title: str,
        body: str,
        url: Optional[str] = None,
    ) -> None:
        with Session(db.engine) as db_session:
            push_subscriptions = (
                db_session.query(PushSubscription)
                .filter(PushSubscription.user_id == self.id)
                .all()
            )

            if not url:
                url = (
                    "http://localhost:3000/wallet"
                    if is_dev
                    else "https://sandbox.uma.me/wallet"
                )

            for push_subscription in push_subscriptions:
                try:
                    subscription_info = json.loads(push_subscription.subscription_json)
                    webpush(
                        subscription_info=subscription_info,
                        data=json.dumps({"title": title, "body": body, "url": url}),
                        vapid_private_key=config.vapid_private_key,
                        vapid_claims={
                            "sub": "mailto:{}".format(config.vapid_claim_email)
                        },
                    )
                except WebPushException as error:
                    if error.response:
                        logging.error(f"WebPushException response: {error.response}")
                    else:
                        logging.error("WebPushException error", error)

    @classmethod
    def from_model(cls, user_model: UserModel) -> "User":
        # Assumes there's a valid session
        return cls(
            id=user_model.id,
            google_id=user_model.google_id,
            phone_number=user_model.phone_number,
            webauthn_credentials=user_model.webauthn_credentials,
            umas=user_model.umas,
            kyc_status=KycStatus(user_model.kyc_status),
            email_address=user_model.email_address,
            full_name=user_model.full_name,
            wallets=user_model.wallets,
            avatar=user_model.avatar,
        )

    @classmethod
    def from_id(cls, user_id: str) -> Optional["User"]:
        with Session(db.engine) as db_session:
            user_model: UserModel = db_session.get(UserModel, user_id)
            if user_model:
                return cls(
                    id=user_model.id,
                    google_id=user_model.google_id,
                    phone_number=user_model.phone_number,
                    webauthn_credentials=user_model.webauthn_credentials,
                    umas=user_model.umas,
                    kyc_status=user_model.kyc_status,
                    email_address=user_model.email_address,
                    full_name=user_model.full_name,
                    wallets=user_model.wallets,
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
