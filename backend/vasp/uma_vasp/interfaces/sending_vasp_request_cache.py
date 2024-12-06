from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from lightspark import InvoiceData
from uma import Currency, LnurlpResponse


@dataclass
class SendingVaspInitialRequestData:
    """This is the data that we cache for the initial Lnurlp request."""

    lnurlp_response: LnurlpResponse
    receiver_uma: str


@dataclass
class SendingVaspPayReqData:
    """This is the data that we cache for the payreq request."""

    encoded_invoice: str
    exchange_fees_msats: int
    utxo_callback: str
    invoice_data: InvoiceData
    sender_currencies: List[Currency]
    sending_user_id: int
    receiving_node_pubkey: Optional[str]
    receiver_uma: str
    uma_invoice_uuid: Optional[str] = None


class ISendingVaspRequestCache(ABC):
    """
    A simple in-memory cache for data that needs to be remembered between calls to VASP1. In practice, this would be
    stored in a database or other persistent storage.
    """

    @abstractmethod
    def get_lnurlp_response_data(
        self, uuid: str
    ) -> Optional[SendingVaspInitialRequestData]:
        pass

    @abstractmethod
    def get_pay_req_data(self, uuid: str) -> Optional[SendingVaspPayReqData]:
        pass

    @abstractmethod
    def save_lnurlp_response_data(
        self,
        lnurlp_response: LnurlpResponse,
        receiver_uma: str,
    ) -> str:
        pass

    @abstractmethod
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
    ) -> str:
        pass
