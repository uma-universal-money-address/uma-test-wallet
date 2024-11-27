from abc import ABC, abstractmethod


class ILedgerService(ABC):
    @abstractmethod
    def get_wallet_balance(self, uma: str) -> tuple[int, str]:
        pass

    @abstractmethod
    def add_wallet_balance(
        self, amount: int, currency_code: str, sender_uma: str, receiver_uma: str
    ) -> int:
        pass

    @abstractmethod
    def subtract_wallet_balance(
        self, amount: int, currency_code: str, sender_uma: str, receiver_uma: str
    ) -> int:
        pass
