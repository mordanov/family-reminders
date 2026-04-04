from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.life_goal_service import LifeGoalService
from app.schemas.activities import LifeGoalCreate, LifeGoalUpdate, LifeGoalOut, LifeGoalCopy
from app.auth.security import get_current_user
from app.models.models import User
from typing import List

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=List[LifeGoalOut])
async def list_goals(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = LifeGoalService(db)
    return await svc.get_for_user(current_user.id)


@router.post("", response_model=LifeGoalOut)
async def create_goal(data: LifeGoalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = LifeGoalService(db)
    return await svc.create(current_user.id, data)


@router.put("/{goal_id}", response_model=LifeGoalOut)
async def update_goal(goal_id: int, data: LifeGoalUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = LifeGoalService(db)
    return await svc.update(goal_id, current_user.id, data)


@router.delete("/{goal_id}")
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = LifeGoalService(db)
    await svc.delete(goal_id, current_user.id)
    return {"ok": True}


@router.post("/{goal_id}/copy", response_model=LifeGoalOut)
async def copy_goal(goal_id: int, data: LifeGoalCopy, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = LifeGoalService(db)
    return await svc.copy_to_user(goal_id, current_user.id, data.target_user_id)
