from sqlalchemy import select, exc
from sqlalchemy.orm import Session
import logging
from uuid import uuid4

from typing import List
from flask import Blueprint, request, Response, jsonify
from flask_login import login_user, current_user

from vasp.db import db
from vasp.models.Uma import Uma as UmaModel
from vasp.models.Wallet import Wallet as WalletModel, Color
from vasp.models.User import User as UserModel
from vasp.models.Preference import Preference
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.user import DEFAULT_PREFERENCES
from vasp.uma_vasp.user import User
from vasp.models.Currency import Currency
from uma import KycStatus

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)

bp = Blueprint("uma", __name__, url_prefix="/uma")


def register_uma(
    uma_user_name: str,
    currencies: List[str],
    kyc_status: KycStatus,
) -> tuple[User, WalletModel]:
    with Session(db.engine) as db_session:
        try:
            if db_session.scalars(
                select(UmaModel).where(UmaModel.username == uma_user_name)
            ).first():
                error = f"UMA {uma_user_name} is already registered."
                abort_with_error(400, error)
            else:

                if current_user.is_authenticated:
                    existing_user = db_session.scalars(
                        select(UserModel).where(UserModel.id == current_user.id)
                    ).first()

                    # Set the default UMA to False for all UMAs if the new UMA is default
                    uma_models = db_session.scalars(
                        select(UmaModel).where(
                            UmaModel.user_id == current_user.id, UmaModel.default
                        )
                    ).all()

                    for uma_model in uma_models:
                        uma_model.default = False

                    user = existing_user
                else:
                    user = UserModel(
                        id=str(uuid4()),
                        kyc_status=kyc_status.value,
                    )
                    db_session.add(user)

                new_wallet = WalletModel(
                    id=str(uuid4()),
                    user_id=user.id,
                    amount_in_lowest_denom=8000,
                    color=Color.ONE,
                )
                new_uma = UmaModel(
                    user_id=user.id,
                    wallet_id=new_wallet.id,
                    username=uma_user_name,
                    default=True,
                )
                db_session.add_all([new_uma, new_wallet])
                db_session.commit()

                for currency in currencies:
                    currency = Currency(wallet_id=new_wallet.id, code=currency)
                    db_session.add(currency)
                db_session.commit()

                for preference_type, value in DEFAULT_PREFERENCES.items():
                    preference = Preference(
                        user_id=user.id,
                        preference_type=preference_type,
                        value=value,
                    )
                    db_session.add(preference)

                db_session.commit()

                return User.from_model(user), new_wallet

        except exc.SQLAlchemyError as err:
            error = f"Error registering user {uma_user_name}: {err}"
            abort_with_error(500, error)


@bp.route("", methods=["POST"])
def create_uma() -> Response:
    data = request.get_json()
    uma_user_name = data["uma_user_name"]
    if not uma_user_name:
        abort_with_error(400, "UMA user name is required.")

    currencies = ["SAT"]
    # Default to verified for the purpose of this demo app
    kyc_status = KycStatus.VERIFIED

    user, wallet = register_uma(
        uma_user_name=uma_user_name,
        currencies=currencies,
        kyc_status=kyc_status,
    )
    login_user(user, remember=True)

    with Session(db.engine) as db_session:
        wallet_fresh = db_session.scalars(
            select(WalletModel).where(WalletModel.id == wallet.id)
        ).first()

        return jsonify(
            {
                "id": wallet_fresh.id,
                "amount_in_lowest_denom": wallet_fresh.amount_in_lowest_denom,
                "color": wallet_fresh.color.value,
                "device_token": wallet_fresh.device_token,
                "uma": wallet_fresh.uma.to_dict(),
                "currency": wallet_fresh.currency.to_dict(),
            }
        )


@bp.get("/<uma_user_name>")
async def uma(uma_user_name: str) -> Response:
    with Session(db.engine) as db_session:
        uma_model = db_session.scalars(
            select(UmaModel).where(UmaModel.username == uma_user_name)
        ).first()
        return jsonify({"available": uma_model is None})
