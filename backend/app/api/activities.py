from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.activity_service import ActivityService
from app.schemas.activities import ActivityCreate, ActivityUpdate, ActivityOut
from app.auth.security import get_current_user
from app.models.models import User
from typing import List

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=List[ActivityOut])
async def list_activities(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = ActivityService(db)
    return await svc.get_for_user(current_user.id)


@router.post("", response_model=ActivityOut)
async def create_activity(data: ActivityCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = ActivityService(db)
    return await svc.create(current_user.id, data)


@router.put("/{act_id}", response_model=ActivityOut)
async def update_activity(act_id: int, data: ActivityUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = ActivityService(db)
    return await svc.update(act_id, current_user.id, data)


@router.delete("/{act_id}")
async def delete_activity(act_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = ActivityService(db)
    await svc.delete(act_id, current_user.id)
    return {"ok": True}
