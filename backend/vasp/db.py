import logging
from time import monotonic
from typing import Any

from flask import Flask
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from botocore.client import BaseClient

log: logging.Logger = logging.getLogger(__name__)


class SQLAlchemyDB:
    _engine = None

    def init_app(self, app: Flask) -> None:
        self._engine = create_engine(app.config["DATABASE_URI"])

    @property
    def engine(self) -> Engine:
        assert self._engine
        return self._engine


db = SQLAlchemyDB()


def setup_rds_iam_auth(engine: Engine) -> None:
    from botocore.session import get_session

    rds: BaseClient = get_session().create_client("rds")
    token_cache: list[float | str] = []

    @event.listens_for(engine, "do_connect", named=True)
    def provide_token(cparams: dict[str, Any], **_kwargs: Any) -> None:
        if not token_cache or monotonic() - token_cache[0] > 600:  # pyre-ignore[58]
            log.info("Generating RDS auth token")
            token = rds.generate_db_auth_token(
                cparams["host"], cparams["port"], cparams["user"]
            )
            token_cache.clear()
            token_cache.extend((monotonic(), token))
        cparams["password"] = token_cache[1]
