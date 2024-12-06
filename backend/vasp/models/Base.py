from typing import Any
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    def __setitem__(self, key: str, value: Any) -> None:  # pyre-ignore [2]
        return setattr(self, key, value)
