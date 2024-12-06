from typing import Any, Dict, Optional

from vasp.uma_vasp.interfaces.request_storage import IRequestStorage


class RequestStorage(IRequestStorage):
    def __init__(self) -> None:
        self._cache: dict[str, Any] = {}

    def save_request(self, request_id: str, request: Dict[str, Any]) -> None:
        self._cache[request_id] = request

    def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        return self._cache.get(request_id)

    def delete_request(self, request_id: str) -> None:
        self._cache.pop(request_id, None)

    def get_requests(self) -> Dict[str, Any]:
        return self._cache
