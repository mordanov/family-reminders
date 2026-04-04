from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activities import ActivityCreate, ActivityUpdate, ActivityOut
from app.models.models import Activity
from typing import List


def _serialize(act: Activity) -> ActivityOut:
    return ActivityOut(
        id=act.id,
        created_at=act.created_at,
        creator_id=act.creator_id,
        description=act.description,
        category_id=act.category_id,
        color=act.color,
        completed=act.completed,
        priority=act.priority,
        assigned_user_ids=[u.id for u in act.assigned_users],
    )


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.repo = ActivityRepository(db)

    async def get_for_user(self, user_id: int) -> List[ActivityOut]:
        acts = await self.repo.get_visible_for_user(user_id)
        return [_serialize(a) for a in acts]

    async def create(self, user_id: int, data: ActivityCreate) -> ActivityOut:
        act = await self.repo.create(user_id, data)
        return _serialize(act)

    async def update(self, act_id: int, user_id: int, data: ActivityUpdate) -> ActivityOut:
        act = await self.repo.get_by_id(act_id)
        if not act:
            raise HTTPException(status_code=404, detail="Activity not found")
        if act.creator_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        updated = await self.repo.update(act, data)
        return _serialize(updated)

    async def get_completed(self, user_id: int, category_id=None) -> List[ActivityOut]:
        acts = await self.repo.get_completed_for_user(user_id, category_id)
        return [_serialize(a) for a in acts]

    async def delete(self, act_id: int, user_id: int) -> None:
        act = await self.repo.get_by_id(act_id)
        if not act:
            raise HTTPException(status_code=404, detail="Activity not found")
        if act.creator_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        await self.repo.delete(act)
