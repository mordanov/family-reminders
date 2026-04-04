from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.auth.security import verify_password, create_access_token
from app.schemas.auth import UserCreate, UserOut, Token
from app.models.models import User


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def login(self, username: str, password: str) -> Token:
        user = await self.repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        token = create_access_token({"sub": user.username})
        return Token(access_token=token)

    async def register(self, data: UserCreate) -> UserOut:
        existing = await self.repo.get_by_username(data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user = await self.repo.create(data.username, data.password, data.email)
        return UserOut.model_validate(user)

    async def get_all_users(self):
        return await self.repo.get_all()

    async def update_settings(self, user_id: int, timezone: str):
        return await self.repo.update_settings(user_id, timezone)
