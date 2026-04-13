from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import get_current_user
from app.core.database import get_db
from app.models.models import User
from app.schemas.medications import (
    MedicationLogOut,
    MedicationLogRequest,
    MedicationPeriodCreate,
    MedicationPeriodDetailOut,
    MedicationPeriodOut,
)
from app.services.medication_service import MedicationService

router = APIRouter(prefix="/medications", tags=["medications"])


@router.get("/periods", response_model=List[MedicationPeriodOut])
async def list_periods(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    return await svc.list_periods(current_user.id)


@router.post("/periods", response_model=MedicationPeriodOut, status_code=201)
async def create_period(
    data: MedicationPeriodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    return await svc.create_period(current_user.id, data)


@router.get("/periods/{period_id}", response_model=MedicationPeriodDetailOut)
async def get_period(
    period_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    return await svc.get_period_detail(period_id, current_user.id)


@router.post("/periods/{period_id}/copy", response_model=MedicationPeriodOut, status_code=201)
async def copy_period(
    period_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    return await svc.copy_period(period_id, current_user.id)


@router.delete("/periods/{period_id}")
async def delete_period(
    period_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    await svc.delete_period(period_id, current_user.id)
    return {"ok": True}


@router.post("/log", response_model=MedicationLogOut)
async def upsert_log(
    data: MedicationLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    return await svc.upsert_log(current_user.id, data)


@router.get("/suggestions", response_model=List[str])
async def get_suggestions(
    q: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MedicationService(db)
    return await svc.get_suggestions(q)
