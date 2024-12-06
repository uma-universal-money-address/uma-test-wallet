from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse, unquote
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from typing import Optional
from flask import Blueprint, current_app, request, session, redirect

from enum import Enum
from vasp.utils import get_vasp_domain
from vasp.db import db
from vasp.models.User import User as UserModel
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.models.Currency import Currency
from vasp.uma_vasp.currencies import CURRENCIES
import json
from werkzeug.wrappers import Response as WerkzeugResponse

log: logging.Logger = logging.getLogger(__name__)

bp = Blueprint("auth", __name__, url_prefix="/auth")


class AuthMethod(Enum):
    Google = 1
    Phone = 2
    Webauthn = 3


@bp.get("/nwcsession")
def nwc_login() -> WerkzeugResponse:
    user_id = session.get("user_id")
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

    user = User.from_id(user_id)
    if user is None:
        abort_with_error(404, f"User {user_id} not found.")
    with Session(db.engine) as db_session:
        currency = db_session.scalars(
            select(Currency).where(Currency.user_id == user_id)
        ).first()

    jwt_private_key = current_app.config.get("NWC_JWT_PRIVKEY")
    if not jwt_private_key:
        abort_with_error(500, "JWT private key not set in config.")

    user_nwc_jwt = jwt.encode(
        {
            "sub": str(user_id),
            "aud": get_vasp_domain(),
            "exp": datetime.timestamp(datetime.now() + timedelta(minutes=10)),
            "iss": get_vasp_domain(),
            "address": user.get_default_uma_address(),
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


@bp.before_app_request
async def load_logged_in_user() -> None:
    if (
        request.full_path.startswith("/.well-known/")
        or request.full_path.startswith("/api/uma/")
        or request.full_path.startswith("/-/")
        or request.full_path.startswith("/umanwc/")
        or request.full_path.startswith("/apps/new")
        or request.full_path.startswith("/uma")
    ):
        return

    user_id = session.get("user_id")
    if isinstance(user_id, str):
        try:
            user_id = int(user_id)
        except ValueError:
            session.pop("user_id", None)
            user_id = None

    if user_id is None:
        user = await get_user_for_login()
        if user is None:
            abort_with_error(401, "Unauthorized")

        session["user_id"] = user.id


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
    return ("1", AuthMethod.Webauthn)
