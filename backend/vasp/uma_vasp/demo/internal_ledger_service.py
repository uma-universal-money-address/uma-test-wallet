import logging
from typing import Any, Dict
from sqlalchemy import select
from sqlalchemy.orm import Session
from vasp.db import db
from quart import session, current_app
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.models.Wallet import Wallet
from vasp.models.Transaction import Transaction
from vasp.uma_vasp.user import User
from vasp.uma_vasp.lightspark_helpers import get_node
from vasp.uma_vasp.config import Config, get_http_host
from lightspark import LightsparkSyncClient as LightsparkClient

log: logging.Logger = logging.getLogger(__name__)


class InternalLedgerService(ILedgerService):
    def get_user_balance(self) -> int:
        with Session(db.engine) as db_session:
            wallet = get_wallet(db_session)
            if wallet:
                return wallet.amount_in_lowest_denom

            return 0

    def add_user_balance(self, amount: int, currency_code: str, sender_uma: str) -> int:
        if amount < 0:
            raise ValueError("Amount must be positive")

        user_id = session.get("user_id")
        user = User.from_id(user_id)
        if not user:
            raise ValueError("User not found")

        user_uma = user.get_default_uma_address()

        with Session(db.engine) as db_session:
            # Update the wallet
            wallet = get_wallet_or_throw(db_session)
            wallet.amount_in_lowest_denom += amount

            # Add a transaction
            transaction = Transaction(
                user_id=user.id,
                amount_in_lowest_denom=amount,
                currency_code=currency_code,
                sender_uma=sender_uma,
                receiver_uma=user_uma,
            )
            db_session.add(transaction)
            db_session.commit()

            return wallet.amount_in_lowest_denom

    def subtract_user_balance(
        self, amount: int, currency_code: str, receiver_uma: str
    ) -> int:
        if amount <= 0:
            raise ValueError("Amount must be positive")

        user_id = session.get("user_id")
        user = User.from_id(user_id)
        if not user:
            raise ValueError("User not found")
        user_uma = user.get_default_uma_address()

        with Session(db.engine) as db_session:
            # Update the wallet
            wallet = get_wallet_or_throw(db_session)
            if wallet.amount_in_lowest_denom < amount:
                raise ValueError("Insufficient funds")
            wallet.amount_in_lowest_denom -= amount

            # Add a transaction
            transaction = Transaction(
                user_id=user.id,
                amount_in_lowest_denom=-amount,
                currency_code=currency_code,
                sender_uma=user_uma,
                receiver_uma=receiver_uma,
            )
            db_session.add(transaction)
            db_session.commit()

            return wallet.amount_in_lowest_denom


def get_wallet(db_session: Session) -> Wallet | None:
    user_id = session.get("user_id")
    wallet = db_session.scalars(select(Wallet).where(Wallet.user_id == user_id)).first()

    # TODO: Repulls the balance from the node. Eventually we can
    # configure webhooks to update the balance in real-time.
    config = Config.get(current_app.config)
    host = get_http_host()
    lightspark_client = LightsparkClient(
        api_token_client_id=config.api_token_client_id,
        api_token_client_secret=config.api_token_client_secret,
        base_url=config.base_url,
        http_host=host,
    )

    node = None
    try:
        node = get_node(lightspark_client, config.node_id)

        if "OSK" in node.typename:
            password = config.osk_node_signing_key_password
            if not password:
                raise InternalLedgerException(
                    message="OSK node signing key password is not set.",
                    status_code=500,
                )
            lightspark_client.recover_node_signing_key(config.node_id, password)
        else:
            log.warning("Configured node is not an OSK node.")
            raise InternalLedgerException(
                message="Configured node is not an OSK node.",
                status_code=400,
            )
    except Exception as e:
        log.warning(f"Error recovering node signing key when loading wallet: {e}")
        raise InternalLedgerException(
            message=f"Error recovering node signing key when loading wallet: {e}",
            status_code=500,
        )

    # TODO: Handle currencies besides SATs here.
    if node.local_balance is None:
        raise InternalLedgerException(
            message="Node balance is not available", status_code=500
        )
    node_amount_in_sats = round(node.local_balance.original_value / 1000)

    if node_amount_in_sats != wallet.amount_in_lowest_denom:
        wallet.amount_in_lowest_denom = node_amount_in_sats
        db_session.commit()

    return wallet


def get_wallet_or_throw(db_session: Session) -> Wallet:
    wallet = get_wallet(db_session)
    if not wallet:
        raise ValueError("User does not have a wallet")
    return wallet


class InternalLedgerException(Exception):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code

    def __str__(self) -> str:
        return (
            f"InternalLedgerException: {self.message}, Status Code: {self.status_code}"
        )

    def to_dict(self) -> Dict[str, Any]:
        return {"reason": self.message, "status": "ERROR"}
