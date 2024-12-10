from abc import ABC, abstractmethod
from typing import Optional


from vasp.uma_vasp.user import User


class IUserService(ABC):
    @abstractmethod
    def get_user_from_uma(self, uma: str) -> Optional[User]:
        pass

    @abstractmethod
    def get_user_from_id(self, user_id: str) -> Optional[User]:
        pass
