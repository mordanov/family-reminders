from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Incident
from app.schemas.incidents import IncidentCreate, IncidentUpdate


class IncidentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: int) -> List[Incident]:
        result = await self.db.execute(
            select(Incident)
            .where(Incident.creator_id == user_id)
            .order_by(Incident.start_datetime.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, incident_id: int) -> Optional[Incident]:
        result = await self.db.execute(select(Incident).where(Incident.id == incident_id))
        return result.scalar_one_or_none()

    async def create(self, user_id: int, data: IncidentCreate) -> Incident:
        incident = Incident(creator_id=user_id, **data.model_dump())
        self.db.add(incident)
        await self.db.flush()
        return incident

    async def update(self, incident: Incident, data: IncidentUpdate) -> Incident:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(incident, field, value)
        await self.db.flush()
        return incident

    async def delete(self, incident: Incident) -> None:
        await self.db.delete(incident)
        await self.db.flush()

