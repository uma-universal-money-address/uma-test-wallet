from sqlalchemy import select, exc
from sqlalchemy.orm import Session
import logging
from uuid import uuid4

from typing import List
from flask import Blueprint, request, Response, jsonify
from flask_login import login_user

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

log: logging.Logger = logging.getLogger(__name__)

bp = Blueprint("uma", __name__, url_prefix="/uma")


def register_uma(
    uma_user_name: str,
    currencies: List[str],
    kyc_status: KycStatus,
) -> User:
    with Session(db.engine) as db_session:
        try:
            if db_session.scalars(
                select(UmaModel).where(UmaModel.username == uma_user_name)
            ).first():
                error = f"UMA {uma_user_name} is already registered."
                abort_with_error(400, error)
            else:
                new_user = UserModel(
                    id=str(uuid4()),
                    kyc_status=kyc_status.value,
                )
                new_wallet = WalletModel(
                    id=str(uuid4()),
                    user_id=new_user.id,
                    amount_in_lowest_denom=100000,
                    color=Color.ONE,
                )
                new_uma = UmaModel(
                    user_id=new_user.id,
                    wallet_id=new_wallet.id,
                    username=uma_user_name,
                    default=True,
                )
                db_session.add_all([new_uma, new_wallet, new_user])
                db_session.commit()

                for currency in currencies:
                    currency = Currency(user_id=new_user.id, code=currency)
                    db_session.add(currency)
                db_session.commit()

                for preference_type, value in DEFAULT_PREFERENCES.items():
                    preference = Preference(
                        user_id=new_user.id,
                        preference_type=preference_type,
                        value=value,
                    )
                    db_session.add(preference)
                db_session.commit()

                return User.from_model(new_user)
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

    user = register_uma(uma_user_name, currencies, kyc_status)
    login_user(user, remember=True)

    return jsonify({"user_id": user.id})


@bp.get("/<uma_user_name>")
async def uma(uma_user_name: str) -> Response:
    with Session(db.engine) as db_session:
        uma_model = db_session.scalars(
            select(UmaModel).where(UmaModel.username == uma_user_name)
        ).first()
        return jsonify({"available": uma_model is None})
