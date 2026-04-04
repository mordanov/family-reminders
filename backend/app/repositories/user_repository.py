from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.models import User, UserSetting
from app.auth.security import hash_password
from typing import Optional, List


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.username == username).options(selectinload(User.settings))
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.id == user_id).options(selectinload(User.settings))
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> List[User]:
        result = await self.db.execute(select(User).where(User.is_active == True))
        return result.scalars().all()

    async def create(self, username: str, password: str, email: Optional[str] = None) -> User:
        user = User(username=username, email=email, hashed_password=hash_password(password))
        self.db.add(user)
        await self.db.flush()
        setting = UserSetting(user_id=user.id, timezone="UTC")
        self.db.add(setting)
        await self.db.flush()
        return user

    async def update_settings(self, user_id: int, timezone: str) -> Optional[UserSetting]:
        result = await self.db.execute(select(UserSetting).where(UserSetting.user_id == user_id))
        setting = result.scalar_one_or_none()
        if not setting:
            setting = UserSetting(user_id=user_id, timezone=timezone)
            self.db.add(setting)
        else:
            setting.timezone = timezone
        await self.db.flush()
        return setting
