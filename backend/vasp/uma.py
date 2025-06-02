import json
import logging
import random
from typing import TYPE_CHECKING, List
from uuid import uuid4

from flask import Blueprint, Response, jsonify, request
from flask_login import current_user, login_user, login_required
from sqlalchemy import exc, func, select
from sqlalchemy.orm import Session
from uma import (
    KycStatus,
    INonceCache,
    IPublicKeyCache,
    InvalidSignatureException,
    PostTransactionCallback,
    fetch_public_key_for_vasp,
    verify_post_transaction_callback_signature,
)

from vasp.db import db
from vasp.models.Currency import Currency
from vasp.models.Preference import Preference
from vasp.models.Uma import Uma as UmaModel
from vasp.models.User import User as UserModel
from vasp.models.Wallet import Color
from vasp.models.Wallet import Wallet as WalletModel
from vasp.uma_vasp.currencies import CURRENCIES
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.user import DEFAULT_PREFERENCES
from vasp.username_dict import APPROVED_ADJECTIVES, APPROVED_NOUNS
from vasp.uma_vasp.uma_exception import UmaException

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)


def register_uma(
    uma_user_name: str,
    currencies: List[str],
    kyc_status: KycStatus,
    initial_amount: int = 0,
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
                        email_address=f"{uma_user_name}@test.uma.me",
                        full_name=f"{uma_user_name}",
                    )
                    db_session.add(user)

                new_wallet = WalletModel(
                    id=str(uuid4()),
                    user_id=user.id,
                    amount_in_lowest_denom=initial_amount,
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


def construct_blueprint(
    pubkey_cache: IPublicKeyCache, nonce_cache: INonceCache
) -> Blueprint:
    bp = Blueprint("uma", __name__, url_prefix="/api/uma")

    @bp.post("")
    def create_uma() -> Response:
        data = request.get_json()
        uma_user_name = data["uma_user_name"]
        if not uma_user_name:
            abort_with_error(400, "UMA user name is required.")

        initial_amount = data.get("initial_amount", 0)

        if current_user.is_authenticated:
            with Session(db.engine) as db_session:
                count_uma_current_user = db_session.scalar(
                    select(func.count(UmaModel.username)).where(
                        UmaModel.user_id == current_user.id
                    )
                )
                if count_uma_current_user >= 10:
                    abort_with_error(
                        400, "You have reached the maximum number of UMAs."
                    )
        currencies = ["SAT"]
        # Default to verified for the purpose of this demo app
        kyc_status = KycStatus.VERIFIED

        user, wallet = register_uma(
            uma_user_name=uma_user_name,
            currencies=currencies,
            kyc_status=kyc_status,
            initial_amount=initial_amount,
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
                    "currency": {
                        "code": wallet_fresh.currency.code,
                        "name": CURRENCIES[wallet_fresh.currency.code].name,
                        "symbol": CURRENCIES[wallet_fresh.currency.code].symbol,
                        "decimals": CURRENCIES[wallet_fresh.currency.code].decimals,
                    },
                }
            )

    @bp.get("/<uma_user_name>")
    def uma(uma_user_name: str) -> Response:
        with Session(db.engine) as db_session:
            uma_model = db_session.scalars(
                select(UmaModel).where(UmaModel.username == uma_user_name)
            ).first()
            return jsonify({"available": uma_model is None})

    @bp.put("/<uma_user_name>")
    @login_required
    def update_uma(uma_user_name: str) -> Response:
        with Session(db.engine) as db_session:
            uma_model = db_session.scalars(
                select(UmaModel).where(UmaModel.username == uma_user_name)
            ).first()

            if uma_model is None:
                abort_with_error(404, "UMA not found")

            if uma_model.user_id != current_user.id:
                abort_with_error(403, "Not authorized to modify this UMA")

            request_json = request.json
            new_username = request_json.get("username")

            if not new_username:
                abort_with_error(400, "New username is required")

            # Check if new username already exists
            existing_uma = db_session.scalars(
                select(UmaModel).where(UmaModel.username == new_username)
            ).first()

            if existing_uma:
                abort_with_error(400, "Username already taken")

            uma_model.username = new_username
            db_session.commit()

            return jsonify(uma_model.to_dict())

    @bp.get("/generate_random_uma")
    def generate_random_uma() -> Response:
        random_uma = _generate_random_uma()
        return (
            jsonify({"uma": random_uma})
            if random_uma
            else jsonify({"error": "Random generation attempts exhausted"})
        )

    @bp.post("/utxoCallback")
    def handle_utxo_callback() -> str:
        print(f"Received UTXO callback for {request.args.get('txid')}:")
        try:
            tx_callback = PostTransactionCallback.from_json(json.dumps(request.json))
        except Exception as e:
            raise UmaException(
                status_code=400, message=f"Error parsing UTXO callback: {e}"
            )

        print(tx_callback.to_json())

        if tx_callback.vasp_domain:
            other_vasp_pubkeys = fetch_public_key_for_vasp(
                vasp_domain=tx_callback.vasp_domain,
                cache=pubkey_cache,
            )
            try:
                verify_post_transaction_callback_signature(
                    tx_callback, other_vasp_pubkeys, nonce_cache
                )
            except InvalidSignatureException as e:
                raise UmaException(
                    f"Error verifying post-tx callback signature: {e}", 424
                )

        return "OK"

    return bp


def _generate_random_uma(batch_size: int = 100, max_attempts: int = 100) -> str | None:
    attempts = 0

    while attempts < max_attempts:
        generated_usernames = set[str](
            f"{random.choice(APPROVED_ADJECTIVES).lower()}-{random.choice(APPROVED_NOUNS).lower()}-{random.randint(0, 999):03d}"
            for _ in range(batch_size)
        )
        available_set = _available_umas_in_set(generated_usernames)
        if available_set:
            return random.choice(list(available_set))
        attempts += 1
    return None


def _available_umas_in_set(umaSet: set[str]) -> set[str]:
    with Session(db.engine) as db_session:
        existing_uma = db_session.scalars(
            select(UmaModel).where(UmaModel.username.in_(umaSet))
        ).all()
        return umaSet - set(existing_uma)
