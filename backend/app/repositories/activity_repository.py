from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.models.models import Activity, ActivityUser, User
from app.schemas.activities import ActivityCreate, ActivityUpdate
from typing import Optional, List


class ActivityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _q(self):
        return select(Activity).options(
            selectinload(Activity.assigned_users),
            selectinload(Activity.category),
        )

    async def get_by_id(self, act_id: int) -> Optional[Activity]:
        result = await self.db.execute(self._q().where(Activity.id == act_id))
        return result.scalar_one_or_none()

    async def get_visible_for_user(self, user_id: int) -> List[Activity]:
        result = await self.db.execute(
            self._q().where(
                or_(
                    Activity.creator_id == user_id,
                    Activity.id.in_(
                        select(ActivityUser.activity_id).where(ActivityUser.user_id == user_id)
                    )
                )
            ).order_by(
                Activity.completed.asc(),
                Activity.priority.desc(),
                Activity.created_at.asc(),
            )
        )
        return result.scalars().unique().all()

    async def create(self, user_id: int, data: ActivityCreate) -> Activity:
        act = Activity(
            creator_id=user_id,
            description=data.description,
            category_id=data.category_id,
            color=data.color,
            priority=data.priority,
        )
        self.db.add(act)
        await self.db.flush()
        await self._set_assigned_users(act.id, data.assigned_user_ids)
        return await self.get_by_id(act.id)

    async def _set_assigned_users(self, activity_id: int, user_ids: List[int]) -> None:
        result = await self.db.execute(
            select(ActivityUser).where(ActivityUser.activity_id == activity_id)
        )
        existing = result.scalars().all()
        for eu in existing:
            await self.db.delete(eu)
        await self.db.flush()
        for uid in user_ids:
            self.db.add(ActivityUser(activity_id=activity_id, user_id=uid))
        await self.db.flush()

    async def update(self, act: Activity, data: ActivityUpdate) -> Activity:
        for field, value in data.model_dump(exclude_unset=True, exclude={"assigned_user_ids"}).items():
            setattr(act, field, value)
        if data.assigned_user_ids is not None:
            await self._set_assigned_users(act.id, data.assigned_user_ids)
        await self.db.flush()
        return await self.get_by_id(act.id)

    async def delete(self, act: Activity) -> None:
        await self.db.delete(act)
        await self.db.flush()
