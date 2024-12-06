from typing import Optional
from quart import session
from sqlalchemy import select
from sqlalchemy.orm import Session

from vasp.db import db
from vasp.uma_vasp.user import User
from vasp.uma_vasp.interfaces.user_service import IUserService
from vasp.models.Currency import Currency


class DemoUserService(IUserService):
    def get_user_from_uma(self, uma_user_name: str) -> Optional[User]:
        # Remove $ from uma_user_name
        if uma_user_name.startswith("$"):
            uma_user_name = uma_user_name[1:]
        return User.from_model_uma(uma_user_name)

    def get_user_from_id(self, user_id: int) -> Optional[User]:
        return User.from_id(user_id)

    def get_currency_preferences_for_user(self) -> list[Currency]:
        user_id = session["user_id"]

        with Session(db.engine) as db_session:
            return db_session.scalars(
                select(Currency).where(Currency.user_id == user_id)
            ).all()
