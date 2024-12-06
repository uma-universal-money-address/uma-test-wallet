from typing import Optional

from vasp.uma_vasp.user import User
from vasp.uma_vasp.interfaces.user_service import IUserService

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    current_user: User


class DemoUserService(IUserService):
    def get_user_from_uma(self, uma_user_name: str) -> Optional[User]:
        # Remove $ from uma_user_name
        if uma_user_name.startswith("$"):
            uma_user_name = uma_user_name[1:]
        return User.from_model_uma(uma_user_name)

    def get_user_from_id(self, user_id: str) -> Optional[User]:
        return User.from_id(user_id)
