from typing import Any, Dict

from flask import Blueprint, current_app, Response, jsonify
from uma import create_pubkey_response, is_domain_local

from vasp.uma_vasp.config import Config

bp = Blueprint("well_known", __name__, url_prefix="/.well-known")


@bp.route("/lnurlpubkey")
def handle_public_key_request() -> Response:
    config = Config.get()
    return jsonify(
        create_pubkey_response(
            config.signing_cert_chain, config.encryption_cert_chain
        ).to_dict()
    )


@bp.route("/uma-configuration")
def uma_config() -> Dict[str, Any]:
    vasp_domain = current_app.config.get("VASP_DOMAIN", "localhost")
    nwc_domain = current_app.config.get("NWC_SERVER_DOMAIN", f"nwc.{vasp_domain}")
    protocol = "http" if is_domain_local(nwc_domain) else "https"
    nwc_base = f"{protocol}://{nwc_domain}"
    request_uri = f"{protocol}://{vasp_domain}/api/uma/request_pay_invoice"
    supported_nwc_commands = current_app.config.get(
        "VASP_SUPPORTED_COMMANDS",
        [
            "pay_invoice",
            "make_invoice",
            "lookup_invoice",
            "get_balance",
            "get_budget",
            "get_info",
            "list_transactions",
            "pay_keysend",
            "lookup_user",
            "fetch_quote",
            "execute_quote",
            "pay_to_address",
        ],
    )
    return {
        "name": "Pinkdrink",
        "authorization_endpoint": f"{nwc_base}/oauth/auth",
        "token_endpoint": f"{nwc_base}/oauth/token",
        "nwc_commands_supported": supported_nwc_commands,
        "uma_major_versions": [0, 1],
        "grant_types_supported": ["authorization_code"],
        "code_challenge_methods_supported": ["S256"],
        "uma_request_endpoint": request_uri,
        "connection_management_endpoint": f"{nwc_base}",
    }
