from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse, unquote
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from typing import Optional
from flask import Blueprint, current_app, request, redirect, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from vasp.redirect import redirect_frontend

from enum import Enum
from vasp.utils import get_vasp_domain
from vasp.db import db
from vasp.models.User import User as UserModel
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.models.Wallet import Wallet
from vasp.models.Currency import Currency
from vasp.uma_vasp.currencies import CURRENCIES
import json
from werkzeug.wrappers import Response as WerkzeugResponse

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)

bp = Blueprint("auth", __name__, url_prefix="/auth")


class AuthMethod(Enum):
    Google = 1
    Phone = 2
    Webauthn = 3


@bp.get("/nwcsession")
@login_required
def nwc_login() -> WerkzeugResponse:
    redirect_url = request.args.get("redirect_uri")
    if not redirect_url:
        abort_with_error(400, "Redirect URL is required.")
    parsed_url = urlparse(unquote(redirect_url))
    vasp_domain = get_vasp_domain()
    expected_domain = current_app.config.get("NWC_SERVER_DOMAIN", f"nwc.{vasp_domain}")
    if parsed_url.netloc != expected_domain:
        abort_with_error(
            400,
            f"Invalid redirect URL: {parsed_url.netloc}. Domain should be {expected_domain}",
        )

    with Session(db.engine) as db_session:
        currency = db_session.scalars(
            select(Currency).join(Wallet).where(Wallet.user_id == current_user.id)
        ).first()

    jwt_private_key = current_app.config.get("NWC_JWT_PRIVKEY")
    if not jwt_private_key:
        abort_with_error(500, "JWT private key not set in config.")

    user_nwc_jwt = jwt.encode(
        {
            "sub": str(current_user.id),
            "aud": get_vasp_domain(),
            "exp": datetime.timestamp(datetime.now() + timedelta(minutes=10)),
            "iss": get_vasp_domain(),
            "address": current_user.get_default_uma_address(),
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


@bp.route("/login", methods=["GET", "POST"])
def login() -> None:
    user_id = None
    if request.method == "POST":
        user_id = request.get_json()["user_id"]
    elif request.method == "GET":
        user_id = request.args.get("user_id")

    if not user_id:
        abort_with_error(400, "User ID is required.")

    # TODO: Implement login
    user = User.from_id(user_id)
    login_user(user)
    redirect_frontend("/")


@bp.route("/login/redirect", methods=["GET"])
async def login_redirect() -> WerkzeugResponse:
    user = await get_user_for_login()
    if user:
        login_user(user)
        return jsonify({"logged_in": True})
    else:
        return jsonify({"logged_in": False})


@bp.route("/logout")
@login_required
def logout() -> None:
    logout_user()
    redirect_frontend("/login")


@bp.route("/logged_in", methods=["GET"])
def logged_in() -> WerkzeugResponse:
    if current_user.is_authenticated:
        return jsonify({"logged_in": True})
    else:
        return jsonify({"logged_in": False})


async def get_user_for_login() -> Optional[User]:
    [id, auth_method] = await gen_resolve_id()

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


async def gen_resolve_id() -> tuple[str, AuthMethod]:
    # TODO: determine the id and auth method from the request
    logging.debug("TODO: determine the id and auth method from the request")
    return ("1", AuthMethod.Google)
