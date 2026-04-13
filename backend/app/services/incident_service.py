from typing import List

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.incident_repository import IncidentRepository
from app.schemas.incidents import IncidentCreate, IncidentOut, IncidentUpdate


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.repo = IncidentRepository(db)

    async def list_for_user(self, user_id: int) -> List[IncidentOut]:
        incidents = await self.repo.list_for_user(user_id)
        return [IncidentOut.model_validate(i) for i in incidents]

    async def create(self, user_id: int, data: IncidentCreate) -> IncidentOut:
        incident = await self.repo.create(user_id, data)
        return IncidentOut.model_validate(incident)

    async def update(self, incident_id: int, user_id: int, data: IncidentUpdate) -> IncidentOut:
        incident = await self.repo.get_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        if incident.creator_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        # Validate updated date range before persisting changes.
        start = data.start_datetime or incident.start_datetime
        end = data.end_datetime or incident.end_datetime
        if end < start:
            raise HTTPException(status_code=400, detail="end_datetime must be >= start_datetime")

        updated = await self.repo.update(incident, data)

        return IncidentOut.model_validate(updated)

    async def delete(self, incident_id: int, user_id: int) -> None:
        incident = await self.repo.get_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        if incident.creator_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        await self.repo.delete(incident)


