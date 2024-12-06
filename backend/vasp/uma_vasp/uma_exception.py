from typing import Any, Dict, NoReturn


class UmaException(Exception):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code

    def __str__(self) -> str:
        return f"UmaException: {self.message}, Status Code: {self.status_code}"

    def to_dict(self) -> Dict[str, Any]:
        return {"reason": self.message, "status": "ERROR"}


def abort_with_error(status_code: int, reason: str) -> NoReturn:
    print(f"Aborting with error {status_code}: {reason}")
    raise UmaException(reason, status_code)
