import base64
from typing import TYPE_CHECKING, Dict

from flask import Blueprint, Response, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import select
from sqlalchemy.orm import Session

from vasp.db import db
from vasp.models.Currency import Currency
from vasp.models.Preference import Preference, PreferenceType
from vasp.models.Transaction import Transaction
from vasp.models.Uma import Uma
from vasp.models.User import User as UserModel
from vasp.models.Wallet import Wallet
from vasp.models.WebAuthnCredential import WebAuthnCredential
from vasp.uma_vasp.config import Config
from vasp.uma_vasp.currencies import CURRENCIES
from vasp.uma_vasp.interfaces.currency_service import ICurrencyService
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.utils import get_uma_from_username, get_username_from_uma, get_vasp_domain

from . import notifications

if TYPE_CHECKING:
    current_user: User


DEFAULT_PREFERENCES: Dict[PreferenceType, str] = {
    PreferenceType.PUSH_NOTIFICATIONS: "true",
    PreferenceType.WALLET_SKIN: "default",
}


def construct_blueprint(
    config: Config,
    ledger_service: ILedgerService,
    currency_service: ICurrencyService,
) -> Blueprint:
    bp = Blueprint("user", __name__, url_prefix="/user")

    @bp.get("/")
    @login_required
    def get_user() -> Response:
        return jsonify(
            {
                "id": current_user.id,
                "google_id": current_user.google_id,
                "phone_number": current_user.phone_number,
                "webauthn_id": current_user.webauthn_id,
                "kyc_status": current_user.kyc_status.value,
                "email_address": current_user.email_address,
                "full_name": current_user.full_name,
            }
        )

    @bp.get("/id")
    @login_required
    def get_user_id() -> Response:
        return jsonify({"id": current_user.id})

    @bp.get("/balance")
    @login_required
    def balance() -> Response:
        uma = request.args.get("uma")
        if (uma is None) or (uma == ""):
            abort_with_error(400, "UMA is required to retrieve balance")
        balance, currency = ledger_service.get_wallet_balance(uma=uma)
        return jsonify(
            {
                "amount_in_lowest_denom": balance,
                "currency": {
                    "code": currency,
                    "name": CURRENCIES[currency].name,
                    "symbol": CURRENCIES[currency].symbol,
                    "decimals": CURRENCIES[currency].decimals,
                },
            }
        )

    @bp.get("/contacts")
    @login_required
    def contacts() -> Response:
        # TODO: get contacts from past transactions
        with Session(db.engine) as db_session:
            own_umas = db_session.scalars(
                select(Uma).where(Uma.user_id == current_user.id)
            ).all()
            recent_contacts = db_session.scalars(
                select(Uma)
                .join(Transaction)
                # .where(Uma.user_id == current_user.id)
                # .where(Transaction.user_id == current_user.id)
                .where(
                    Transaction.sender_uma.in_(
                        get_uma_from_username(uma.username) for uma in own_umas
                    )
                )
                .where(
                    Transaction.receiver_uma.notin_(
                        [get_uma_from_username(uma.username) for uma in own_umas]
                    )
                )
                .distinct(Uma.id)
                .order_by(Uma.id, Transaction.created_at.desc())
                .limit(5)
            ).all()
            return jsonify(
                {
                    "recent_contacts": [
                        {
                            "id": uma_model.id,
                            "uma": get_uma_from_username(uma_model.username),
                        }
                        for uma_model in recent_contacts
                    ],
                    "own_umas": [
                        {
                            "id": uma_model.id,
                            "uma": get_uma_from_username(uma_model.username),
                        }
                        for uma_model in own_umas
                    ],
                }
            )

    @bp.get("/username")
    @login_required
    def username() -> Response:
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == current_user.id)
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {current_user.id} not found.")
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
    @login_required
    def avatar() -> Response:
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == current_user.id)
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {current_user.id} not found.")
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
    @login_required
    def full_name() -> Response:
        with Session(db.engine) as db_session:
            user_model = db_session.scalars(
                select(UserModel).where(UserModel.id == current_user.id)
            ).first()
            if user_model is None:
                abort_with_error(404, f"User {current_user.id} not found.")

            if request.method == "GET":
                return jsonify({"full_name": user_model.full_name})
            else:
                request_json = request.json
                user_model.full_name = request_json.get("full_name")
                db_session.commit()
                response = jsonify({"full_name": user_model.full_name})
                response.status_code = 201
                return response

    @bp.post("/device-token")
    @login_required
    def device_token() -> Response:
        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(Wallet).where(Wallet.user_id == current_user.id)
            ).first()
            if wallet is None:
                abort_with_error(404, f"Wallet for {current_user.id} not found.")

            request_json = request.json
            wallet.device_token = request_json.get("device_token")
            db_session.commit()
            response = jsonify({"device_token": wallet.device_token})
            response.status_code = 201
            return response

    @bp.get("/umas")
    @login_required
    def umas() -> Response:
        return jsonify({"umas": [uma.to_dict() for uma in current_user.umas]})

    @bp.get("/wallets")
    @login_required
    def wallets() -> Response:
        with Session(db.engine) as db_session:
            wallets = db_session.scalars(
                select(Wallet).where(Wallet.user_id == current_user.id)
            ).all()

            return jsonify(
                {
                    "wallets": [
                        {
                            "id": wallet.id,
                            "amount_in_lowest_denom": wallet.amount_in_lowest_denom,
                            "color": wallet.color.value,
                            "device_token": wallet.device_token,
                            "uma": wallet.uma.to_dict(),
                            "currency": {
                                "code": wallet.currency.code,
                                "name": CURRENCIES[wallet.currency.code].name,
                                "symbol": CURRENCIES[wallet.currency.code].symbol,
                                "decimals": CURRENCIES[wallet.currency.code].decimals,
                            },
                        }
                        for wallet in wallets
                    ]
                }
            )

    @bp.put("/wallet/<wallet_id>")
    @login_required
    def update_wallet(wallet_id: str) -> Response:
        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(Wallet).where(Wallet.id == wallet_id)
            ).first()
            if wallet is None:
                abort_with_error(404, f"Wallet {wallet_id} not found.")
            request_json = request.json

            color = request_json.get("color")
            if color:
                wallet.color = color

            currency_code = request_json.get("currencyCode")
            if currency_code:
                currency = Currency(
                    wallet_id=wallet.id,
                    code=currency_code,
                )
                db_session.delete(wallet.currency)
                db_session.add(currency)
                wallet.currency = currency

            db_session.commit()

            response = jsonify(
                {
                    "id": wallet.id,
                    "amount_in_lowest_denom": wallet.amount_in_lowest_denom,
                    "color": wallet.color.value,
                    "device_token": wallet.device_token,
                    "uma": wallet.uma.to_dict(),
                    "currency": {
                        "code": wallet.currency.code,
                        "name": CURRENCIES[wallet.currency.code].name,
                        "symbol": CURRENCIES[wallet.currency.code].symbol,
                        "decimals": CURRENCIES[wallet.currency.code].decimals,
                    },
                }
            )
            response.status_code = 201
            return response

    @bp.delete("/wallet/<wallet_id>")
    @login_required
    def delete_wallet(wallet_id: str) -> Response:
        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(Wallet)
                .where(Wallet.user_id == current_user.id)
                .where(Wallet.id == wallet_id)
            ).first()
            if wallet is None:
                abort_with_error(404, f"Wallet {wallet_id} not found.")
            db_session.delete(wallet)
            db_session.delete(wallet.currency)
            db_session.delete(wallet.uma)
            db_session.commit()
            return jsonify({"message": f"Wallet {wallet_id} deleted."})

    @bp.put("/wallet/fund/<wallet_id>")
    @login_required
    def fund_wallet(wallet_id: str) -> Response:
        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(Wallet)
                .where(Wallet.user_id == current_user.id)
                .where(Wallet.id == wallet_id)
            ).first()
            if wallet is None:
                abort_with_error(404, f"Wallet {wallet_id} not found.")
            request_json = request.json
            amount_in_lowest_denom = request_json.get("amountInLowestDenom")
            if amount_in_lowest_denom:
                wallet.amount_in_lowest_denom += amount_in_lowest_denom
            db_session.commit()
            transaction = Transaction(
                user_id=wallet.user_id,
                uma_id=wallet.uma.id,
                transaction_hash="demo_funding_transaction_hash",
                amount_in_lowest_denom=amount_in_lowest_denom,
                currency_code=wallet.currency.code,
                sender_uma=f"$demo-funding-tx@{get_vasp_domain()}",
                receiver_uma=wallet.uma.username,
            )
            db_session.add(transaction)
            db_session.commit()
            return jsonify(
                {
                    "id": wallet.id,
                    "amount_in_lowest_denom": wallet.amount_in_lowest_denom,
                    "uma": wallet.uma.to_dict(),
                    "currency": {
                        "code": wallet.currency.code,
                        "name": CURRENCIES[wallet.currency.code].name,
                        "symbol": CURRENCIES[wallet.currency.code].symbol,
                        "decimals": CURRENCIES[wallet.currency.code].decimals,
                    },
                }
            )

    @bp.get("/transactions")
    @login_required
    def transactions() -> Response:
        uma = request.args.get("uma")
        if uma is None:
            abort_with_error(400, "UMA is required to retrieve transactions.")

        with Session(db.engine) as db_session:
            # TODO: Add pagination
            # Only returns transactions sent by current user and for the provided uma
            transactions = db_session.scalars(
                select(Transaction)
                .join(Uma)
                .where(Transaction.user_id == current_user.id)
                .where(Uma.username == get_username_from_uma(uma))
                .order_by(Transaction.created_at.desc())
                .limit(20)
            ).all()

            if not transactions:
                return jsonify([])

            response = [
                {
                    "id": transaction.id,
                    "amountInLowestDenom": (
                        transaction.amount_in_lowest_denom
                        if transaction.user_id == current_user.id
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
    @login_required
    def preferences() -> Response:
        with Session(db.engine) as db_session:
            preferences = db_session.scalars(
                select(Preference).where(Preference.user_id == current_user.id)
            ).all()

            if request.method == "GET":
                response = {
                    preference.preference_type.value: preference.value
                    for preference in preferences
                }
                return jsonify(response)

            if not request.is_json:
                abort_with_error(400, "Request is not in JSON format.")

            request_json = request.json
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
                        Preference.user_id == current_user.id,
                        Preference.preference_type == preference_type.upper(),
                    )
                ).first()

                if not preference:
                    preference = Preference(
                        user_id=current_user.id,
                        preference_type=preference_type.upper(),
                        value=value,
                    )
                    db_session.add(preference)

                preference.value = value

            db_session.commit()

            response = jsonify(request_json)
            response.status_code = 201
            return response

    @bp.get("/currencies")
    @login_required
    def currencies() -> Response:
        user_id = current_user.id

        with Session(db.engine) as db_session:
            currencies = db_session.scalars(
                select(Currency).join(Wallet).where(Wallet.user_id == user_id)
            ).all()
            response = [
                currency_service.get_uma_currency(currency.code)
                for currency in currencies
            ]
            return jsonify(response)

    @bp.get("/login_methods")
    @login_required
    def login_methods() -> Response:
        with Session(db.engine) as db_session:
            webauthn_credentials = db_session.scalars(
                select(WebAuthnCredential).where(
                    WebAuthnCredential.user_id == current_user.id
                )
            ).all()

            return jsonify(
                {
                    "webauthn_credentials": [
                        credential.to_dict() for credential in webauthn_credentials
                    ],
                }
            )

    @bp.delete("/webauthn/<credential_id>")
    @login_required
    def delete_webauthn_credential(credential_id: str) -> Response:
        with Session(db.engine) as db_session:
            credential = db_session.scalars(
                select(WebAuthnCredential)
                .where(WebAuthnCredential.user_id == current_user.id)
                .where(WebAuthnCredential.id == credential_id)
            ).first()
            if credential is None:
                abort_with_error(404, f"WebAuthnCredential {credential_id} not found.")
            db_session.delete(credential)
            db_session.commit()
            return jsonify({"message": f"WebAuthnCredential {credential_id} deleted."})

    bp.register_blueprint(notifications.construct_blueprint(config=config))

    return bp
