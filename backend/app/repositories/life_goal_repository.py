from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.models import LifeGoal, LifeGoalActivity, Activity
from app.schemas.activities import LifeGoalCreate, LifeGoalUpdate
from typing import Optional, List


class LifeGoalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _q(self):
        return select(LifeGoal).options(
            selectinload(LifeGoal.activity_links).selectinload(LifeGoalActivity.activity)
        )

    async def get_by_id(self, goal_id: int) -> Optional[LifeGoal]:
        result = await self.db.execute(self._q().where(LifeGoal.id == goal_id))
        return result.scalar_one_or_none()

    async def get_for_user(self, user_id: int) -> List[LifeGoal]:
        result = await self.db.execute(
            self._q().where(LifeGoal.owner_id == user_id).order_by(LifeGoal.created_at.desc())
        )
        return result.scalars().unique().all()

    async def create(self, user_id: int, data: LifeGoalCreate) -> LifeGoal:
        goal = LifeGoal(owner_id=user_id, description=data.description)
        self.db.add(goal)
        await self.db.flush()
        await self._set_activities(goal.id, user_id, data.activity_ids)
        return await self.get_by_id(goal.id)

    async def _set_activities(self, goal_id: int, owner_id: int, activity_ids: List[int]) -> None:
        result = await self.db.execute(
            select(LifeGoalActivity).where(LifeGoalActivity.goal_id == goal_id)
        )
        for existing in result.scalars().all():
            await self.db.delete(existing)
        await self.db.flush()

        for act_id in activity_ids:
            # Validate activity belongs to user
            act_result = await self.db.execute(
                select(Activity).where(Activity.id == act_id)
            )
            act = act_result.scalar_one_or_none()
            if act:
                self.db.add(LifeGoalActivity(goal_id=goal_id, activity_id=act_id))
        await self.db.flush()

    async def update(self, goal: LifeGoal, data: LifeGoalUpdate) -> LifeGoal:
        if data.description is not None:
            goal.description = data.description
        if data.activity_ids is not None:
            await self._set_activities(goal.id, goal.owner_id, data.activity_ids)
        await self.db.flush()
        return await self.get_by_id(goal.id)

    async def delete(self, goal: LifeGoal) -> None:
        await self.db.delete(goal)
        await self.db.flush()

    async def copy_to_user(self, goal: LifeGoal, target_user_id: int) -> LifeGoal:
        new_goal = LifeGoal(owner_id=target_user_id, description=goal.description)
        self.db.add(new_goal)
        await self.db.flush()
        # Copy activity links (only if target user has access)
        for link in goal.activity_links:
            self.db.add(LifeGoalActivity(goal_id=new_goal.id, activity_id=link.activity_id))
        await self.db.flush()
        return await self.get_by_id(new_goal.id)
