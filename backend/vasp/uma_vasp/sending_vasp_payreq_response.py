from dataclasses import dataclass
from typing import Any, Dict, List
from typing import Optional

from uma import Currency


@dataclass
class SendingVaspPayReqResponse:
    sender_currencies: List[Currency]
    callback_uuid: str
    encoded_invoice: str
    amount_msats: int
    conversion_rate: float
    exchange_fees_msats: int
    receiving_currency_code: str
    amount_receiving_currency: int
    payment_hash: str
    invoice_expires_at: int
    uma_invoice_uuid: Optional[str]

    def to_json(self) -> Dict[str, Any]:
        return {
            "senderCurrencies": [
                currency.to_dict() for currency in self.sender_currencies
            ],
            "callbackUuid": self.callback_uuid,
            "encodedInvoice": self.encoded_invoice,
            "amountMsats": self.amount_msats,
            "conversionRate": self.conversion_rate,
            "exchangeFeesMsats": self.exchange_fees_msats,
            "receivingCurrencyCode": self.receiving_currency_code,
            "amountReceivingCurrency": self.amount_receiving_currency,
            "paymentHash": self.payment_hash,
            "invoiceExpiresAt": self.invoice_expires_at,
            "umaInvoiceUuid": self.uma_invoice_uuid,
        }
