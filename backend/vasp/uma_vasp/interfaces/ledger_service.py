from abc import ABC, abstractmethod


class ILedgerService(ABC):
    @abstractmethod
    def get_user_balance(self) -> int:
        pass

    @abstractmethod
    def add_user_balance(self, amount: int, currency_code: str, sender_uma: str) -> int:
        pass

    @abstractmethod
    def subtract_user_balance(
        self, amount: int, currency_code: str, receiver_uma: str
    ) -> int:
        pass
