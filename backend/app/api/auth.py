from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import Token, UserCreate, UserOut, UserSettingUpdate, UserSettingOut
from app.auth.security import get_current_user
from app.models.models import User
from typing import List

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginForm:
    def __init__(
        self,
        username: str = Form(...),
        password: str = Form(...),
        remember_me: bool = Form(False),
    ):
        self.username = username
        self.password = password
        self.remember_me = remember_me


@router.post("/login", response_model=Token)
async def login(form: LoginForm = Depends(), db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.login(form.username, form.password, form.remember_me)


@router.post("/register", response_model=UserOut)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.register(data)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.get("/users", response_model=List[UserOut])
async def list_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = AuthService(db)
    users = await svc.get_all_users()
    return [UserOut.model_validate(u) for u in users]


@router.put("/settings", response_model=UserSettingOut)
async def update_settings(
    data: UserSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = AuthService(db)
    setting = await svc.update_settings(current_user.id, data.timezone)
    return UserSettingOut.model_validate(setting)


@router.get("/settings", response_model=UserSettingOut)
async def get_settings(current_user: User = Depends(get_current_user)):
    if current_user.settings:
        return UserSettingOut.model_validate(current_user.settings)
    return UserSettingOut(timezone="UTC")
