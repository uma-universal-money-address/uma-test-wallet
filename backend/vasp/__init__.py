import os
import json
import logging
from datetime import datetime, timezone

from flask import (
    Flask,
    Response,
    current_app,
    jsonify,
    redirect,
    request,
)
from flask_caching import Cache
from flask_cors import CORS
from uma import (
    INonceCache,
    InMemoryNonceCache,
    InMemoryPublicKeyCache,
    UnsupportedVersionException,
    is_domain_local,
)

from vasp.uma_vasp.config import Config, get_http_host
from vasp.uma_vasp.demo.demo_compliance_service import DemoComplianceService
from vasp.uma_vasp.demo.demo_user_service import DemoUserService
from vasp.uma_vasp.demo.demo_currency_service import DemoCurrencyService
from vasp.uma_vasp.demo.internal_ledger_service import InternalLedgerService
from vasp.uma_vasp.demo.sending_vasp_request_cache import SendingVaspRequestCache
from vasp.uma_vasp.demo.demo_request_storage import RequestStorage
from vasp.uma_vasp.receiving_vasp import (
    register_routes as register_receiving_vasp_routes,
)
from vasp.uma_nwc_bridge import (
    construct_blueprint as construct_nwc_blueprint,
)
from vasp.uma_vasp.sending_vasp import (
    register_routes as register_sending_vasp_routes,
)
from vasp.uma_vasp.uma_exception import UmaException
from vasp.db import db, setup_rds_iam_auth
from vasp.uma_vasp.interfaces.request_storage import IRequestStorage
from werkzeug.wrappers.response import Response as WerkzeugResponse
from lightspark import LightsparkSyncClient as LightsparkClient

log: logging.Logger = logging.getLogger(__name__)


def create_app() -> Flask:
    # create and configure the app
    app: Flask = Flask(__name__)

    app.config.from_envvar("FLASK_CONFIG")
    app.config["CACHE_TYPE"] = "FileSystemCache"
    app.config["CACHE_DIR"] = "/tmp"

    cache = Cache(app)

    CORS(
        app,
        resources={
            r"/*": {"origins": "*"},
        },
        allow_headers=["access-control-allow-origin", "Content-Type"],
        supports_credentials=True,
    )

    app.static_url_path = ""

    # ensure the instance folder exists
    try:
        if app.instance_path:
            os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    if app.config.get("RDS_IAM_AUTH"):
        setup_rds_iam_auth(db.engine)

    host = get_http_host()
    config = Config.get()

    lightspark_client = LightsparkClient(
        api_token_client_id=config.api_token_client_id,
        api_token_client_secret=config.api_token_client_secret,
        base_url=config.base_url,
        http_host=host,
    )

    compliance_service = DemoComplianceService(lightspark_client, config)
    user_service = DemoUserService()
    ledger_service = InternalLedgerService()
    currency_service = DemoCurrencyService()
    pubkey_cache = InMemoryPublicKeyCache()
    nonce_cache: INonceCache = InMemoryNonceCache(datetime.now(timezone.utc))
    uma_request_storage: IRequestStorage = RequestStorage()

    from . import auth, user, currencies, uma

    app.register_blueprint(auth.bp)
    app.register_blueprint(uma.bp)

    from vasp.uma_vasp import well_known, utxo_callback

    app.register_blueprint(well_known.bp)
    app.register_blueprint(
        utxo_callback.construct_blueprint(
            pubkey_cache=pubkey_cache, nonce_cache=nonce_cache
        )
    )
    app.register_blueprint(
        user.construct_blueprint(
            ledger_service=ledger_service, currency_service=currency_service
        )
    )
    app.register_blueprint(
        construct_nwc_blueprint(
            config=config,
            lightspark_client=lightspark_client,
            ledger_service=ledger_service,
            user_service=user_service,
            compliance_service=compliance_service,
            currency_service=currency_service,
            pubkey_cache=pubkey_cache,
            request_cache=SendingVaspRequestCache(cache),
            nonce_cache=nonce_cache,
            uma_request_storage=uma_request_storage,
        )
    )
    app.register_blueprint(
        currencies.construct_blueprint(
            currency_service=currency_service,
        )
    )

    @app.errorhandler(UmaException)
    def invalid_api_usage(e: UmaException) -> tuple[Response, int]:
        return jsonify(e.to_dict()), e.status_code

    @app.errorhandler(UnsupportedVersionException)
    def unsupported_version(e: UnsupportedVersionException) -> tuple[Response, int]:
        return jsonify(json.loads(e.to_json())), 412

    register_receiving_vasp_routes(
        app,
        config=config,
        lightspark_client=lightspark_client,
        user_service=user_service,
        ledger_service=ledger_service,
        currency_service=currency_service,
        compliance_service=compliance_service,
        pubkey_cache=pubkey_cache,
        nonce_cache=nonce_cache,
    )
    register_sending_vasp_routes(
        app,
        config=config,
        lightspark_client=lightspark_client,
        user_service=user_service,
        ledger_service=ledger_service,
        currency_service=currency_service,
        compliance_service=compliance_service,
        pubkey_cache=pubkey_cache,
        request_cache=SendingVaspRequestCache(cache),
        nonce_cache=nonce_cache,
        uma_request_storage=uma_request_storage,
    )

    @app.route("/-/alive")
    def alive() -> str:
        return "ok"

    @app.route("/-/ready")
    def ready() -> str:
        return "ok"

    def redirect_to_nwc() -> WerkzeugResponse:
        """
        Redirect to the NWC app page.
        """
        vasp_domain = current_app.config.get("VASP_DOMAIN", "localhost")
        nwc_domain = current_app.config.get(
            "NWC_SERVER_DOMAIN", f"umanwc.{vasp_domain}"
        )
        query = request.query_string.decode("utf-8")
        protocol = "http" if is_domain_local(nwc_domain) else "https"
        path = request.path
        return redirect(f"{protocol}://{nwc_domain}{path}?{query}", code=302)

    @app.route("/apps")
    def nwc_apps() -> WerkzeugResponse:
        """
        Redirect to the NWC app page.
        """
        return redirect_to_nwc()

    @app.route("/apps/new")
    def new_nwc_app() -> WerkzeugResponse:
        """
        Redirect to the NWC app creation page.
        """
        return redirect_to_nwc()

    @app.route("/oauth/auth")
    def oauth_auth() -> WerkzeugResponse:
        """
        Redirect to the NWC app oauth page.
        """
        return redirect_to_nwc()

    @app.post("/oauth/token")
    def oauth_token() -> WerkzeugResponse:
        """
        Redirect to the NWC app oauth page.
        """
        return redirect_to_nwc()

    return app
