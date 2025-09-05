# pyre-strict

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

import logging
import requests
from flask import Flask, Response, current_app, request as flask_request
from flask_login import current_user, login_required
from lightspark import (
    LightsparkSyncClient as LightsparkClient,
    webhooks,
    LightningTransaction,
    TransactionStatus,
    IncomingPayment,
)
from vasp.db import db
from vasp.utils import get_vasp_domain, get_username_from_uma, get_uma_from_username
from vasp.uma_vasp.address_helpers import get_domain_from_uma_address
from vasp.uma_vasp.config import Config
from vasp.uma_vasp.interfaces.compliance_service import IComplianceService
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.uma_vasp.interfaces.user_service import IUserService
from vasp.uma_vasp.interfaces.currency_service import (
    ICurrencyService,
)
from vasp.uma_vasp.currencies import CURRENCIES
from vasp.uma_vasp.lightspark_helpers import get_node
from vasp.uma_vasp.uma_exception import UmaException, abort_with_error
from vasp.uma_vasp.user import User
from vasp.models.PayReqResponse import PayReqResponse as PayReqResponseModel
from vasp.models.Transaction import Transaction
from vasp.models.Uma import Uma
from uma import (
    INonceCache,
    InvoiceCurrency,
    IPublicKeyCache,
    IUmaInvoiceCreator,
    KycStatus,
    LnurlpRequest,
    LnurlpResponse,
    PayReqResponse,
    PayRequest,
    PubkeyResponse,
    UnsupportedVersionException,
    compliance_from_payer_data,
    create_counterparty_data_options,
    create_pay_req_response,
    create_uma_invoice,
    create_uma_lnurlp_response,
    fetch_public_key_for_vasp,
    none_throws,
    parse_lnurlp_request,
    parse_pay_request,
    verify_pay_request_signature,
    verify_uma_lnurlp_query_signature,
)


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)

PAY_REQUEST_CALLBACK = "/api/uma/payreq/"


class ReceivingVasp:
    def __init__(
        self,
        user_service: IUserService,
        ledger_service: ILedgerService,
        currency_service: ICurrencyService,
        compliance_service: IComplianceService,
        lightspark_client: LightsparkClient,
        pubkey_cache: IPublicKeyCache,
        config: Config,
        nonce_cache: INonceCache,
    ) -> None:
        self.user_service = user_service
        self.ledger_service = ledger_service
        self.currency_service = currency_service
        self.compliance_service = compliance_service
        self.vasp_pubkey_cache = pubkey_cache
        self.lightspark_client = lightspark_client
        self.config = config
        self.nonce_cache = nonce_cache

    def handle_lnurlp_request(self, username: str) -> Dict[str, Any]:
        print(f"Handling LNURLP query for uma {username}")
        lnurlp_request: LnurlpRequest
        try:
            lnurlp_request = parse_lnurlp_request(flask_request.url)
        except UnsupportedVersionException as e:
            raise e
        except Exception as e:
            print(f"Invalid UMA lnurlp request: {e}")
            raise UmaException(
                f"Invalid UMA lnurlp request: {e}",
                status_code=400,
            )

        if not lnurlp_request.is_uma_request():
            return self._handle_non_uma_lnurlp_request(username).to_dict()

        if not self.compliance_service.should_accept_transaction_from_vasp(
            none_throws(lnurlp_request.vasp_domain), lnurlp_request.receiver_address
        ):
            raise UmaException(
                f"Cannot accept transactions from vasp {lnurlp_request.vasp_domain}",
                status_code=403,
            )

        sender_vasp_pubkey_response: PubkeyResponse
        try:
            sender_vasp_pubkey_response = fetch_public_key_for_vasp(
                none_throws(lnurlp_request.vasp_domain), self.vasp_pubkey_cache
            )
        except Exception as e:
            raise UmaException(
                f"Cannot fetch public key for vasp {lnurlp_request.vasp_domain}: {e}",
                status_code=424,
            )

        # Skip signature verification in testing mode to avoid needing to run 2 VASPs.
        is_testing = current_app.config.get("TESTING", False)
        if not is_testing:
            try:
                verify_uma_lnurlp_query_signature(
                    request=lnurlp_request,
                    other_vasp_pubkeys=sender_vasp_pubkey_response,
                    nonce_cache=self.nonce_cache,
                )
            except Exception as e:
                raise UmaException(
                    f"Invalid signature: {e}",
                    status_code=400,
                )

        metadata = self._create_metadata(username)
        payer_data_options = create_counterparty_data_options(
            {
                "name": False,
                "email": False,
                "identifier": True,
                "compliance": True,
            }
        )
        callback = self.config.get_complete_url(
            get_vasp_domain(), f"{PAY_REQUEST_CALLBACK}{username}"
        )

        response = create_uma_lnurlp_response(
            request=lnurlp_request,
            signing_private_key=self.config.get_signing_privkey(),
            requires_travel_rule_info=True,
            callback=callback,
            encoded_metadata=metadata,
            min_sendable_sats=1,
            max_sendable_sats=10_000_000,
            payer_data_options=payer_data_options,
            currency_options=self.currency_service.get_uma_currencies_for_uma(username),
            receiver_kyc_status=KycStatus.VERIFIED,
        )

        return response.to_dict()

    def _handle_non_uma_lnurlp_request(self, username: str) -> LnurlpResponse:
        metadata = self._create_metadata(username)
        return LnurlpResponse(
            tag="payRequest",
            callback=self.config.get_complete_url(
                get_vasp_domain(),
                f"{PAY_REQUEST_CALLBACK}{username}",
            ),
            min_sendable=1_000,
            max_sendable=10_000_000_000,
            encoded_metadata=metadata,
            currencies=self.currency_service.get_uma_currencies_for_uma(username),
            required_payer_data=None,
            compliance=None,
            uma_version=None,
        )

    def handle_pay_request_callback(self, username: str) -> Dict[str, Any]:
        user = self.user_service.get_user_from_uma(username)
        if not user:
            raise UmaException(
                f"Cannot find user {username}",
                status_code=404,
            )

        request: PayRequest
        try:
            request_data = (
                flask_request.get_data(as_text=True)
                if flask_request.method == "POST"
                else json.dumps(flask_request.args)
            )
            request = parse_pay_request(request_data)
        except Exception as e:
            print(f"Invalid UMA pay request: {e}")
            raise UmaException(
                f"Invalid UMA pay request: {e}",
                status_code=400,
            )
        if not request.is_uma_request():
            return self._handle_non_uma_pay_request(request, username).to_dict()

        payer_data = none_throws(request.payer_data)
        vasp_domain = get_domain_from_uma_address(payer_data.get("identifier", ""))
        if not self.compliance_service.should_accept_transaction_from_vasp(
            vasp_domain, get_uma_from_username(username)
        ):
            raise UmaException(
                f"Cannot accept transactions from vasp {vasp_domain}",
                status_code=403,
            )

        # Skip signature verification in testing mode to avoid needing to run 2 VASPs.
        is_testing = current_app.config.get("TESTING", False)
        if not is_testing:
            sender_vasp_pubkeys = fetch_public_key_for_vasp(
                vasp_domain=vasp_domain,
                cache=self.vasp_pubkey_cache,
            )
            verify_pay_request_signature(
                request=request,
                other_vasp_pubkeys=sender_vasp_pubkeys,
                nonce_cache=self.nonce_cache,
            )

        metadata = self._create_metadata(username) + json.dumps(payer_data)

        receiving_currency_code = none_throws(request.receiving_currency_code)
        msats_per_currency_unit = self.currency_service.get_uma_currency(
            receiving_currency_code
        ).millisatoshi_per_unit
        receiver_fees_msats = (
            0 if receiving_currency_code in ["SAT", "MXN"] else 250_000
        )

        receiver_uma = get_uma_from_username(username)
        compliance_data = compliance_from_payer_data(payer_data)
        if compliance_data:
            self.compliance_service.pre_screen_transaction(
                sending_uma_address=payer_data.get("identifier", ""),
                receiving_uma_address=receiver_uma,
                amount_msats=(
                    request.amount
                    if request.sending_amount_currency_code is None
                    else round(request.amount * msats_per_currency_unit)
                    + receiver_fees_msats
                ),
                counterparty_node_id=compliance_data.node_pubkey,
                counterparty_utxos=compliance_data.utxos,
            )

        node = get_node(self.lightspark_client, self.config.node_id)

        # Doesn't have access to invoice data's payment_hash but we need it to save the pay req response to be matched later
        pay_req_response = create_pay_req_response(
            request=request,
            invoice_creator=LightsparkInvoiceCreator(
                self.lightspark_client,
                self.config,
            ),
            metadata=metadata,
            receiving_currency_code=receiving_currency_code,
            receiving_currency_decimals=CURRENCIES[receiving_currency_code].decimals,
            msats_per_currency_unit=msats_per_currency_unit,
            receiver_fees_msats=receiver_fees_msats,
            receiver_node_pubkey=node.public_key,
            receiver_utxos=node.uma_prescreening_utxos,
            utxo_callback=self.config.get_complete_url(
                get_vasp_domain(), "/api/uma/utxoCallback?txid=12345"
            ),
            payee_identifier=receiver_uma,
            signing_private_key=self.config.get_signing_privkey(),
            payee_data={
                "identifier": receiver_uma,
                "name": user.full_name,
                "email": user.email_address,
                "userType": "INDIVIDUAL",
                **(
                    {"countryOfResidence": user.country_of_residence}
                    if user.country_of_residence
                    else {}
                ),
                **(
                    {"nationality": user.country_of_residence}
                    if user.country_of_residence
                    else {}
                ),
                **({"birthDate": user.birthday.isoformat()} if user.birthday else {}),
            },
        )

        if pay_req_response.payment_info is None:
            raise UmaException(
                "Error because payment_info is missing from payreq",
                status_code=500,
            )
        payment_info = pay_req_response.payment_info

        invoice_data = self.lightspark_client.get_decoded_payment_request(
            pay_req_response.encoded_invoice
        )

        with Session(db.engine) as db_session:
            uma = db_session.scalars(
                select(Uma).where(Uma.username == username)
            ).first()
            if not uma:
                raise UmaException(
                    f"Cannot find UMA for user {username}",
                    status_code=404,
                )
            payreq_response_model = PayReqResponseModel(
                user_id=user.id,
                uma_id=uma.id,
                sender_uma=payer_data.get("identifier", ""),
                payment_hash=invoice_data.payment_hash,
                expires_at=invoice_data.expires_at,
                amount_in_lowest_denom=payment_info.amount,
                currency_code=payment_info.currency_code,
                exchange_fees_msats=payment_info.exchange_fees_msats,
                multiplier=payment_info.multiplier,
            )
            db_session.add(payreq_response_model)
            db_session.commit()

        return pay_req_response.to_dict()

    def _handle_non_uma_pay_request(
        self, request: PayRequest, username: str
    ) -> PayReqResponse:
        metadata = self._create_metadata(username)
        if request.payer_data is not None:
            metadata += json.dumps(request.payer_data)
        receiving_currency = self.currency_service.get_uma_currency(
            request.receiving_currency_code or "SAT"
        )
        return create_pay_req_response(
            request=request,
            invoice_creator=LightsparkInvoiceCreator(
                self.lightspark_client, self.config
            ),
            metadata=metadata,
            receiving_currency_code=request.receiving_currency_code,
            receiving_currency_decimals=(
                receiving_currency.decimals
                if request.receiving_currency_code is not None
                else None
            ),
            msats_per_currency_unit=(
                receiving_currency.millisatoshi_per_unit
                if request.receiving_currency_code is not None
                else None
            ),
            receiver_fees_msats=(
                0
                if request.receiving_currency_code in ["SAT", "MXN"]
                else 250_000 if request.receiving_currency_code is not None else None
            ),
            receiver_node_pubkey=None,
            receiver_utxos=[],
            utxo_callback=None,
            payee_identifier=None,
            signing_private_key=None,
            payee_data=None,
        )

    def handle_create_uma_invoice(self, user_id: str) -> str:
        user = self.user_service.get_user_from_id(user_id)
        if not user:
            raise UmaException(
                f"Cannot find user {user_id}",
                status_code=404,
            )

        with Session(db.engine) as db_session:
            username = db_session.scalars(
                select(Uma.username).where(Uma.user_id == user.id, Uma.default)
            ).first()
            if not username:
                raise UmaException(
                    f"Cannot find UMA for user {user_id}",
                    status_code=404,
                )

        flask_request_data = flask_request.json
        amount = flask_request_data.get("amount")

        currency_code = flask_request_data.get("currency_code")
        if not currency_code:
            currency_code = "SAT"
        receiver_currencies = [
            currency
            for currency in self.currency_service.get_uma_currencies_for_uma(username)
            if currency.code == currency_code
        ]
        if len(receiver_currencies) == 0:
            raise UmaException(
                f"User does not support currency {currency_code}",
                status_code=400,
            )
        currency = receiver_currencies[0]

        invoice_currency = InvoiceCurrency(
            code=currency.code,
            name=currency.name,
            symbol=currency.symbol,
            decimals=currency.decimals,
        )

        two_days_from_now = datetime.now(timezone.utc) + timedelta(days=2)

        callback = self.config.get_complete_url(
            get_vasp_domain(), f"{PAY_REQUEST_CALLBACK}{user.id}"
        )

        payer_data_options = create_counterparty_data_options(
            {
                "name": False,
                "email": False,
                "identifier": True,
                "compliance": True,
            }
        )

        invoice = create_uma_invoice(
            receiver_uma=get_uma_from_username(username),
            receiving_currency_amount=amount,
            receiving_currency=invoice_currency,
            expiration=two_days_from_now,
            callback=callback,
            is_subject_to_travel_rule=True,
            signing_private_key=self.config.get_signing_privkey(),
            required_payer_data=payer_data_options,
            receiver_kyc_status=KycStatus.VERIFIED,
        )
        return invoice.to_bech32_string()

    def create_and_send_invoice(self, user_id: str) -> Response:
        user = self.user_service.get_user_from_id(user_id)
        if not user:
            raise UmaException(
                f"Cannot find user {user_id}",
                status_code=404,
            )
        with Session(db.engine) as db_session:
            username = db_session.scalars(
                select(Uma.username).where(Uma.user_id == user.id, Uma.default)
            ).first()
            if not username:
                raise UmaException(
                    f"Cannot find UMA for user {user_id}",
                    status_code=404,
                )

        flask_request_data = flask_request.json
        amount = flask_request_data.get("amount")

        currency_code = flask_request_data.get("currency_code")
        if not currency_code:
            currency_code = "SAT"
        receiver_currencies = [
            currency
            for currency in self.currency_service.get_uma_currencies_for_uma(username)
            if currency.code == currency_code
        ]
        if len(receiver_currencies) == 0:
            raise UmaException(
                f"User does not support currency {currency_code}",
                status_code=400,
            )
        currency = receiver_currencies[0]

        invoice_currency = InvoiceCurrency(
            code=currency.code,
            name=currency.name,
            symbol=currency.symbol,
            decimals=currency.decimals,
        )

        two_days_from_now = datetime.now(timezone.utc) + timedelta(days=2)

        callback = self.config.get_complete_url(
            get_vasp_domain(), f"{PAY_REQUEST_CALLBACK}{user.id}"
        )

        payer_data_options = create_counterparty_data_options(
            {
                "name": False,
                "email": False,
                "identifier": True,
                "compliance": True,
            }
        )

        sender_uma = flask_request_data.get("sender_uma")
        if not sender_uma:
            raise UmaException(
                "Cannot find sender_uma",
                status_code=404,
            )

        invoice = create_uma_invoice(
            receiver_uma=get_uma_from_username(username),
            receiving_currency_amount=amount,
            receiving_currency=invoice_currency,
            expiration=two_days_from_now,
            callback=callback,
            is_subject_to_travel_rule=True,
            signing_private_key=self.config.get_signing_privkey(),
            required_payer_data=payer_data_options,
            receiver_kyc_status=KycStatus.VERIFIED,
            sender_uma=sender_uma,
        )

        invoice_str = invoice.to_bech32_string()
        # This should be included in the config file for sending vasp to query
        # Hardcoded for now, need to add validation and sanitization to parse the sender_uma
        sender_domain = sender_uma.split("@")[1]
        url = self.config.get_complete_url(
            sender_domain, "/api/uma/request_pay_invoice"
        )
        print(f"Sending pay request to {url}")
        vars = {"invoice": invoice_str}
        res = requests.post(
            url,
            json=vars,
            timeout=20,
        )

        if not res.ok:
            abort_with_error(
                424, f"Error sending pay request: {res.status_code} {res.text}"
            )

        return Response(status=200)

    def _create_metadata(self, username: str) -> str:
        metadata = [
            ["text/plain", f"Pay to {get_vasp_domain()} user {username}"],
            ["text/identifier", get_uma_from_username(username)],
        ]
        return json.dumps(metadata)


class LightsparkInvoiceCreator(IUmaInvoiceCreator):
    def __init__(self, client: LightsparkClient, config: Config) -> None:
        super().__init__()
        self.client = client
        self.config = config

    def create_uma_invoice(
        self, amount_msats: int, metadata: str, receiver_identifier: Optional[str]
    ) -> str:
        return self.client.create_uma_invoice(
            node_id=self.config.node_id,
            amount_msats=amount_msats,
            metadata=metadata,
            expiry_secs=900,
            signing_private_key=self.config.get_signing_privkey(),
            receiver_identifier=receiver_identifier,
        ).data.encoded_payment_request


def register_routes(
    app: Flask,
    config: Config,
    lightspark_client: LightsparkClient,
    user_service: IUserService,
    ledger_service: ILedgerService,
    currency_service: ICurrencyService,
    compliance_service: IComplianceService,
    pubkey_cache: IPublicKeyCache,
    nonce_cache: INonceCache,
) -> None:
    def get_receiving_vasp() -> ReceivingVasp:
        return ReceivingVasp(
            lightspark_client=lightspark_client,
            user_service=user_service,
            ledger_service=ledger_service,
            currency_service=currency_service,
            compliance_service=compliance_service,
            pubkey_cache=pubkey_cache,
            config=config,
            nonce_cache=nonce_cache,
        )

    @app.route("/.well-known/lnurlp/<username>")
    def handle_lnurlp_request(username: str) -> Dict[str, Any]:
        username = get_username_from_uma(username)
        user = user_service.get_user_from_uma(username)
        if not user:
            abort_with_error(404, f"Cannot find user {username}")
        receiving_vasp = get_receiving_vasp()
        return receiving_vasp.handle_lnurlp_request(username)

    @app.post(PAY_REQUEST_CALLBACK + "<username>")
    def handle_uma_pay_request_callback(username: str) -> Dict[str, Any]:
        receiving_vasp = get_receiving_vasp()
        return receiving_vasp.handle_pay_request_callback(username)

    @app.get(PAY_REQUEST_CALLBACK + "<username>")
    @login_required
    def handle_lnurl_pay_request_callback(username: str) -> Dict[str, Any]:
        receiving_vasp = get_receiving_vasp()
        return receiving_vasp.handle_pay_request_callback(username)

    @app.post("/api/uma/create_invoice")
    @login_required
    def handle_create_uma_invoice() -> str:
        receiving_vasp = get_receiving_vasp()
        return receiving_vasp.handle_create_uma_invoice(current_user.id)

    @app.post("/api/uma/create_and_send_invoice")
    @login_required
    def handle_create_and_send_invoice() -> Response:
        receiving_vasp = get_receiving_vasp()
        return receiving_vasp.create_and_send_invoice(current_user.id)

    @app.post("/api/webhooks/transaction")
    def handle_post_transaction() -> Response:
        signature_header = flask_request.headers.get(webhooks.SIGNATURE_HEADER)
        if not signature_header:
            abort_with_error(400, "Missing signature header")

        event = webhooks.WebhookEvent.verify_and_parse(
            flask_request.data,
            signature_header,
            config.webhook_signing_key,
        )
        if event.event_type == webhooks.WebhookEventType.PAYMENT_FINISHED:
            payment = lightspark_client.get_entity(
                event.entity_id, LightningTransaction
            )
            if not payment:
                abort_with_error(500, f"Cannot find payment {event.entity_id}")

            if payment.status == TransactionStatus.SUCCESS and isinstance(
                payment, IncomingPayment
            ):
                transaction_hash = payment.transaction_hash

                if not payment.is_uma:
                    logging.info(
                        f"Received non-UMA payment, transaction_hash: {transaction_hash}"
                    )
                    return Response(status=200)
                if not transaction_hash:
                    abort_with_error(
                        500,
                        f"Cannot find transaction_hash for payment {payment.id}",
                    )

                with Session(db.engine) as db_session:
                    payreq_response = db_session.scalars(
                        select(PayReqResponseModel).where(
                            PayReqResponseModel.payment_hash == transaction_hash
                        )
                    ).first()
                    if not payreq_response:
                        abort_with_error(
                            500,
                            f"Cannot find payreq_response for transaction_hash: {transaction_hash}",
                        )

                    user = user_service.get_user_from_id(payreq_response.user_id)
                    if not user:
                        abort_with_error(
                            500,
                            f"Cannot find user: {payreq_response.user_id}",
                        )

                    receiver_uma_model = db_session.scalars(
                        select(Uma).where(Uma.id == payreq_response.uma_id)
                    ).first()
                    if not receiver_uma_model:
                        abort_with_error(
                            500,
                            f"Cannot find UMA: {payreq_response.uma_id}",
                        )

                    receiving_transaction = db_session.scalars(
                        select(Transaction)
                        .join(Uma)
                        .where(
                            Uma.id == payreq_response.uma_id,
                        )
                        .where(Transaction.transaction_hash == transaction_hash)
                    ).first()
                    if receiving_transaction:
                        logging.info(
                            f"Already received payment for user {user.id}, transaction_hash: {transaction_hash}"
                        )
                        return Response(status=200)

                    ledger_service.add_wallet_balance(
                        transaction_hash=transaction_hash,
                        amount=payreq_response.amount_in_lowest_denom,
                        currency_code=payreq_response.currency_code,
                        sender_uma=payreq_response.sender_uma,
                        receiver_uma=get_uma_from_username(receiver_uma_model.username),
                    )

                    amount_normal_denom = payreq_response.amount_in_lowest_denom / (
                        10 ** CURRENCIES[payreq_response.currency_code].decimals
                    )
                    user.send_push_notification(
                        config=config,
                        title="UMA Test Wallet",
                        body=f"{payreq_response.sender_uma} sent {amount_normal_denom} {payreq_response.currency_code}",
                    )

                    logging.info(
                        f"Received payment for user {user.id}, transaction_hash: {transaction_hash}"
                    )

        return Response(status=200)
