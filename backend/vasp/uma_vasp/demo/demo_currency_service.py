from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session
from vasp.db import db
from vasp.uma_vasp.interfaces.currency_service import (
    ICurrencyService,
    CurrencyOptions,
)
from vasp.uma_vasp.currencies import CURRENCIES
from uma import Currency
from vasp.models.Currency import Currency as CurrencyModel
from vasp.models.Wallet import Wallet as WalletModel
from vasp.models.Uma import Uma as UmaModel
import time


import requests


class DemoCurrencyService(ICurrencyService):
    def __init__(self) -> None:
        self.conversion_rates: Optional[dict[str, str]] = None
        self.last_request_time: float = 0.0

    def get_conversion_rates(self) -> dict[str, str]:
        # Check if the cached rates are still valid (e.g., less than a minute old)
        if self.conversion_rates and (time.time() - self.last_request_time) < 1:
            return self.conversion_rates

        # If not valid, make a new request to the currency conversion API
        response = requests.get(
            "https://api.coinbase.com/v2/exchange-rates?currency=BTC"
        )
        self.conversion_rates = response.json().get("data").get("rates")
        self.last_request_time = time.time()

        if (self.conversion_rates is None) or (len(self.conversion_rates) == 0):
            raise ValueError("No conversion rates found.")
        return self.conversion_rates

    def get_uma_currency(self, currency_code: str) -> Currency:
        return Currency(
            code=currency_code,
            name=CURRENCIES[currency_code].name,
            symbol=CURRENCIES[currency_code].symbol,
            millisatoshi_per_unit=(
                (
                    self.get_smallest_unit_multiplier(
                        currency_options=CurrencyOptions(
                            from_currency_code=currency_code,
                            to_currency_code="SAT",
                        ),
                    )
                    * 1000
                )
            ),
            min_sendable=CURRENCIES[currency_code].min_sendable,
            max_sendable=CURRENCIES[currency_code].max_sendable,
            decimals=CURRENCIES[currency_code].decimals,
        )

    def get_uma_currencies_for_uma(self, username: str) -> list[Currency]:
        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(WalletModel).join(UmaModel).where(UmaModel.username == username)
            ).first()
            currencies = db_session.scalars(
                select(CurrencyModel).where(CurrencyModel.wallet_id == wallet.id)
            ).all()
            currencies = db_session.scalars(
                select(CurrencyModel)
                .join(WalletModel)
                .join(UmaModel)
                .where(UmaModel.username == username)
            ).all()
            return [self.get_uma_currency(currency.code) for currency in currencies]

    def get_currency_multiplier(self, currency_options: CurrencyOptions) -> float:
        conversion_rates = self.get_conversion_rates()

        # Rates convert to BTC
        if currency_options.to_currency_code == "SAT":
            to_currency_rate = 1 * 10**8
        else:
            to_currency_rate = conversion_rates.get(currency_options.to_currency_code)

        if currency_options.from_currency_code == "SAT":
            from_currency_rate = 1 * 10**8
        else:
            from_currency_rate = conversion_rates.get(
                currency_options.from_currency_code
            )

        # Convert "from" currency to "to" currency
        if to_currency_rate and from_currency_rate:
            return float(to_currency_rate) / float(from_currency_rate)
        else:
            raise ValueError(
                "Invalid currency code provided."
                + currency_options.to_currency_code
                + " "
                + currency_options.from_currency_code
            )

    def get_smallest_unit_multiplier(self, currency_options: CurrencyOptions) -> float:
        base_multiplier = self.get_currency_multiplier(currency_options)
        from_currency = CURRENCIES[currency_options.from_currency_code]
        to_currency = CURRENCIES[currency_options.to_currency_code]
        return base_multiplier / (10 ** (from_currency.decimals - to_currency.decimals))
