from typing import Optional
from flask_caching import Cache

from vasp.uma_vasp.interfaces.webauthn_challenge_cache import (
    IWebauthnChallengeCache,
    WebauthnChallengeData,
)


class WebauthnChallengeCache(IWebauthnChallengeCache):
    def __init__(self, cache: Cache) -> None:
        self.cache = cache

    def get_challenge_data(self, user_id: str) -> Optional[WebauthnChallengeData]:
        return self.cache.get(f"webauthn_challenge_{user_id}")

    def save_challenge_data(
        self,
        user_id: str,
        data: str,
    ) -> None:
        self.cache.set(
            f"webauthn_challenge_{user_id}",
            WebauthnChallengeData(
                data=data,
            ),
        )

    def delete_challenge_data(self, user_id: str) -> None:
        self.cache.delete(f"webauthn_challenge_{user_id}")
