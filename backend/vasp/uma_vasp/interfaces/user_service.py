from abc import ABC, abstractmethod
from typing import Optional, List


from vasp.models.Currency import Currency
from vasp.uma_vasp.user import User


class IUserService(ABC):
    @abstractmethod
    def get_user_from_uma(self, uma_user_name: str) -> Optional[User]:
        pass

    @abstractmethod
    def get_user_from_id(self, user_id: str) -> Optional[User]:
        pass

    @abstractmethod
    def get_currency_preferences_for_user(self) -> List["Currency"]:
        pass
