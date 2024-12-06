from abc import ABC, abstractmethod
from typing import List, Optional

from lightspark import PaymentDirection, PostTransactionData


class IComplianceService(ABC):
    @abstractmethod
    def should_accept_transaction_from_vasp(
        self,
        sending_vasp_domain: str,
        receiving_uma_address: str,
    ) -> bool:
        pass

    @abstractmethod
    def should_accept_transaction_to_vasp(
        self,
        receiving_vasp_domain: str,
        sending_uma_address: str,
        receiving_uma_address: str,
    ) -> bool:
        pass

    @abstractmethod
    def pre_screen_transaction(
        self,
        sending_uma_address: str,
        receiving_uma_address: str,
        amount_msats: int,
        counterparty_node_id: Optional[str],
        counterparty_utxos: List[str],
    ) -> bool:
        pass

    @abstractmethod
    def register_transaction_monitoring(
        self,
        payment_id: str,
        node_pubkey: Optional[str],
        payment_direction: PaymentDirection,
        last_hop_utxos_with_amounts: List[PostTransactionData],
    ) -> None:
        pass

    @abstractmethod
    def get_travel_rule_info_for_transaction(
        self,
        sending_user_id: str,
        sending_uma_address: str,
        receiving_uma_address: str,
        amount_msats: int,
    ) -> Optional[str]:
        pass
