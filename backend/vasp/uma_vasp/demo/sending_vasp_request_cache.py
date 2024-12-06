from typing import List, Optional
from uuid import uuid4
from flask_caching import Cache

from lightspark import InvoiceData
from uma import Currency, LnurlpResponse

from vasp.uma_vasp.interfaces.sending_vasp_request_cache import (
    ISendingVaspRequestCache,
    SendingVaspInitialRequestData,
    SendingVaspPayReqData,
)


class SendingVaspRequestCache(ISendingVaspRequestCache):
    def __init__(self, cache: Cache) -> None:
        self.cache = cache

    def get_lnurlp_response_data(
        self, uuid: str
    ) -> Optional[SendingVaspInitialRequestData]:
        return self.cache.get(f"lnurlp_response_data_{uuid}")

    def get_pay_req_data(self, uuid: str) -> Optional[SendingVaspPayReqData]:
        return self.cache.get(f"payreq_data_{uuid}")

    def save_lnurlp_response_data(
        self, lnurlp_response: LnurlpResponse, receiver_uma: str
    ) -> str:
        uuid = str(uuid4())
        self.cache.set(
            f"lnurlp_response_data_{uuid}",
            SendingVaspInitialRequestData(
                lnurlp_response=lnurlp_response,
                receiver_uma=receiver_uma,
            ),
        )
        return uuid

    def save_pay_req_data(
        self,
        encoded_invoice: str,
        exchange_fees_msats: int,
        utxo_callback: str,
        invoice_data: InvoiceData,
        sender_currencies: List[Currency],
        sending_user_id: int,
        receiving_node_pubkey: Optional[str],
        receiver_uma: str,
        uma_invoice_uuid: Optional[str] = None,
    ) -> str:
        uuid = str(uuid4())
        self.cache.set(
            f"payreq_data_{uuid}",
            SendingVaspPayReqData(
                encoded_invoice=encoded_invoice,
                exchange_fees_msats=exchange_fees_msats,
                utxo_callback=utxo_callback,
                invoice_data=invoice_data,
                sender_currencies=sender_currencies,
                sending_user_id=sending_user_id,
                receiving_node_pubkey=receiving_node_pubkey,
                receiver_uma=receiver_uma,
                uma_invoice_uuid=uma_invoice_uuid,
            ),
        )
        return uuid
