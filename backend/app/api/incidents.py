from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import get_current_user
from app.core.database import get_db
from app.models.models import User
from app.schemas.incidents import IncidentCreate, IncidentOut, IncidentUpdate
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=List[IncidentOut])
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = IncidentService(db)
    return await svc.list_for_user(current_user.id)


@router.post("", response_model=IncidentOut)
async def create_incident(
    data: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = IncidentService(db)
    return await svc.create(current_user.id, data)


@router.put("/{incident_id}", response_model=IncidentOut)
async def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = IncidentService(db)
    return await svc.update(incident_id, current_user.id, data)


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = IncidentService(db)
    await svc.delete(incident_id, current_user.id)
    return {"ok": True}

