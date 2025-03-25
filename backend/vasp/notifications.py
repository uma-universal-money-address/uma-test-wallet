from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from vasp.db import db
from vasp.uma_vasp.uma_exception import abort_with_error
from vasp.uma_vasp.user import User
from vasp.models.PushSubscription import PushSubscription
from vasp.uma_vasp.config import Config
from werkzeug.wrappers import Response as WerkzeugResponse

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User

log: logging.Logger = logging.getLogger(__name__)


# To be registed in user blueprint (so paths will look like /user/notifications/...)
def construct_blueprint(config: Config) -> Blueprint:
    bp = Blueprint("notifications", __name__, url_prefix="/api/user/notifications")

    @bp.get("/vapid-public-key")
    def vapid_public_key() -> WerkzeugResponse:
        return jsonify({"public_key": config.vapid_public_key})

    @bp.post("/subscribe")
    @login_required
    def subscribe() -> WerkzeugResponse:
        data = request.get_json()

        if "subscription_json" not in data:
            abort_with_error(400, "Subscription not found.")

        subscription_json = data["subscription_json"]
        with Session(db.engine) as db_session:
            existing_subscriptions = db_session.scalars(
                select(PushSubscription)
                .where(PushSubscription.user_id == current_user.id)
                .order_by(PushSubscription.last_used.desc())
            ).all()

            # Limit the number of subscriptions to 1 for now
            if len(existing_subscriptions) >= 1:
                for subscription in existing_subscriptions:
                    db_session.delete(subscription)

            subscription = PushSubscription(
                user_id=current_user.id,
                subscription_json=subscription_json,
            )

            db_session.add(subscription)
            db_session.commit()
        return jsonify({"success": True})

    @bp.post("/unsubscribe")
    @login_required
    def unsubscribe() -> WerkzeugResponse:
        with Session(db.engine) as db_session:
            subscriptions = db_session.scalars(
                select(PushSubscription).where(
                    PushSubscription.user_id == current_user.id
                )
            ).all()

            for subscription in subscriptions:
                db_session.delete(subscription)
            db_session.commit()
        return jsonify({"success": True})

    @bp.post("/send")
    @login_required
    def send_notification() -> WerkzeugResponse:
        data = request.get_json()

        if "title" not in data:
            abort_with_error(400, "Title not found.")
        if "body" not in data:
            abort_with_error(400, "Body not found.")

        title = data["title"]
        body = data["body"]

        current_user.send_push_notification(
            config=config,
            title=title,
            body=body,
        )
        return jsonify({"success": True})

    return bp
