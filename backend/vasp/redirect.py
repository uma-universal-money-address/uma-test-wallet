import os
from flask import redirect
from werkzeug.wrappers import Response

is_dev: bool = os.environ.get("FLASK_ENV") == "development"


def redirect_frontend(path: str) -> Response:
    updated_path = path
    if is_dev:
        updated_path = f"http://localhost:3000{path}"

    print("redirecting to", updated_path, "from", path)
    return redirect(updated_path)
