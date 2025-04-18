from abc import ABC, abstractmethod
from dataclasses import dataclass
from uma import Currency


@dataclass
class CurrencyOptions:
    from_currency_code: str
    to_currency_code: str


class ICurrencyService(ABC):
    @abstractmethod
    def get_conversion_rates(
        self,
    ) -> dict[str, str]:
        pass

    @abstractmethod
    def get_uma_currency(self, currency_code: str) -> Currency:
        pass

    @abstractmethod
    def get_uma_currencies_for_uma(self, username: str) -> list[Currency]:
        pass

    @abstractmethod
    def get_currency_multiplier(self, currency_options: CurrencyOptions) -> float:
        pass

    @abstractmethod
    def get_smallest_unit_multiplier(self, currency_options: CurrencyOptions) -> float:
        pass
