from typing import Any, Dict, Optional

from abc import ABC, abstractmethod


class IRequestStorage(ABC):
    @abstractmethod
    def save_request(self, request_id: str, request: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete_request(self, request_id: str) -> None:
        pass

    @abstractmethod
    def get_requests(self) -> Dict[str, Any]:
        pass
