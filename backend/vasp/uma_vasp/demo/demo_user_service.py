from typing import Optional

from vasp.uma_vasp.user import User
from vasp.uma_vasp.interfaces.user_service import IUserService
from vasp.utils import get_username_from_uma

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User


class DemoUserService(IUserService):
    def get_user_from_uma(self, uma: str) -> Optional[User]:
        uma_user_name = get_username_from_uma(uma)

        return User.from_model_uma(uma_user_name)

    def get_user_from_id(self, user_id: str) -> Optional[User]:
        return User.from_id(user_id)
