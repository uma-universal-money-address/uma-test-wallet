from datetime import datetime, timezone
from typing import Any, Tuple

import jwt
from bolt11 import decode as bolt11_decode
from flask_login import current_user
from flask import Blueprint, Response, current_app, jsonify, request, session
from vasp.uma_vasp.currencies import CURRENCIES
from lightspark import LightsparkSyncClient
from lightspark.objects.CurrencyUnit import CurrencyUnit
from lightspark.objects.TransactionStatus import TransactionStatus
from lightspark.utils.currency_amount import amount_as_msats
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_
from vasp.db import db
from vasp.utils import get_vasp_domain
from vasp.models.Quote import Quote
from vasp.models.Transaction import Transaction
from vasp.uma_vasp.config import Config
from vasp.uma_vasp.interfaces.compliance_service import IComplianceService
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.uma_vasp.interfaces.request_storage import IRequestStorage
from vasp.uma_vasp.interfaces.sending_vasp_request_cache import (
    ISendingVaspRequestCache,
)
from vasp.uma_vasp.interfaces.currency_service import ICurrencyService
from vasp.uma_vasp.interfaces.user_service import IUserService
from vasp.uma_vasp.lightspark_helpers import get_node
from vasp.uma_vasp.sending_vasp import SendingVasp, get_sending_vasp
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from uma import Currency
from uma.nonce_cache import INonceCache
from uma.public_key_cache import IPublicKeyCache
from uma_auth.models.currency_preference import CurrencyPreference
from uma_auth.models.currency import Currency as UmaCurrency
from uma_auth.models.execute_quote_response import ExecuteQuoteResponse
from uma_auth.models.get_balance_response import GetBalanceResponse
from uma_auth.models.transaction import Transaction as UmaTransaction
from uma_auth.models.lookup_user_response import LookupUserResponse
from uma_auth.models.make_invoice_request import MakeInvoiceRequest
from uma_auth.models.pay_invoice_request import PayInvoiceRequest
from uma_auth.models.pay_invoice_response import PayInvoiceResponse
from uma_auth.models.pay_to_address_request import PayToAddressRequest
from uma_auth.models.pay_to_address_response import PayToAddressResponse
from uma_auth.models.get_info_response import GetInfoResponse
from uma_auth.models.quote import Quote as UmaQuote
from uma_auth.models.transaction_type import TransactionType

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User


class UmaNwcBridge:
    def __init__(
        self,
        ledger_service: ILedgerService,
        currency_service: ICurrencyService,
        lightspark_client: LightsparkSyncClient,
        sending_vasp: SendingVasp,
        config: Config,
    ) -> None:
        self.ledger_service = ledger_service
        self.currency_service = currency_service
        self.lightspark_client = lightspark_client
        self.sending_vasp = sending_vasp
        self.config = config

    def _load_signing_key(self) -> None:
        node = get_node(self.lightspark_client, self.config.node_id)

        if "OSK" in node.typename:
            osk_password = self.config.osk_node_signing_key_password
            if not osk_password:
                abort_with_error(
                    400,
                    "OSK password is required for OSK nodes.",
                )
            self.lightspark_client.recover_node_signing_key(
                self.config.node_id, osk_password
            )
            return

        # Assume remote signing.
        master_seed = self.config.get_remote_signing_node_master_seed()
        if not master_seed:
            abort_with_error(
                400, "Remote signing master seed is required for remote signing nodes."
            )
        self.lightspark_client.provide_node_master_seed(
            self.config.node_id, master_seed, node.bitcoin_network
        )

    def transactions(self) -> Response:
        user_id = session.get("user_id")
        user = User.from_id(user_id)

        if user is None:
            abort_with_error(404, "User not found")

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

            # TODO: This isn't the right nwc format, but will fix later.
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

    async def handle_pay_invoice(self) -> dict[str, Any]:
        user_id = session.get("user_id")
        if not user_id:
            abort_with_error(401, "Unauthorized")
        user = User.from_id(user_id)
        if user is None:
            abort_with_error(404, f"User {user_id} not found.")

        request_json = await request.get_json()
        if not request_json:
            abort_with_error(400, "Request must be JSON")
        try:
            request_data = PayInvoiceRequest.from_dict(request_json)
        except Exception as e:
            abort_with_error(400, f"Invalid request: {e}")

        invoice = request_data.invoice
        try:
            bolt11 = bolt11_decode(invoice)
        except Exception as e:
            abort_with_error(400, f"Invalid invoice: {e}")

        amount = request_data.amount
        if not bolt11.amount_msat:
            if not amount:
                abort_with_error(400, "Need to provide amount for 0 amount invoice.")
        elif amount and amount != bolt11.amount_msat:
            abort_with_error(400, "Amount does not match invoice amount.")

        self._load_signing_key()
        payment_result = self.lightspark_client.pay_invoice(
            self.config.node_id,
            invoice,
            timeout_secs=60,
            maximum_fees_msats=1000,
            amount_msats=amount,
        )
        if not payment_result:
            abort_with_error(500, "Payment failed.")
        payment = self.sending_vasp.wait_for_payment_completion(payment_result)
        if payment.status != TransactionStatus.SUCCESS:
            abort_with_error(
                500,
                f"Payment failed. {payment.failure_message}",
            )

        amount_sats = payment.amount.convert_to(
            CurrencyUnit.SATOSHI
        ).preferred_currency_value_rounded
        default_uma = user.get_default_uma_address()
        self.ledger_service.subtract_wallet_balance(
            amount_sats, "SAT", default_uma, "NWC"
        )
        preimage = payment_result.payment_preimage
        if not preimage:
            abort_with_error(500, "Payment preimage not found.")
        return PayInvoiceResponse(preimage=preimage).to_dict()

    async def handle_create_invoice(self) -> dict[str, Any]:
        request_json = await request.get_json()
        if not request_json:
            abort_with_error(400, "Request must be JSON")
        try:
            request_data = MakeInvoiceRequest.from_dict(request_json)
        except Exception as e:
            abort_with_error(400, f"Invalid request: {e}")

        invoice = self.lightspark_client.create_invoice(
            self.config.node_id,
            request_data.amount,
            request_data.description,
            expiry_secs=request_data.expiry,
        )
        return UmaTransaction(
            amount=amount_as_msats(invoice.data.amount),
            created_at=round(invoice.created_at.timestamp()),
            description_hash="",  # Not exposed in lightspark api.
            expires_at=round(invoice.data.expires_at.timestamp()),
            invoice=invoice.data.encoded_payment_request,
            payment_hash=invoice.data.payment_hash,
            description=invoice.data.memo,
            type=TransactionType.INCOMING,
        ).to_dict()

    def handle_get_invoice(self, payment_hash: str) -> dict[str, Any]:
        # It's pretty ugly to have to check both incoming and outgoing payments here, but
        # the Lightspark API doesn't make it easy to get all the information we need in one
        # call.
        invoice = self.lightspark_client.invoice_for_payment_hash(payment_hash)
        payments = self.lightspark_client.outgoing_payments_for_payment_hash(
            payment_hash
        )
        if not invoice and (not payments or len(payments) == 0):
            abort_with_error(404, "Invoice not found.")
        if not invoice:
            payment_request = payments[0].payment_request_data
            if not payment_request:
                abort_with_error(404, "No payment_request for this payment.")
            decoded_bolt11 = bolt11_decode(payment_request.encoded_payment_request)
        is_outgoing = payments and len(payments) > 0
        resolved_at = payments[0].resolved_at if is_outgoing else None
        settled_at = None
        if resolved_at:
            settled_at = round(resolved_at.timestamp())
        return UmaTransaction(
            amount=(
                amount_as_msats(invoice.data.amount)
                if invoice
                else decoded_bolt11.amount_msat
            ),
            created_at=round(
                (
                    invoice.created_at if invoice else decoded_bolt11.date_time
                ).timestamp()
            ),
            expires_at=round(
                (
                    invoice.data.expires_at if invoice else decoded_bolt11.expiry_date
                ).timestamp()
            ),
            settled_at=settled_at,
            payment_hash=payment_hash,
            invoice=(
                invoice.data.encoded_payment_request
                if invoice
                else payment_request.encoded_payment_request
            ),
            description=invoice.data.memo if invoice else decoded_bolt11.description,
            type=TransactionType.OUTGOING if is_outgoing else TransactionType.INCOMING,
        ).to_dict()

    def handle_get_info(self) -> dict[str, Any]:
        user_id = session["user_id"]
        user = User.from_id(user_id)
        if user is None:
            abort_with_error(404, f"User {user_id} not found.")

        currencies = (
            [
                user_currency_to_uma_auth_currency(
                    self.currency_service.get_uma_currency(wallet.currency.code)
                )
                for wallet in user.wallets
            ]
            if user.wallets
            else []
        )

        return GetInfoResponse(
            alias="UMA Sandbox",
            pubkey=self.config.signing_pubkey_hex,
            network=self.config.bitcoin_network,
            methods=[
                "pay_invoice",
                "make_invoice",
                "lookup_invoice",
                "get_balance",
                "get_info",
                "list_transactions",
                "pay_keysend",
                "lookup_user",
                "fetch_quote",
                "execute_quote",
                "pay_to_address",
            ],
            lud16=user.get_default_uma_address(),
            currencies=currencies,
        ).to_dict()

    def handle_lookup_user(self, receiver_uma: str) -> dict[str, Any]:
        lookup_response = self.sending_vasp.handle_uma_lookup(receiver_uma)
        currencies = lookup_response.get("receiverCurrencies") or []
        return LookupUserResponse(
            currencies=[
                CurrencyPreference(
                    currency=UmaCurrency(
                        code=currency.get("code"),
                        symbol=currency.get("symbol"),
                        decimals=currency.get("decimals"),
                        name=currency.get("name"),
                    ),
                    multiplier=currency.get("multiplier"),
                    min=(
                        currency.get("convertible").get("min")
                        if "convertible" in currency
                        else currency.get("minSendable")
                    ),
                    max=(
                        currency.get("convertible").get("max")
                        if "convertible" in currency
                        else currency.get("maxSendable")
                    ),
                )
                for currency in currencies
            ]
        ).to_dict()

    def handle_get_quote(self) -> dict[str, Any]:
        receiving_uma = request.args.get("receiver_address")
        sending_currency_code = request.args.get("sending_currency_code")
        receiving_currency_code = request.args.get("receiving_currency_code")
        locked_currency_amount = request.args.get("locked_currency_amount")
        locked_currency_side = request.args.get("locked_currency_side")
        is_sender_locked = (
            locked_currency_side is None or locked_currency_side.lower() == "sending"
        )
        if (
            not receiving_uma
            or not sending_currency_code
            or not receiving_currency_code
            or not locked_currency_amount
        ):
            abort_with_error(400, "Missing required parameters")
        if not locked_currency_amount.isnumeric():
            abort_with_error(400, "Invalid locked currency amount")
        if (
            not is_sender_locked
            and locked_currency_side
            and locked_currency_side.lower() != "receiving"
        ):
            abort_with_error(400, "Invalid locked currency side")
        uma_lookup_result = self.sending_vasp.handle_uma_lookup(receiving_uma)
        receiving_currencies = uma_lookup_result.get("receiverCurrencies")
        if not receiving_currencies:
            abort_with_error(400, "Receiver not found")

        receiving_currency = next(
            (
                currency
                for currency in receiving_currencies
                if currency.get("code") == receiving_currency_code
            ),
            None,
        )

        if not receiving_currency:
            abort_with_error(400, "Receiver does not accept the specified currency")

        if (
            is_sender_locked
            and sending_currency_code != "BTC"
            and sending_currency_code != "SAT"
        ):
            abort_with_error(
                400, "Sending currencies besides BTC are not yet supported"
            )

        uma_payreq_result = self.sending_vasp.handle_uma_payreq(
            uma_lookup_result["callbackUuid"],
            is_amount_in_msats=is_sender_locked,
            amount=(
                int(locked_currency_amount) * 1000
                if is_sender_locked
                else int(locked_currency_amount)
            ),
            receiving_currency_code=receiving_currency_code,
            user_id=session["user_id"],
        )

        with Session(db.engine) as db_session:
            quote = Quote(
                payment_hash=uma_payreq_result.payment_hash,
                expires_at=datetime.fromtimestamp(
                    uma_payreq_result.invoice_expires_at, tz=timezone.utc
                ),
                multiplier=uma_payreq_result.conversion_rate / 1000,
                sending_currency_code=sending_currency_code,
                receiving_currency_code=receiving_currency_code,
                fees=round(uma_payreq_result.exchange_fees_msats / 1000),
                total_sending_amount=round(uma_payreq_result.amount_msats / 1000),
                total_receiving_amount=uma_payreq_result.amount_receiving_currency,
                callback_uuid=uma_payreq_result.callback_uuid,
                user_id=session["user_id"],
            )
            db_session.add(quote)
            db_session.commit()
            return UmaQuote(
                payment_hash=quote.payment_hash,
                expires_at=uma_payreq_result.invoice_expires_at,
                multiplier=quote.multiplier,
                sending_currency=UmaCurrency(
                    code="SAT",
                    symbol=CURRENCIES["SAT"].symbol,
                    name=CURRENCIES["SAT"].name,
                    decimals=CURRENCIES["SAT"].decimals,
                ),
                receiving_currency=UmaCurrency(
                    code=receiving_currency.get("code"),
                    symbol=receiving_currency.get("symbol"),
                    name=receiving_currency.get("name"),
                    decimals=receiving_currency.get("decimals"),
                ),
                fees=quote.fees,
                total_sending_amount=quote.total_sending_amount,
                total_receiving_amount=quote.total_receiving_amount,
                created_at=round(quote.created_at.timestamp()),
            ).to_dict()

    def handle_execute_quote(self, payment_hash: str) -> dict[str, Any]:
        with Session(db.engine) as db_session:
            quote = db_session.scalars(
                select(Quote).where(Quote.payment_hash == payment_hash)
            ).first()
            if not quote:
                abort_with_error(404, "Quote not found")
            if quote.user_id != session["user_id"]:
                abort_with_error(403, "Quote does not belong to user")
            if quote.settled_at:
                abort_with_error(400, "Quote already settled")
            if quote.expires_at.timestamp() < datetime.now().timestamp():
                abort_with_error(400, "Quote expired")

        payment = self.sending_vasp.handle_send_payment(quote.callback_uuid)

        with Session(db.engine) as db_session:
            quote.settled_at = payment.get("settledAt")
            db_session.commit()

        return ExecuteQuoteResponse(preimage=payment.get("preimage")).to_dict()

    async def handle_pay_to_address(self) -> dict[str, Any]:
        request_json = await request.get_json()
        if not request_json:
            abort_with_error(400, "Request must be JSON")

        try:
            request_data = PayToAddressRequest.from_dict(request_json)
        except Exception as e:
            abort_with_error(400, f"Invalid request: {e}")

        if (
            request_data.sending_currency_code != "BTC"
            and request_data.sending_currency_code != "SAT"
        ):
            abort_with_error(
                400, "Sending currencies besides BTC/SAT are not yet supported"
            )

        amount = request_data.sending_currency_amount

        uma_lookup_result = self.sending_vasp.handle_uma_lookup(
            request_data.receiver_address
        )
        receiving_currencies = uma_lookup_result.get("receiverCurrencies", [])
        default_currency = (
            receiving_currencies[0].get("code")
            if len(receiving_currencies) > 0
            else "SAT"
        )
        receiving_currency_code = (
            request_data.receiving_currency_code or default_currency
        )
        receiving_currency = next(
            (
                currency
                for currency in receiving_currencies
                if currency.get("code") == receiving_currency_code
            ),
            None,
        )
        if len(receiving_currencies) > 0 and not receiving_currency:
            abort_with_error(400, "Receiver does not accept the specified currency")

        if not receiving_currency:
            receiving_currency = CURRENCIES[receiving_currency_code]
            receiving_currency_symbol = receiving_currency.symbol
            receiving_currency_name = receiving_currency.name
            receiving_currency_decimals = receiving_currency.decimals
        else:
            receiving_currency_symbol = receiving_currency.get("symbol")
            receiving_currency_name = receiving_currency.get("name")
            receiving_currency_decimals = receiving_currency.get("decimals")

        uma_payreq_result = self.sending_vasp.handle_uma_payreq(
            uma_lookup_result["callbackUuid"],
            is_amount_in_msats=True,
            amount=int(amount) * 1000,
            receiving_currency_code=receiving_currency_code,
            user_id=session["user_id"],
        )

        payment = self.sending_vasp.handle_send_payment(uma_payreq_result.callback_uuid)

        quote = UmaQuote(
            payment_hash=uma_payreq_result.payment_hash,
            expires_at=uma_payreq_result.invoice_expires_at,
            multiplier=uma_payreq_result.conversion_rate,
            sending_currency=UmaCurrency(
                code="SAT",
                symbol=CURRENCIES["SAT"].symbol,
                name=CURRENCIES["SAT"].name,
                decimals=CURRENCIES["SAT"].decimals,
            ),
            receiving_currency=UmaCurrency(
                code=receiving_currency_code,
                symbol=receiving_currency_symbol,
                name=receiving_currency_name,
                decimals=receiving_currency_decimals,
            ),
            fees=round(uma_payreq_result.exchange_fees_msats / 1000),
            total_sending_amount=round(uma_payreq_result.amount_msats / 1000),
            total_receiving_amount=uma_payreq_result.amount_receiving_currency,
            created_at=round(datetime.now(tz=timezone.utc).timestamp()),
        )

        return PayToAddressResponse(
            preimage=payment.get("preimage"), quote=quote
        ).to_dict()


def construct_blueprint(
    config: Config,
    lightspark_client: LightsparkSyncClient,
    user_service: IUserService,
    ledger_service: ILedgerService,
    compliance_service: IComplianceService,
    currency_service: ICurrencyService,
    pubkey_cache: IPublicKeyCache,
    request_cache: ISendingVaspRequestCache,
    nonce_cache: INonceCache,
    uma_request_storage: IRequestStorage,
) -> Blueprint:
    bp = Blueprint("umanwc", __name__, url_prefix="/umanwc")

    def get_nwc_bridge() -> UmaNwcBridge:
        sending_vasp = get_sending_vasp(
            config=config,
            lightspark_client=lightspark_client,
            user_service=user_service,
            ledger_service=ledger_service,
            compliance_service=compliance_service,
            currency_service=currency_service,
            pubkey_cache=pubkey_cache,
            request_cache=request_cache,
            nonce_cache=nonce_cache,
            uma_request_storage=uma_request_storage,
        )

        nwc_bridge = UmaNwcBridge(
            ledger_service=ledger_service,
            currency_service=currency_service,
            lightspark_client=lightspark_client,
            sending_vasp=sending_vasp,
            config=config,
        )
        return nwc_bridge

    @bp.before_request
    def user_id_from_jwt() -> None:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            abort_with_error(401, "Unauthorized")
        jwt_token = auth_header.split("Bearer ")[-1]
        jwt_public_key = current_app.config.get("NWC_JWT_PUBKEY")
        if not jwt_public_key:
            print("JWT public key not configured")
            abort_with_error(500, "JWT public key not configured")
        try:
            decoded = jwt.decode(
                jwt_token,
                key=jwt_public_key,
                algorithms=["ES256"],
                # TODO: Use the user vasp domain for aud and iss.
                options={
                    "verify_aud": False,
                    "verify_iss": False,
                },
            )
            user_id = decoded.get("sub")
            session["user_id"] = int(user_id)
        except jwt.exceptions.InvalidTokenError as e:
            print("Invalid token error", e)
            abort_with_error(401, "Unauthorized")

    @bp.get("/balance")
    def balance() -> dict[str, Any]:
        default_uma = current_user.get_default_uma_address()
        return GetBalanceResponse(
            balance=ledger_service.get_wallet_balance(uma=default_uma)[0],
            currency=UmaCurrency(
                code="SAT",
                symbol=CURRENCIES["SAT"].symbol,
                name=CURRENCIES["SAT"].name,
                decimals=CURRENCIES["SAT"].decimals,
            ),
        ).to_dict()

    @bp.get("/payments")
    def transactions() -> Response:
        return get_nwc_bridge().transactions()

    @bp.post("/payments/bolt11")
    async def handle_pay_invoice() -> dict[str, Any]:
        return await get_nwc_bridge().handle_pay_invoice()

    @bp.post("/invoice")
    async def handle_create_invoice() -> dict[str, Any]:
        return await get_nwc_bridge().handle_create_invoice()

    @bp.route("/invoices/<payment_hash>")
    def handle_get_invoice(payment_hash: str) -> dict[str, Any]:
        return get_nwc_bridge().handle_get_invoice(payment_hash)

    @bp.route("/receiver/<receiver_type>/<receiver_uma>")
    def handle_lookup_user(receiver_type: str, receiver_uma: str) -> dict[str, Any]:
        if receiver_type != "lud16":
            abort_with_error(400, "Only UMA receivers are supported")
        return get_nwc_bridge().handle_lookup_user(receiver_uma)

    @bp.route("/quote/lud16")
    def handle_get_quote() -> dict[str, Any]:
        return get_nwc_bridge().handle_get_quote()

    @bp.post("/quote/<payment_hash>")
    def handle_execute_quote(payment_hash: str) -> dict[str, Any]:
        return get_nwc_bridge().handle_execute_quote(payment_hash)

    @bp.post("/payments/lud16")
    async def handle_pay_address() -> dict[str, Any]:
        return await get_nwc_bridge().handle_pay_to_address()

    @bp.post("/payments/keysend")
    def handle_pay_keysend() -> Tuple[Response, int]:
        # TODO: Implement keysend payments.
        return jsonify({"error": "Keysend Not implemented."}), 501

    @bp.route("/info")
    def handle_info() -> dict[str, Any]:
        return get_nwc_bridge().handle_get_info()

    @bp.post("/token")
    async def handle_token_exchange() -> Response:
        user_id = session.get("user_id")
        user = User.from_id(user_id)
        if user is None:
            abort_with_error(404, f"User {user_id} not found.")
        body = await request.get_json()
        requested_permissions = body.get("permissions")
        if not requested_permissions:
            abort_with_error(400, "Permissions are required.")
        requested_expiration = body.get("expiration")

        jwt_private_key = current_app.config.get("NWC_JWT_PRIVKEY")
        if not jwt_private_key:
            abort_with_error(500, "JWT private key not set in config.")

        claims = {
            "sub": str(user_id),
            "aud": get_vasp_domain(),
            "iss": get_vasp_domain(),
            "address": user.get_default_uma_address(),
        }

        # TODO: Consider saving permissions or adding them to claims in some condensed form.
        if requested_expiration:
            claims["exp"] = requested_expiration

        user_nwc_jwt = jwt.encode(
            claims,
            jwt_private_key,
            algorithm="ES256",
        )
        return jsonify({"token": user_nwc_jwt})

    return bp


def user_currency_to_uma_auth_currency(user_currency: Currency) -> CurrencyPreference:
    return CurrencyPreference(
        min=user_currency.min_sendable,
        max=user_currency.max_sendable,
        multiplier=user_currency.millisatoshi_per_unit,
        currency=UmaCurrency(
            code=user_currency.code,
            symbol=user_currency.symbol,
            decimals=user_currency.decimals,
            name=user_currency.name,
        ),
    )
