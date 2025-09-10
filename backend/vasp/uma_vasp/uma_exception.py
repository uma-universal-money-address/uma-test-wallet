from typing import NoReturn
from uma import UmaException, ErrorCode


def abort_with_error(error_code: ErrorCode, reason: str) -> NoReturn:
    print(
        f"Aborting with error {error_code.value.http_status_code} {error_code.value.code}: {reason}"
    )
    raise UmaException(reason=reason, error_code=error_code)
