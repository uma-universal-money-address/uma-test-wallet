import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from flask import Flask, current_app, Response, request as flask_request
from flask_login import current_user, login_required
from lightspark import CurrencyUnit
from lightspark import LightsparkSyncClient as LightsparkClient
from lightspark import OutgoingPayment, PaymentDirection, TransactionStatus
from lightspark.utils.currency_amount import amount_as_msats
from vasp.utils import get_vasp_domain, is_valid_uma, get_username_from_uma, is_dev
from vasp.uma_vasp.address_helpers import get_domain_from_uma_address
from vasp.uma_vasp.config import Config
from vasp.uma_vasp.interfaces.compliance_service import IComplianceService
from vasp.uma_vasp.interfaces.ledger_service import ILedgerService
from vasp.uma_vasp.interfaces.sending_vasp_request_cache import (
    ISendingVaspRequestCache,
    SendingVaspInitialRequestData,
)
from vasp.uma_vasp.interfaces.currency_service import (
    ICurrencyService,
)
from vasp.uma_vasp.currencies import CURRENCIES
from vasp.uma_vasp.interfaces.user_service import IUserService
from vasp.uma_vasp.lightspark_helpers import get_node
from vasp.uma_vasp.sending_vasp_payreq_response import SendingVaspPayReqResponse
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.uma_vasp.interfaces.request_storage import IRequestStorage
from uma import (
    Currency,
    INonceCache,
    InvalidSignatureException,
    IPublicKeyCache,
    Invoice,
    LnurlpResponse,
    ParsedVersion,
    PayReqResponse,
    UtxoWithAmount,
    create_compliance_payer_data,
    create_counterparty_data_options,
    create_pay_request,
    create_post_transaction_callback,
    create_uma_lnurlp_request_url,
    fetch_public_key_for_vasp,
    none_throws,
    parse_lnurlp_response,
    parse_pay_req_response,
    select_highest_supported_version,
    verify_pay_req_response_signature,
    verify_uma_invoice_signature,
    verify_uma_lnurlp_response_signature,
)

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)


class SendingVasp:
    def __init__(
        self,
        user_service: IUserService,
        compliance_service: IComplianceService,
        ledger_service: ILedgerService,
        currency_service: ICurrencyService,
        lightspark_client: LightsparkClient,
        pubkey_cache: IPublicKeyCache,
        request_cache: ISendingVaspRequestCache,
        config: Config,
        nonce_cache: INonceCache,
        uma_request_storage: IRequestStorage,
    ) -> None:
        self.user_service = user_service
        self.compliance_service = compliance_service
        self.ledger_service = ledger_service
        self.currency_service = currency_service
        self.vasp_pubkey_cache = pubkey_cache
        self.lightspark_client = lightspark_client
        self.request_cache = request_cache
        self.config = config
        self.nonce_cache = nonce_cache
        self.uma_request_storage = uma_request_storage

    def handle_uma_lookup(self, sender_uma: str, receiver_uma: str) -> Dict[str, Any]:
        if not self.compliance_service.should_accept_transaction_to_vasp(
            receiving_vasp_domain=get_domain_from_uma_address(receiver_uma),
            sending_uma_address=sender_uma,
            receiving_uma_address=receiver_uma,
        ):
            abort_with_error(
                403, "Transactions to that receiving VASP are not allowed."
            )

        url = create_uma_lnurlp_request_url(
            signing_private_key=self.config.get_signing_privkey(),
            receiver_address=receiver_uma,
            sender_vasp_domain=get_vasp_domain(),
            is_subject_to_travel_rule=True,
        )

        if is_dev:
            url = url.replace("https://", "http://")

        response = requests.get(url, timeout=20)

        if response.status_code == 412:
            response = self._retry_lnurlp_with_version_negotiation(
                receiver_uma, response
            )

        if not response.ok:
            abort_with_error(
                424, f"Error fetching LNURLP: {response.status_code} {response.text}"
            )

        lnurlp_response: LnurlpResponse
        try:
            lnurlp_response = parse_lnurlp_response(response.text)
        except Exception as e:
            abort_with_error(424, f"Error parsing LNURLP response: {e}")

        if not lnurlp_response.is_uma_response():
            print("Handling as regular LNURLP response.")
            return self._handle_as_non_uma_lnurl_response(
                lnurlp_response, sender_uma, receiver_uma
            )

        receiver_vasp_pubkey = fetch_public_key_for_vasp(
            vasp_domain=get_domain_from_uma_address(receiver_uma),
            cache=self.vasp_pubkey_cache,
        )

        # Skip signature verification in testing mode to avoid needing to run 2 VASPs.
        is_testing = current_app.config.get("TESTING", False)
        if not is_testing:
            try:
                verify_uma_lnurlp_response_signature(
                    lnurlp_response, receiver_vasp_pubkey, self.nonce_cache
                )
            except InvalidSignatureException as e:
                abort_with_error(424, f"Error verifying LNURLP response signature: {e}")

        callback_uuid = self.request_cache.save_lnurlp_response_data(
            lnurlp_response=lnurlp_response,
            sender_uma=sender_uma,
            receiver_uma=receiver_uma,
        )
        sender_currencies = self.currency_service.get_uma_currencies_for_uma(
            get_username_from_uma(sender_uma)
        )

        return {
            "senderCurrencies": [currency.to_dict() for currency in sender_currencies],
            "receiverCurrencies": (
                [currency.to_dict() for currency in lnurlp_response.currencies]
                if lnurlp_response.currencies
                else [self.currency_service.get_uma_currency("SAT").to_dict()]
            ),
            "minSendableMsats": lnurlp_response.min_sendable,
            "maxSendableMsats": lnurlp_response.max_sendable,
            "callbackUuid": callback_uuid,
            # You might not actually send this to a client in practice.
            "receiverKycStatus": (
                lnurlp_response.compliance.kyc_status.value
                if lnurlp_response.compliance
                else None
            ),
        }

    def _handle_as_non_uma_lnurl_response(
        self, lnurlp_response: LnurlpResponse, sender_uma: str, receiver_uma: str
    ) -> Dict[str, Any]:
        callback_uuid = self.request_cache.save_lnurlp_response_data(
            lnurlp_response=lnurlp_response,
            sender_uma=sender_uma,
            receiver_uma=receiver_uma,
        )
        sender_currencies = self.currency_service.get_uma_currencies_for_uma(
            get_username_from_uma(sender_uma)
        )
        return {
            "senderCurrencies": [currency.to_dict() for currency in sender_currencies],
            "receiverCurrencies": (
                [currency.to_dict() for currency in lnurlp_response.currencies]
                if lnurlp_response.currencies
                else [self.currency_service.get_uma_currency("SAT").to_dict()]
            ),
            "minSendableSats": lnurlp_response.min_sendable,
            "maxSendableSats": lnurlp_response.max_sendable,
            "callbackUuid": callback_uuid,
        }

    def _retry_lnurlp_with_version_negotiation(
        self, receiver_uma: str, response: requests.Response
    ) -> requests.Response:
        response_body = response.json()
        supported_major_versions = response_body["supportedMajorVersions"]
        if not supported_major_versions or len(supported_major_versions) == 0:
            abort_with_error(424, "No major versions supported by receiving VASP.")
        new_version = select_highest_supported_version(supported_major_versions)
        if not new_version:
            abort_with_error(
                424, "No matching UMA version compatible with receiving VASP."
            )
        retry_url = create_uma_lnurlp_request_url(
            signing_private_key=self.config.get_signing_privkey(),
            receiver_address=receiver_uma,
            sender_vasp_domain=get_vasp_domain(),
            is_subject_to_travel_rule=True,
            uma_version_override=new_version,
        )
        return requests.get(retry_url, timeout=20)

    def handle_uma_payreq_request(self, callback_uuid: str) -> Dict[str, Any]:
        receiving_currency_code = flask_request.args.get("receivingCurrencyCode", "SAT")

        initial_request_data = self.request_cache.get_lnurlp_response_data(
            callback_uuid
        )
        if initial_request_data is None:
            abort_with_error(404, f"Cannot find callback UUID {callback_uuid}")
        is_amount_in_msats = (
            flask_request.args.get("isAmountInMsats", "").lower() == "true"
        )
        amount = self._parse_and_validate_amount(
            flask_request.args.get("amount", ""),
            "SAT" if is_amount_in_msats else receiving_currency_code,
            initial_request_data.lnurlp_response,
        )
        return self.handle_uma_payreq(
            callback_uuid,
            is_amount_in_msats,
            amount,
            receiving_currency_code,
            current_user.id,
        ).to_json()

    def handle_request_pay_invoice(self, user_id: str, invoice: Invoice) -> Response:
        flask_request_data = flask_request.json
        receiver_uma = invoice.receiver_uma
        receiving_domain = get_domain_from_uma_address(receiver_uma)
        receiver_vasp_pubkey = fetch_public_key_for_vasp(
            vasp_domain=receiving_domain,
            cache=self.vasp_pubkey_cache,
        )
        verify_uma_invoice_signature(invoice, receiver_vasp_pubkey)
        receiving_currency = CURRENCIES[invoice.receving_currency.code]
        if not receiving_currency:
            abort_with_error(400, "Currency code is not supported.")

        info = {
            "amount": invoice.amount,
            "receiving_currency_code": invoice.receving_currency.code,
            "receiver_uma": receiver_uma,
            "invoice_string": flask_request_data.get("invoice"),
        }
        self.uma_request_storage.save_request(invoice.invoice_uuid, info)

        # If the receiver is an internal user, send a push notification.
        receiver_user = User.from_model_uma(get_username_from_uma(invoice.receiver_uma))
        if receiver_user:
            receiver_user.send_push_notification(
                config=self.config,
                title=f"{invoice.sender_uma} requested a payment",
                body="You have a new UMA request.",
            )

        return Response(status=200)

    def handle_pay_invoice(self) -> Dict[str, Any]:
        flask_request_data = flask_request.json
        invoice_string = flask_request_data.get("invoice")
        if not invoice_string:
            abort_with_error(400, "Invoice is required.")

        if not invoice_string.startswith("uma1"):
            request_data = self.uma_request_storage.get_request(invoice_string)
            if not request_data:
                abort_with_error(404, f"Cannot find invoice {invoice_string}")
            invoice_string = request_data["invoice_string"]

        invoice = Invoice.from_bech32_string(invoice_string)
        if not invoice:
            abort_with_error(400, "Invalid invoice.")

        receiver_uma = invoice.receiver_uma
        receiving_domain = get_domain_from_uma_address(receiver_uma)
        receiver_vasp_pubkey = fetch_public_key_for_vasp(
            vasp_domain=receiving_domain,
            cache=self.vasp_pubkey_cache,
        )
        verify_uma_invoice_signature(invoice, receiver_vasp_pubkey)

        receiving_currency = self.currency_service.get_uma_currency(
            invoice.receving_currency.code,
        )
        version_strs = invoice.uma_versions.split(",")
        major_versions = [
            ParsedVersion.load(uma_version).major for uma_version in version_strs
        ]
        highest_version = select_highest_supported_version(major_versions)

        return self._handle_internal_uma_payreq(
            sender_uma=flask_request_data.get("senderUma"),
            receiver_uma=receiver_uma,
            callback=invoice.callback,
            amount=invoice.amount,
            is_amount_in_msats=receiving_currency.code == "SAT",
            receiving_currency=receiving_currency,
            user_id=current_user.id,
            uma_version=highest_version,
            invoice_uuid=invoice.invoice_uuid,
        ).to_json()

    def handle_uma_payreq(
        self,
        callback_uuid: str,
        is_amount_in_msats: bool,
        amount: int,
        receiving_currency_code: str,
        user_id: str,
    ) -> SendingVaspPayReqResponse:
        initial_request_data = self.request_cache.get_lnurlp_response_data(
            callback_uuid
        )
        if initial_request_data is None:
            abort_with_error(404, f"Cannot find callback UUID {callback_uuid}")

        receiving_currencies = initial_request_data.lnurlp_response.currencies or [
            self.currency_service.get_uma_currency("SAT")
        ]
        receiving_currency = next(
            (
                currency
                for currency in receiving_currencies
                if currency.code == receiving_currency_code
            ),
            None,
        )
        if not receiving_currency:
            abort_with_error(400, "Currency code is not supported.")

        if not initial_request_data.lnurlp_response.is_uma_response():
            return self._handle_as_non_uma_payreq(
                initial_request_data,
                amount,
                receiving_currency_code,
                is_amount_in_msats,
            )

        sender_uma = initial_request_data.sender_uma
        receiver_uma = initial_request_data.receiver_uma
        callback = initial_request_data.lnurlp_response.callback
        uma_version = initial_request_data.lnurlp_response.uma_version
        return self._handle_internal_uma_payreq(
            sender_uma,
            receiver_uma,
            callback,
            amount,
            is_amount_in_msats,
            receiving_currency,
            user_id,
            uma_version,
        )

    def _handle_internal_uma_payreq(
        self,
        sender_uma: str,
        receiver_uma: str,
        callback: str,
        amount: int,
        is_amount_in_msats: bool,
        receiving_currency: Currency,
        user_id: str,
        uma_version: Optional[str] = None,
        invoice_uuid: Optional[str] = None,
    ) -> SendingVaspPayReqResponse:
        user = User.from_id(user_id)
        if not user:
            abort_with_error(403, "Unauthorized")

        uma_username = get_username_from_uma(sender_uma)
        default_full_name = (
            user.full_name if user.full_name is not None else uma_username
        )
        default_email = (
            user.email_address
            if user.email_address is not None
            else f"{uma_username}@test.uma.me"
        )

        receiving_domain = get_domain_from_uma_address(receiver_uma)
        receiver_vasp_pubkey = fetch_public_key_for_vasp(
            vasp_domain=receiving_domain,
            cache=self.vasp_pubkey_cache,
        )

        node = get_node(self.lightspark_client, self.config.node_id)

        payer_compliance = create_compliance_payer_data(
            receiver_encryption_pubkey=receiver_vasp_pubkey.get_encryption_pubkey(),
            signing_private_key=self.config.get_signing_privkey(),
            payer_identifier=sender_uma,
            payer_kyc_status=user.kyc_status,
            travel_rule_info=self.compliance_service.get_travel_rule_info_for_transaction(
                sending_user_id=user.id,
                sending_uma_address=sender_uma,
                receiving_uma_address=receiver_uma,
                amount_msats=round(amount * receiving_currency.millisatoshi_per_unit),
            ),
            payer_node_pubkey=node.public_key,
            payer_utxos=node.uma_prescreening_utxos,
            utxo_callback=self.config.get_complete_url(
                get_vasp_domain(), "/api/uma/utxoCallback?txid=12345"
            ),
        )

        requested_payee_data = create_counterparty_data_options(
            {
                "compliance": True,
                "identifier": True,
                "email": False,
                "name": False,
            }
        )
        uma_major_version = 1
        if uma_version is not None:
            uma_major_version = ParsedVersion.load(uma_version).major
        print(f"Payreq using UMA version {uma_version}")
        payreq = create_pay_request(
            receiving_currency_code=receiving_currency.code,
            is_amount_in_receiving_currency=not is_amount_in_msats,
            amount=amount,
            payer_identifier=sender_uma,
            payer_name=default_full_name,
            payer_email=default_email,
            payer_compliance=payer_compliance,
            requested_payee_data=requested_payee_data,
            uma_major_version=uma_major_version,
            invoice_uuid=invoice_uuid,
        )
        print(f"Payreq: {payreq.to_dict()}")

        res = requests.post(
            callback,
            json=payreq.to_dict(),
            timeout=20,
        )

        if not res.ok:
            abort_with_error(
                424, f"Error sending pay request: {res.status_code} {res.text}"
            )

        payreq_response: PayReqResponse
        try:
            payreq_response = parse_pay_req_response(res.text)
        except Exception as e:
            abort_with_error(424, f"Error parsing pay request response: {e}")

        if not payreq_response.is_uma_response():
            abort_with_error(424, "Response to UMA payreq is not a UMA response.")

        compliance = none_throws(payreq_response.get_compliance())
        if not compliance:
            abort_with_error(424, "No compliance data in pay request response.")

        print(f"payreq_response: {payreq_response.to_dict()}")
        if uma_version == 1:
            try:
                # TODO: Move this into the UMA SDK:
                payee_data = payreq_response.payee_data
                payee_data_identifier = (
                    payee_data.get("identifier") if payee_data else None
                )
                if payee_data_identifier is not None:
                    if payee_data_identifier.lower() != receiver_uma.lower():
                        abort_with_error(
                            424,
                            f"Payreq response payee data identifier does not match expected receiver UMA: {payee_data_identifier} != {receiver_uma}",
                        )
                    verify_pay_req_response_signature(
                        sender_uma,
                        payee_data_identifier,
                        payreq_response,
                        receiver_vasp_pubkey,
                        self.nonce_cache,
                    )
                else:
                    verify_pay_req_response_signature(
                        sender_uma,
                        receiver_uma,
                        payreq_response,
                        receiver_vasp_pubkey,
                        self.nonce_cache,
                    )
            except InvalidSignatureException as e:
                abort_with_error(424, f"Error verifying payreq response signature: {e}")

        payment_info = none_throws(payreq_response.payment_info)
        if not self.compliance_service.pre_screen_transaction(
            sending_uma_address=sender_uma,
            receiving_uma_address=receiver_uma,
            amount_msats=round(amount * payment_info.multiplier)
            + payment_info.exchange_fees_msats,
            counterparty_node_id=compliance.node_pubkey,
            counterparty_utxos=compliance.utxos,
        ):
            abort_with_error(403, "Transaction is not allowed.")

        sender_currencies = self.currency_service.get_uma_currencies_for_uma(
            get_username_from_uma(sender_uma)
        )

        invoice_data = self.lightspark_client.get_decoded_payment_request(
            payreq_response.encoded_invoice
        )

        new_callback_uuid = self.request_cache.save_pay_req_data(
            encoded_invoice=payreq_response.encoded_invoice,
            exchange_fees_msats=payment_info.exchange_fees_msats,
            utxo_callback=compliance.utxo_callback,
            invoice_data=invoice_data,
            sender_currencies=sender_currencies,
            sending_user_id=user.id,
            receiving_node_pubkey=compliance.node_pubkey,
            sender_uma=sender_uma,
            receiver_uma=receiver_uma,
        )

        amount_receiving_currency = (
            payreq_response.payment_info.amount
            if payreq_response.payment_info and payreq_response.payment_info.amount
            else round(amount_as_msats(invoice_data.amount) / 1000)
        )

        return SendingVaspPayReqResponse(
            sender_currencies=sender_currencies,
            callback_uuid=new_callback_uuid,
            encoded_invoice=payreq_response.encoded_invoice,
            amount_msats=amount_as_msats(invoice_data.amount),
            conversion_rate=payment_info.multiplier,
            exchange_fees_msats=payment_info.exchange_fees_msats,
            receiving_currency_code=payment_info.currency_code,
            amount_receiving_currency=amount_receiving_currency,
            payment_hash=invoice_data.payment_hash,
            invoice_expires_at=round(invoice_data.expires_at.timestamp()),
            uma_invoice_uuid=invoice_uuid,
        )

    def _handle_as_non_uma_payreq(
        self,
        initial_request_data: SendingVaspInitialRequestData,
        amount: int,
        receiving_currency_code: str,
        is_amount_in_msats: bool,
    ) -> SendingVaspPayReqResponse:
        sender_currencies = self.currency_service.get_uma_currencies_for_uma(
            get_username_from_uma(initial_request_data.sender_uma)
        )

        payreq = create_pay_request(
            receiving_currency_code=receiving_currency_code,
            is_amount_in_receiving_currency=not is_amount_in_msats,
            amount=amount,
            payer_identifier=initial_request_data.sender_uma,
            payer_name=None,
            payer_email=None,
            payer_compliance=None,
            requested_payee_data=None,
            uma_major_version=1,  # Use the new LUD-21 fields.
        )

        res = requests.get(
            initial_request_data.lnurlp_response.callback,
            params=payreq.to_dict(),
            timeout=20,
        )

        if not res.ok:
            abort_with_error(
                424, f"Error sending pay request: {res.status_code} {res.text}"
            )

        payreq_response: PayReqResponse
        try:
            payreq_response = parse_pay_req_response(res.text)
        except Exception as e:
            abort_with_error(424, f"Error parsing pay request response: {e}")

        invoice_data = self.lightspark_client.get_decoded_payment_request(
            payreq_response.encoded_invoice
        )

        new_callback_uuid = self.request_cache.save_pay_req_data(
            encoded_invoice=payreq_response.encoded_invoice,
            utxo_callback="",
            invoice_data=invoice_data,
            sender_currencies=sender_currencies,
            sending_user_id=current_user.id,
            receiving_node_pubkey=None,
            exchange_fees_msats=0,
            sender_uma=initial_request_data.sender_uma,
            receiver_uma=initial_request_data.receiver_uma,
        )

        return SendingVaspPayReqResponse(
            sender_currencies=sender_currencies,
            callback_uuid=new_callback_uuid,
            encoded_invoice=payreq_response.encoded_invoice,
            amount_msats=amount_as_msats(invoice_data.amount),
            conversion_rate=(
                payreq_response.payment_info.multiplier
                if payreq_response.payment_info
                else 1
            ),
            exchange_fees_msats=(
                payreq_response.payment_info.exchange_fees_msats
                if payreq_response.payment_info
                else 0
            ),
            receiving_currency_code=(
                payreq_response.payment_info.currency_code
                if payreq_response.payment_info
                else "SAT"
            ),
            amount_receiving_currency=(
                payreq_response.payment_info.amount
                if payreq_response.payment_info and payreq_response.payment_info.amount
                else round(amount_as_msats(invoice_data.amount) / 1000)
            ),
            payment_hash=invoice_data.payment_hash,
            invoice_expires_at=round(invoice_data.expires_at.timestamp()),
            uma_invoice_uuid=None,
        )

    def handle_send_payment(self, callback_uuid: str) -> Dict[str, Any]:
        if not callback_uuid or not callback_uuid.strip():
            abort_with_error(400, "Callback UUID is required.")

        payreq_data = self.request_cache.get_pay_req_data(callback_uuid)
        if not payreq_data:
            abort_with_error(404, f"Cannot find callback UUID {callback_uuid}")
        if payreq_data.sending_user_id != current_user.id:
            abort_with_error(403, "You are not authorized to send this payment.")

        sender_uma = payreq_data.sender_uma

        uma_invoice_uuid = payreq_data.uma_invoice_uuid
        if uma_invoice_uuid:
            self.uma_request_storage.delete_request(uma_invoice_uuid)

        is_invoice_expired = (
            payreq_data.invoice_data.expires_at.timestamp() < datetime.now().timestamp()
        )
        if is_invoice_expired:
            abort_with_error(400, "Invoice has expired.")

        amount_as_msats = payreq_data.invoice_data.amount.convert_to(
            CurrencyUnit.MILLISATOSHI
        ).preferred_currency_value_rounded

        wallet_balance, wallet_currency_code = self.ledger_service.get_wallet_balance(
            sender_uma
        )

        uma_currency = self.currency_service.get_uma_currency(wallet_currency_code)
        sending_currency_multiplier = uma_currency.millisatoshi_per_unit
        # Round up to 1 if the converted amount rounds to 0.
        sending_currency_amount = (
            round(
                (amount_as_msats + payreq_data.exchange_fees_msats)
                / sending_currency_multiplier
            )
            or 1
        )
        sending_max_fee = round(amount_as_msats * 0.0017)

        if wallet_balance - sending_currency_amount < 0:
            abort_with_error(400, "Insufficient balance.")

        self._load_signing_key()
        payment_result = self.lightspark_client.pay_uma_invoice(
            node_id=self.config.node_id,
            encoded_invoice=payreq_data.encoded_invoice,
            timeout_secs=30,
            maximum_fees_msats=max(5000, sending_max_fee),
            sender_identifier=sender_uma,
            signing_private_key=self.config.get_signing_privkey(),
        )
        if not payment_result:
            abort_with_error(500, "Payment failed.")
        payment = self.wait_for_payment_completion(payment_result)
        transaction_hash = payment.transaction_hash
        if payment.status != TransactionStatus.SUCCESS or not transaction_hash:
            abort_with_error(
                500,
                f"Payment failed. Payment ID: {payment.id} {payment.status}",
            )
        if payreq_data.receiving_node_pubkey or payment.uma_post_transaction_data:
            self.compliance_service.register_transaction_monitoring(
                payment_id=payment.id,
                node_pubkey=payreq_data.receiving_node_pubkey,
                payment_direction=PaymentDirection.SENT,
                last_hop_utxos_with_amounts=payment.uma_post_transaction_data or [],
            )

        if payreq_data.utxo_callback:
            self._send_post_tx_callback(payment, payreq_data.utxo_callback)

        self.ledger_service.subtract_wallet_balance(
            transaction_hash=transaction_hash,
            amount=sending_currency_amount,
            currency_code=wallet_currency_code,
            sender_uma=sender_uma,
            receiver_uma=payreq_data.receiver_uma,
        )

        return {
            "paymentId": payment.id,
            "status": payment.status.value,
            "settledAt": payment.resolved_at,
            "preimage": payment.payment_preimage,
        }

    def get_pending_uma_requests(self) -> Dict[str, Any]:
        return self.uma_request_storage.get_requests()

    def _parse_and_validate_amount(
        self, amount_str: str, currency_code: str, lnurlp_response: LnurlpResponse
    ) -> int:
        if not amount_str:
            abort_with_error(400, "Amount in required.")

        amount: int
        try:
            amount = int(amount_str)
        except ValueError:
            abort_with_error(400, "Amount must be an integer.")

        target_currency = next(
            (
                currency
                for currency in lnurlp_response.currencies
                or [self.currency_service.get_uma_currency("SAT")]
                if currency.code == currency_code
            ),
            None,
        )
        if not target_currency:
            abort_with_error(
                400,
                f"Currency code {currency_code} is not supported.",
            )

        if (
            amount < target_currency.min_sendable
            or amount > target_currency.max_sendable
        ):
            abort_with_error(
                400,
                f"Amount is out of range. Must be between {target_currency.min_sendable} and {target_currency.max_sendable}. Amount was {amount}.",
            )

        return amount

    def _send_post_tx_callback(
        self, payment: OutgoingPayment, utxo_callback: str
    ) -> None:
        if not utxo_callback:
            return

        post_tx_data = payment.uma_post_transaction_data
        if not post_tx_data:
            print("No UTXO data to send.")
            return

        utxos: List[UtxoWithAmount] = []
        for output in post_tx_data:
            utxos.append(
                UtxoWithAmount(
                    utxo=output.utxo,
                    amount_msats=output.amount.convert_to(
                        CurrencyUnit.MILLISATOSHI
                    ).preferred_currency_value_rounded,
                )
            )

        post_tx_callback = create_post_transaction_callback(
            utxos, get_vasp_domain(), self.config.get_signing_privkey()
        )

        res = requests.post(
            utxo_callback,
            json=post_tx_callback.to_dict(),
            timeout=10,
        )
        if not res.ok:
            # Allowing this to fail silently for now since it doesn't block the user flow.
            print(
                f"Error sending UTXO callback: {res.status_code} {res.text}",
                flush=True,
            )

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

    def wait_for_payment_completion(
        self, initial_payment: OutgoingPayment
    ) -> OutgoingPayment:
        max_retries = 40
        num_retries = 0
        payment = initial_payment
        log.info(f"Waiting for payment {payment.id} {payment.status} to complete...")
        while payment.status == TransactionStatus.PENDING and num_retries < max_retries:
            log.info(
                f"Retrying waiting for payment {payment.id} {payment.status} to complete..."
            )
            payment = self.lightspark_client.get_entity(payment.id, OutgoingPayment)
            if not payment:
                abort_with_error(500, "Payment not found.")
            if payment.status == TransactionStatus.PENDING:
                time.sleep(0.25)
            num_retries += 1
        return payment


def get_sending_vasp(
    config: Config,
    lightspark_client: LightsparkClient,
    user_service: IUserService,
    ledger_service: ILedgerService,
    currency_service: ICurrencyService,
    compliance_service: IComplianceService,
    pubkey_cache: IPublicKeyCache,
    request_cache: ISendingVaspRequestCache,
    nonce_cache: INonceCache,
    uma_request_storage: IRequestStorage,
) -> SendingVasp:
    return SendingVasp(
        user_service=user_service,
        ledger_service=ledger_service,
        currency_service=currency_service,
        compliance_service=compliance_service,
        lightspark_client=lightspark_client,
        pubkey_cache=pubkey_cache,
        request_cache=request_cache,
        config=config,
        nonce_cache=nonce_cache,
        uma_request_storage=uma_request_storage,
    )


def register_routes(
    app: Flask,
    config: Config,
    lightspark_client: LightsparkClient,
    user_service: IUserService,
    ledger_service: ILedgerService,
    currency_service: ICurrencyService,
    compliance_service: IComplianceService,
    pubkey_cache: IPublicKeyCache,
    request_cache: ISendingVaspRequestCache,
    nonce_cache: INonceCache,
    uma_request_storage: IRequestStorage,
) -> None:
    def get_sending_vasp_internal() -> SendingVasp:
        return get_sending_vasp(
            config=config,
            lightspark_client=lightspark_client,
            user_service=user_service,
            ledger_service=ledger_service,
            currency_service=currency_service,
            compliance_service=compliance_service,
            pubkey_cache=pubkey_cache,
            request_cache=request_cache,
            nonce_cache=nonce_cache,
            uma_request_storage=uma_request_storage,
        )

    @app.route("/api/umalookup/<receiver_uma>")
    @login_required
    def handle_uma_lookup(receiver_uma: str) -> Dict[str, Any]:
        sending_vasp = get_sending_vasp_internal()
        sender_uma = flask_request.args.get("senderUma")
        if sender_uma and not is_valid_uma(sender_uma):
            abort_with_error(400, "Invalid sender UMA address.")
        elif not sender_uma:
            sender_uma = current_user.get_default_uma_address()
        return sending_vasp.handle_uma_lookup(sender_uma, receiver_uma)

    @app.route("/api/umapayreq/<callback_uuid>")
    @login_required
    def handle_uma_payreq(callback_uuid: str) -> Dict[str, Any]:
        sending_vasp = get_sending_vasp_internal()
        return sending_vasp.handle_uma_payreq_request(callback_uuid)

    @app.post("/api/sendpayment/<callback_uuid>")
    @login_required
    def handle_send_payment(callback_uuid: str) -> Dict[str, Any]:
        sending_vasp = get_sending_vasp_internal()
        return sending_vasp.handle_send_payment(callback_uuid)

    @app.post("/api/uma/pay_invoice")
    @login_required
    def handle_pay_invoice() -> Dict[str, Any]:
        sending_vasp = get_sending_vasp_internal()
        return sending_vasp.handle_pay_invoice()

    @app.post("/api/uma/request_pay_invoice")
    @login_required
    def handle_request_pay_invoice() -> Response:
        flask_request_data = flask_request.json
        invoice_string = flask_request_data.get("invoice")
        if not invoice_string:
            abort_with_error(401, "Invoice is required.")

        invoice = Invoice.from_bech32_string(invoice_string)
        if not invoice:
            abort_with_error(401, "Invalid invoice.")

        sender_uma = (
            invoice.sender_uma
            if invoice.sender_uma is not None
            else flask_request_data.get("sender")
        )

        if not sender_uma:
            abort_with_error(401, "Sender not provided")

        uma_user_name = sender_uma.split("@")[0]
        if uma_user_name.startswith("$"):
            uma_user_name = uma_user_name[1:]

        user = User.from_model_uma(uma_user_name)
        if not user:
            abort_with_error(401, "Unauthorized")

        sending_vasp = get_sending_vasp_internal()
        return sending_vasp.handle_request_pay_invoice(user_id=user.id, invoice=invoice)

    @app.route("/api/uma/pending_requests/<user_id>")
    @login_required
    def handle_get_pending_requests(user_id: int) -> Dict[str, Any]:
        sending_vasp = get_sending_vasp_internal()
        return sending_vasp.get_pending_uma_requests()
