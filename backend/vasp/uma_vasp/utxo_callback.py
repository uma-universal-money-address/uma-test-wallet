import json

from flask import Blueprint, request
from uma import (
    INonceCache,
    IPublicKeyCache,
    InvalidSignatureException,
    PostTransactionCallback,
    fetch_public_key_for_vasp,
    verify_post_transaction_callback_signature,
)

from vasp.uma_vasp.uma_exception import UmaException


def construct_blueprint(
    pubkey_cache: IPublicKeyCache, nonce_cache: INonceCache
) -> Blueprint:
    bp = Blueprint("utxo_callback", __name__, url_prefix="/api/uma")

    @bp.post("/utxoCallback")
    def handle_utxo_callback() -> str:
        print(f"Received UTXO callback for {request.args.get('txid')}:")
        try:
            tx_callback = PostTransactionCallback.from_json(json.dumps(request.json))
        except Exception as e:
            raise UmaException(
                status_code=400, message=f"Error parsing UTXO callback: {e}"
            )

        print(tx_callback.to_json())

        if tx_callback.vasp_domain:
            other_vasp_pubkeys = fetch_public_key_for_vasp(
                vasp_domain=tx_callback.vasp_domain,
                cache=pubkey_cache,
            )
            try:
                verify_post_transaction_callback_signature(
                    tx_callback, other_vasp_pubkeys, nonce_cache
                )
            except InvalidSignatureException as e:
                raise UmaException(
                    f"Error verifying post-tx callback signature: {e}", 424
                )

        return "OK"

    return bp
