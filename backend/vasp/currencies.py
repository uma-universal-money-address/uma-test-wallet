import logging

from flask import Blueprint, Response, jsonify

from vasp.uma_vasp.interfaces.currency_service import (
    ICurrencyService,
)
from vasp.uma_vasp.currencies import CURRENCIES

logger = logging.getLogger(__name__)


def construct_blueprint(
    currency_service: ICurrencyService,
) -> Blueprint:
    bp = Blueprint("currencies", __name__, url_prefix="/api/currencies")

    @bp.get("/")
    def get_all() -> Response:
        response = []
        for currency in CURRENCIES:
            try:
                response.append(currency_service.get_uma_currency(currency))
            except ValueError:
                logger.warning("Skipping currency %s: no exchange rate available", currency)
        return jsonify(response)

    return bp
