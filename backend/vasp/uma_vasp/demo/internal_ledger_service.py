import logging
from typing import Any, Dict
from sqlalchemy import select
from sqlalchemy.orm import Session
from vasp.db import db
from flask_login import current_user
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.models.Wallet import Wallet
from vasp.models.Uma import Uma
from vasp.models.Transaction import Transaction
from vasp.uma_vasp.user import User

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)


class InternalLedgerService(ILedgerService):
    def get_wallet_balance(self, uma: str) -> tuple[int, str]:
        with Session(db.engine) as db_session:
            wallet = get_wallet_or_throw(db_session, uma)
            return wallet.amount_in_lowest_denom, wallet.currency.code

    # This method is used to add balance to the wallet of the receiver_uma
    def add_wallet_balance(
        self, amount: int, currency_code: str, sender_uma: str, receiver_uma: str
    ) -> int:
        if amount < 0:
            raise ValueError("Amount must be positive")

        with Session(db.engine) as db_session:
            # Update the wallet
            wallet = get_wallet_or_throw(db_session, receiver_uma)
            wallet.amount_in_lowest_denom += amount

            # Add a transaction
            transaction = Transaction(
                user_id=current_user.id,
                amount_in_lowest_denom=amount,
                currency_code=currency_code,
                sender_uma=sender_uma,
                receiver_uma=receiver_uma,
            )
            db_session.add(transaction)
            db_session.commit()

            return wallet.amount_in_lowest_denom

    # This method is used to subtract balance from the wallet of the sender_uma
    def subtract_wallet_balance(
        self, amount: int, currency_code: str, sender_uma: str, receiver_uma: str
    ) -> int:
        if amount <= 0:
            raise ValueError("Amount must be positive")

        with Session(db.engine) as db_session:
            # Update the wallet
            wallet = get_wallet_or_throw(db_session, sender_uma)
            if wallet.amount_in_lowest_denom < amount:
                raise ValueError("Insufficient funds")
            wallet.amount_in_lowest_denom -= amount

            # Add a transaction
            transaction = Transaction(
                user_id=current_user.id,
                amount_in_lowest_denom=-amount,
                currency_code=currency_code,
                sender_uma=sender_uma,
                receiver_uma=receiver_uma,
            )
            db_session.add(transaction)
            db_session.commit()

            return wallet.amount_in_lowest_denom


def get_wallet(db_session: Session, uma: str) -> Wallet | None:
    # get username from uma like $username@vasp.com
    username = uma.split("@")[0][1:]
    wallet = db_session.scalars(
        select(Wallet)
        .join(Uma)
        .where(Uma.wallet_id == Wallet.id, Uma.username == username)
    ).first()

    return wallet


def get_wallet_or_throw(db_session: Session, uma: str) -> Wallet:
    wallet = get_wallet(db_session, uma)
    if not wallet:
        raise ValueError("User does not have a wallet corresponding to uma")
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
