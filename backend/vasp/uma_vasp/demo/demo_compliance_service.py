from typing import List, Optional

from lightspark import (
    LightsparkSyncClient,
    PaymentDirection,
    PostTransactionData,
    RiskRating,
)

from vasp.uma_vasp.interfaces.compliance_service import IComplianceService
from vasp.uma_vasp.config import Config


class DemoComplianceService(IComplianceService):
    def __init__(self, lightspark_client: LightsparkSyncClient, config: Config) -> None:
        self.lightspark_client = lightspark_client
        self.config = config

    def should_accept_transaction_from_vasp(
        self,
        sending_vasp_domain: str,
        receiving_uma_address: str,
    ) -> bool:
        # You can do your own checks here, but for the demo we will just accept everything.
        return True

    def should_accept_transaction_to_vasp(
        self,
        receiving_vasp_domain: str,
        sending_uma_address: str,
        receiving_uma_address: str,
    ) -> bool:
        # You can do your own checks here, but for the demo we will just accept everything.
        return True

    def pre_screen_transaction(
        self,
        sending_uma_address: str,
        receiving_uma_address: str,
        amount_msats: int,
        counterparty_node_id: Optional[str],
        counterparty_utxos: List[str],
    ) -> bool:
        # Requiring a node ID here by default, but you could use utxos instead in practice.
        if counterparty_node_id is None:
            return False

        # Only actually do compliance stuff if there's a compliance provider set
        if not self.config.compliance_provider:
            return True

        risk = self.lightspark_client.screen_node(
            self.config.compliance_provider, counterparty_node_id
        )
        return risk != RiskRating.HIGH_RISK

    def register_transaction_monitoring(
        self,
        payment_id: str,
        node_pubkey: Optional[str],
        payment_direction: PaymentDirection,
        last_hop_utxos_with_amounts: List[PostTransactionData],
    ) -> None:
        # You can do your own monitoring here on the last_hop_utxos_with_amounts if
        # node_pubkey is empty.
        if node_pubkey is None:
            return

        # Only actually do compliance stuff if there's a compliance provider set
        if not self.config.compliance_provider:
            return

        self.lightspark_client.register_payment(
            self.config.compliance_provider, payment_id, node_pubkey, payment_direction
        )

    def get_travel_rule_info_for_transaction(
        self,
        sending_user_id: int,
        sending_uma_address: str,
        receiving_uma_address: str,
        amount_msats: int,
    ) -> Optional[str]:
        if amount_msats > 1_000_000_000:
            return '["message": "Here is some fake travel rule info. It is up to you to actually implement this if needed."]'
        return None
