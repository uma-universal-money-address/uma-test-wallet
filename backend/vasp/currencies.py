from flask import Blueprint, Response, jsonify

from vasp.uma_vasp.interfaces.currency_service import (
    ICurrencyService,
)
from vasp.uma_vasp.currencies import CURRENCIES


def construct_blueprint(
    currency_service: ICurrencyService,
) -> Blueprint:
    bp = Blueprint("currencies", __name__, url_prefix="/api/currencies")

    @bp.get("/")
    def get_all() -> Response:
        response = [
            currency_service.get_uma_currency(currency) for currency in CURRENCIES
        ]
        return jsonify(response)

    return bp
