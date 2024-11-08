import os
from quart import redirect

is_dev: bool = os.environ.get("QUART_ENV") == "development"


def redirect_frontend(path: str) -> None:
    updated_path = path
    if is_dev:
        updated_path = f"http://localhost:3008{path}"

    print("redirecting to", updated_path, "from", path)
    redirect(updated_path)
