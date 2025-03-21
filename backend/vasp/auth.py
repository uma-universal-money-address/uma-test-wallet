from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse, unquote
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging
import base64

from typing import Optional, TypedDict, Union, Dict, Any
from flask import Blueprint, current_app, request, redirect, jsonify, session
from flask_login import login_user, login_required, logout_user, current_user
from vasp.redirect import redirect_frontend
from vasp.uma_vasp.config import Config

from enum import Enum
from vasp.utils import (
    get_vasp_domain,
    get_uma_from_username,
    get_frontend_allowed_origins,
    get_frontend_domain,
    is_dev,
)
from vasp.db import db
from vasp.models.User import User as UserModel
from vasp.models.WebAuthnCredential import WebAuthnCredential
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.models.Wallet import Wallet
from vasp.models.Uma import Uma
from vasp.models.Currency import Currency
from vasp.uma_vasp.currencies import CURRENCIES
from vasp.uma_vasp.interfaces.webauthn_challenge_cache import IWebauthnChallengeCache
import json
from werkzeug.wrappers import Response as WerkzeugResponse
import webauthn
from uuid import uuid4

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)


class AuthMethod(Enum):
    Webauthn = 1
    Google = 2
    Phone = 3


class WebauthnLoginData(TypedDict):
    challenge_id: str
    credential: Union[Dict[str, Any]]


def get_webauthn_expected_rp_id() -> str:
    return "localhost" if is_dev else get_frontend_domain()


def construct_blueprint(
    challenge_cache: IWebauthnChallengeCache,
    config: Config,
) -> Blueprint:
    bp = Blueprint("auth", __name__, url_prefix="/api/auth")

    @bp.get("/nwcsession")
    @login_required
    def nwc_login() -> WerkzeugResponse:
        redirect_url = request.args.get("redirect_uri")
        if not redirect_url:
            abort_with_error(400, "Redirect URL is required.")
        parsed_url = urlparse(unquote(redirect_url))
        vasp_domain = get_vasp_domain()
        nwc_base_path = current_app.config.get(
            "NWC_SERVER_BASE_PATH", f"https://umanwc.{vasp_domain}"
        )
        expected_domain = urlparse(nwc_base_path).netloc
        if parsed_url.netloc != expected_domain:
            abort_with_error(
                400,
                f"Invalid redirect URL: {parsed_url.netloc}. Domain should be {expected_domain}",
            )

        jwt_private_key = current_app.config.get("NWC_JWT_PRIVKEY")
        if not jwt_private_key:
            abort_with_error(500, "JWT private key not set in config.")

        query_params = parse_qs(parsed_url.query)
        [username] = query_params["uma_username"]

        if username:
            session["uma"] = get_uma_from_username(username)
        else:
            session["uma"] = current_user.get_default_uma_address()

        with Session(db.engine) as db_session:
            wallet = db_session.scalars(
                select(Wallet)
                .join(Uma)
                .where(Uma.user_id == current_user.id)
                .where(Uma.username == username)
            ).first()
            if not wallet:
                abort_with_error(400, f"Wallet not found for user {username}")
            currency = db_session.scalars(
                select(Currency).where(Currency.wallet_id == wallet.id)
            ).first()

        user_nwc_jwt = jwt.encode(
            {
                "sub": str(current_user.id),
                "aud": get_vasp_domain(),
                "exp": datetime.timestamp(datetime.now() + timedelta(minutes=10)),
                "iss": get_vasp_domain(),
                "address": (session["uma"]),
            },
            jwt_private_key,
            algorithm="ES256",
        )

        query_params = parse_qs(parsed_url.query)
        query_params["token"] = [user_nwc_jwt]
        query_params["currency"] = [
            json.dumps(
                {
                    "code": currency.code,
                    "name": CURRENCIES[currency.code].name,
                    "symbol": CURRENCIES[currency.code].symbol,
                    "decimals": CURRENCIES[currency.code].decimals,
                }
            )
        ]
        new_query_string = urlencode(query_params, doseq=True)
        new_url = urlunparse(parsed_url._replace(query=new_query_string))
        print(f"Redirecting to {new_url}")
        return redirect(str(new_url))

    @bp.post("/login")
    def login() -> WerkzeugResponse:
        data = request.get_json()

        user: Optional["User"] = None
        webauthn_login_data: WebauthnLoginData = data["webauthn"]
        if webauthn_login_data:
            user = handle_webauthn_login(webauthn_login_data)

        if not user:
            abort_with_error(400, "Unable to login user.")

        print(f"Logging in user {user.id}")
        login_user(user, remember=True)
        return jsonify({"success": True})

    @bp.get("/login/redirect")
    def login_redirect() -> WerkzeugResponse:
        next_url = request.args.get("next")

        # Only redirect frontend if it's an uma auth redirect
        if next_url and next_url.find("redirect_uri") != -1:
            return redirect_frontend("/login?next=" + next_url)

        # Let the frontend redirect otherwise there will be a CORS issues
        return jsonify({})

    @bp.post("/logout")
    @login_required
    def logout() -> WerkzeugResponse:
        logout_user()
        return jsonify({"success": True})

    @bp.get("/logged_in")
    def logged_in() -> WerkzeugResponse:
        if current_user.is_authenticated:
            return jsonify({"logged_in": True})
        else:
            return jsonify({"logged_in": False})

    def get_user_for_login() -> Optional[User]:
        [id, auth_method] = gen_resolve_id()

        # Check db for user
        with Session(db.engine) as db_session:
            user: Optional[UserModel] = None
            # for each auth method, check if the user exists
            if auth_method == AuthMethod.Google:
                user = db_session.scalars(
                    select(UserModel).where(UserModel.google_id == id)
                ).first()
            else:
                abort_with_error(400, "Invalid auth method")

            if user:
                existing_user = User.from_model(user)
                return existing_user

    def gen_resolve_id() -> tuple[str, AuthMethod]:
        # TODO: determine the id and auth method from the request
        logging.debug("TODO: determine the id and auth method from the request")
        return ("1", AuthMethod.Google)

    @bp.post("/webauthn_options")
    @login_required
    def webauthn_options() -> str:
        public_credential_creation_options = webauthn.generate_registration_options(
            rp_id=get_webauthn_expected_rp_id(),
            rp_name="UMA Sandbox",
            user_id="UMA Sandbox".encode(
                "utf-8"
            ),  # Not user specific so credentials can be retrieved without username
            user_name="UMA Sandbox",
            timeout=60000,
        )

        challenge_data = base64.b64encode(
            public_credential_creation_options.challenge
        ).decode("utf-8")
        challenge_cache.save_challenge_data(
            user_id=current_user.id, data=challenge_data
        )

        return webauthn.options_to_json(public_credential_creation_options)

    @bp.post("/webauthn_register")
    @login_required
    def webauthn_register() -> WerkzeugResponse:
        challenge_data = challenge_cache.get_challenge_data(current_user.id)
        if not challenge_data:
            abort_with_error(400, "No challenge data found.")

        auth_verification = webauthn.verify_registration_response(
            credential=request.get_json(),
            expected_challenge=webauthn.base64url_to_bytes(challenge_data.data),
            expected_origin=get_frontend_allowed_origins(get_frontend_domain()),
            expected_rp_id=get_webauthn_expected_rp_id(),
        )

        # Python implementation of base64 encoding will have slightly different symbols, make it a urlsafe base64 encoding
        with Session(db.engine) as db_session:
            credential = WebAuthnCredential(
                user_id=current_user.id,
                credential_id=base64.urlsafe_b64encode(
                    auth_verification.credential_id
                ).decode("utf-8"),
                credential_public_key=auth_verification.credential_public_key,
            )

            db_session.add(credential)
            db_session.commit()

        session["webauthn_authenticated"] = True
        return jsonify({"success": True})

    @bp.post("/webauthn_prepare_login")
    def webauthn_prepare_login() -> WerkzeugResponse:
        authentication_options = webauthn.generate_authentication_options(
            rp_id=get_webauthn_expected_rp_id(),
            allow_credentials=[],  # Allow any credential
            timeout=60000,
        )

        # Random identifier because it's an anonymous user
        user_id = str(uuid4())
        challenge_data = (
            base64.b64encode(authentication_options.challenge)
            .decode("utf-8")
            .replace("+", "-")
            .replace("/", "_")
            .rstrip("=")
        )
        challenge_cache.save_challenge_data(
            user_id=user_id,
            data=challenge_data,
        )

        authentication_options_dict = json.loads(
            webauthn.options_to_json(authentication_options)
        )
        return jsonify(
            {"challenge_id": user_id, "options": authentication_options_dict}
        )

    def handle_webauthn_login(webauthn_login_data: WebauthnLoginData) -> Optional[User]:
        challenge_id = webauthn_login_data["challenge_id"]
        credential = webauthn_login_data["credential"]
        if not challenge_id:
            abort_with_error(400, "Challenge ID is required.")
        if not credential:
            abort_with_error(400, "Credential is required.")

        challenge_data = challenge_cache.get_challenge_data(challenge_id)
        if not challenge_data:
            abort_with_error(400, "No challenge data found.")

        # The credential ID saved has padding due to Python's implementation of webauthn
        # Thus we need to add padding to the credential ID provided by the browser which does not
        credential_id = credential["id"]
        credential_id_with_padding = credential_id + "=" * (-len(credential_id) % 4)
        with Session(db.engine) as db_session:
            credential_model = db_session.scalars(
                select(WebAuthnCredential).where(
                    WebAuthnCredential.credential_id == credential_id_with_padding
                )
            ).first()

            if not credential_model:
                abort_with_error(400, "Credential not found.")

            try:
                webauthn.verify_authentication_response(
                    credential=credential,
                    expected_challenge=challenge_data.data.encode(),
                    expected_origin=get_frontend_allowed_origins(get_frontend_domain()),
                    expected_rp_id=get_webauthn_expected_rp_id(),
                    credential_public_key=credential_model.credential_public_key,
                    credential_current_sign_count=0,  # Not used
                )
            except Exception as e:
                abort_with_error(400, f"Unable to verify webauthn: {str(e)}")

            challenge_cache.delete_challenge_data(challenge_id)
            return User.from_id(credential_model.user_id)

    return bp
