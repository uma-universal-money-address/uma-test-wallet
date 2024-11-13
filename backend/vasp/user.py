from typing import Dict
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_
import base64


from flask import Blueprint, Response, request, session, jsonify

from vasp.db import db
from vasp.models.User import User as UserModel
from vasp.models.Wallet import Wallet
from vasp.models.Uma import Uma
from vasp.models.Currency import Currency
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.models.Preference import Preference, PreferenceType
from vasp.models.Transaction import Transaction
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.uma_vasp.interfaces.currency_service import (
    ICurrencyService,
)

DEFAULT_PREFERENCES: Dict[PreferenceType, str] = {
    PreferenceType.PUSH_NOTIFICATIONS: "true",
    PreferenceType.WALLET_SKIN: "default",
}


def construct_blueprint(
    ledger_service: ILedgerService,
    currency_service: ICurrencyService,
) -> Blueprint:
    bp = Blueprint("user", __name__, url_prefix="/user")

    @bp.get("/id")
    def get_user_id() -> Response:
        user_id = session.get("user_id")
        return jsonify({"id": user_id})

    @bp.get("/balance")
    def balance() -> Response:
        balance = ledger_service.get_user_balance()
        return jsonify(balance)

    @bp.get("/contacts")
    def contacts() -> Response:
        # TODO: get contacts from past transactions
        with Session(db.engine) as db_session:
            user_id = session.get("user_id")
            user_models = db_session.scalars(
                select(UserModel).where(UserModel.id != user_id)
            ).all()
            users = [User.from_model(user_model) for user_model in user_models]
            response = [
                {
                    "id": str(user.id),
                    "name": user.full_name,
                    "uma": user.get_default_uma_address(),
                }
                for user in users
            ]
            return jsonify(response)

    @bp.get("/username")
    def username() -> Response:
        user_id = session.get("user_id")
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == user_id)
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {user_id} not found.")
            return jsonify({"username": user_model.username})

    @bp.get("/avatar/<user_id>")
    def avatar_uma_user_name(user_id: str) -> Response:
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == int(user_id))
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {user_id} not found.")
            if user_model.avatar:
                return jsonify({"avatar": base64.b64encode(user_model.avatar).decode()})
            else:
                return jsonify({"avatar": None})

    @bp.route("/avatar", methods=["GET", "POST"])
    async def avatar() -> Response:
        user_id = session.get("user_id")
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == user_id)
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {user_id} not found.")
            if request.method == "POST":
                request_files = request.files
                fs = request_files.get("avatar")
                if fs:
                    data = fs.stream.read()
                    user_model.avatar = data
                    db_session.commit()
                    response = jsonify({"avatar": base64.b64encode(data).decode()})
                    response.status_code = 201
                    return response
                raise ValueError("No file provided")
            else:
                data = user_model.avatar
                if data:
                    return jsonify({"avatar": base64.b64encode(data).decode()})
                else:
                    return jsonify({"avatar": None})

    @bp.route("/full-name", methods=["GET", "POST"])
    async def full_name() -> Response:
        user_id = session.get("user_id")
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == user_id)
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {user_id} not found.")

            if request.method == "GET":
                return jsonify({"full_name": user_model.full_name})
            else:
                request_json = await request.json
                user_model.full_name = request_json.get("full_name")
                db_session.commit()
                response = jsonify({"full_name": user_model.full_name})
                response.status_code = 201
                return response

    @bp.post("/device-token")
    async def device_token() -> Response:
        user_id = session.get("user_id")
        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(Wallet).where(Wallet.user_id == user_id)
            ).first()
            if wallet is None:
                abort_with_error(404, f"Wallet for {user_id} not found.")

            request_json = await request.json
            wallet.device_token = request_json.get("device_token")
            db_session.commit()
            response = jsonify({"device_token": wallet.device_token})
            response.status_code = 201
            return response

    @bp.route("/uma", methods=["GET", "POST"])
    async def uma() -> Response:
        user_id = session.get("user_id")

        if request.method == "GET":
            user = User.from_id(user_id)
            if user is None:
                abort_with_error(404, f"User {user_id} not found.")
            return jsonify({"uma": user.get_default_uma_address()})
        else:
            with Session(db.engine) as db_session:
                user_model = db_session.scalars(
                    select(UserModel).where(UserModel.id == user_id)
                ).first()
                if user_model is None:
                    abort_with_error(404, f"User {user_id} not found.")

                request_json = await request.json
                # Set the default UMA to False for all UMAs if the new UMA is default
                if request_json.get("default"):
                    uma_models = db_session.scalars(
                        select(Uma).where(Uma.user_id == user_id, Uma.default)
                    ).all()

                    for uma_model in uma_models:
                        uma_model.default = False

                # Create a new UMA for the user
                uma = Uma(
                    user_id=user_id,
                    username=request_json.get("uma_user_name"),
                    default=request_json.get("default") or False,
                )

                db_session.commit()

                return jsonify({"uma": uma})

    @bp.get("/umas")
    def umas() -> Response:
        user_id = session.get("user_id")

        user = User.from_id(user_id)
        if user is None:
            abort_with_error(404, f"User {user_id} not found.")
        return jsonify({"uma": user.umas})

    @bp.get("/transactions")
    def transactions() -> Response:
        user_id = session.get("user_id")
        user = User.from_id(user_id)

        if user is None:
            abort_with_error(404, f"User {user_id} not found.")

        with Session(db.engine) as db_session:
            # TODO: Add pagination
            transactions = db_session.scalars(
                select(Transaction)
                .where(
                    or_(
                        Transaction.sender_uma == user.get_default_uma_address(),
                        Transaction.receiver_uma == user.get_default_uma_address(),
                    )
                )
                .order_by(Transaction.created_at.desc())
                .limit(20)
            ).all()
            if not transactions:
                return jsonify([])

            response = [
                {
                    "amountInLowestDenom": (
                        transaction.amount_in_lowest_denom
                        if transaction.user_id == user_id
                        else -transaction.amount_in_lowest_denom
                    ),
                    "currencyCode": transaction.currency_code,
                    "senderUma": transaction.sender_uma,
                    "receiverUma": transaction.receiver_uma,
                    "createdAt": transaction.created_at,
                }
                for transaction in transactions
            ]
            return jsonify(response)

    @bp.route("/preferences", methods=["POST", "GET"])
    async def preferences() -> Response:
        user_id = session.get("user_id")

        with Session(db.engine) as db_session:
            preferences = db_session.scalars(
                select(Preference).where(Preference.user_id == user_id)
            ).all()

            if request.method == "GET":
                response = {
                    preference.preference_type.value: preference.value
                    for preference in preferences
                }
                return jsonify(response)

            if not request.is_json:
                abort_with_error(400, "Request is not in JSON format.")

            request_json = await request.json
            # Check if valid PreferenceType
            for preference_type in request_json.keys():
                if preference_type.upper() not in [e.value for e in PreferenceType]:
                    abort_with_error(
                        400,
                        f"Invalid preference type {preference_type.upper()}.",
                    )

            for preference_type, value in request_json.items():
                preference = db_session.scalars(
                    select(Preference).where(
                        Preference.user_id == user_id,
                        Preference.preference_type == preference_type.upper(),
                    )
                ).first()

                if not preference:
                    preference = Preference(
                        user_id=user_id,
                        preference_type=preference_type.upper(),
                        value=value,
                    )
                    db_session.add(preference)

                preference.value = value

            db_session.commit()

            response = jsonify(request_json)
            response.status_code = 201
            return response

    @bp.route("/currencies", methods=["POST", "GET"])
    async def currencies() -> Response:
        user_id = session.get("user_id")

        with Session(db.engine) as db_session:
            if request.method == "GET":
                currencies = db_session.scalars(
                    select(Currency).where(Currency.user_id == user_id)
                ).all()
                response = [
                    currency_service.get_uma_currency(currency.code)
                    for currency in currencies
                ]
                return jsonify(response)

            # For POST requests:
            if not request.is_json:
                abort_with_error(400, "Request is not in JSON format.")

            request_json = await request.json
            for currency_code in request_json:
                currency = db_session.scalars(
                    select(Currency).where(
                        Currency.user_id == user_id,
                        Currency.code == currency_code,
                    )
                ).first()

                if not currency:
                    currency = Currency(
                        user_id=user_id,
                        code=currency_code,
                    )
                    db_session.add(currency)

            # remove any currencies not in the request
            currencies = db_session.scalars(
                select(Currency).where(Currency.user_id == user_id)
            ).all()
            for currency in currencies:
                if currency.code not in request_json:
                    db_session.delete(currency)

            db_session.commit()

            response = jsonify(request_json)
            response.status_code = 201
            return response

    return bp
