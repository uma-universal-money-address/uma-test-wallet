from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class WebauthnChallengeData:
    """This is the data that we cache for the webauthn challenge."""

    data: str


class IWebauthnChallengeCache(ABC):
    """
    A simple in-memory cache for webauthn challenges. In practice, this would be
    stored in redis or something more scalable.
    """

    @abstractmethod
    def get_challenge_data(self, user_id: str) -> Optional[WebauthnChallengeData]:
        pass

    @abstractmethod
    def save_challenge_data(
        self,
        user_id: str,
        data: str,
    ) -> None:
        pass

    @abstractmethod
    def delete_challenge_data(self, user_id: str) -> None:
        pass
