from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.task_service import TaskService
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskOut
from app.auth.security import get_current_user
from app.models.models import User
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/today", response_model=List[TaskOut])
async def today_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tz = "UTC"
    if current_user.settings:
        tz = current_user.settings.timezone
    svc = TaskService(db)
    return await svc.get_today(current_user.id, tz)


@router.get("/week", response_model=List[TaskOut])
async def week_tasks(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = TaskService(db)
    return await svc.get_week(current_user.id, start, end)


@router.get("/reminders", response_model=List[TaskOut])
async def reminders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tz = "UTC"
    if current_user.settings:
        tz = current_user.settings.timezone
    svc = TaskService(db)
    return await svc.get_reminders(current_user.id, tz)


@router.post("", response_model=TaskOut)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = TaskService(db)
    return await svc.create(current_user.id, data)


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    scope: str = Query("this"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = TaskService(db)
    return await svc.update(task_id, current_user.id, data, scope)


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    scope: str = Query("this"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = TaskService(db)
    await svc.delete(task_id, current_user.id, scope)
    return {"ok": True}
