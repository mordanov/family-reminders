from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.repositories.life_goal_repository import LifeGoalRepository
from app.schemas.activities import LifeGoalCreate, LifeGoalUpdate, LifeGoalOut, LifeGoalCopy
from app.models.models import LifeGoal
from typing import List


def _serialize(goal: LifeGoal) -> LifeGoalOut:
    activity_ids = [link.activity_id for link in goal.activity_links]
    total = len(goal.activity_links)
    completed = sum(1 for link in goal.activity_links if link.activity and link.activity.completed)
    progress = (completed / total * 100) if total > 0 else 0.0
    return LifeGoalOut(
        id=goal.id,
        owner_id=goal.owner_id,
        description=goal.description,
        created_at=goal.created_at,
        progress=round(progress, 1),
        activity_count=total,
        activity_ids=activity_ids,
    )


class LifeGoalService:
    def __init__(self, db: AsyncSession):
        self.repo = LifeGoalRepository(db)

    async def get_for_user(self, user_id: int) -> List[LifeGoalOut]:
        goals = await self.repo.get_for_user(user_id)
        return [_serialize(g) for g in goals]

    async def create(self, user_id: int, data: LifeGoalCreate) -> LifeGoalOut:
        goal = await self.repo.create(user_id, data)
        return _serialize(goal)

    async def update(self, goal_id: int, user_id: int, data: LifeGoalUpdate) -> LifeGoalOut:
        goal = await self.repo.get_by_id(goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        if goal.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        updated = await self.repo.update(goal, data)
        return _serialize(updated)

    async def delete(self, goal_id: int, user_id: int) -> None:
        goal = await self.repo.get_by_id(goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        if goal.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        await self.repo.delete(goal)

    async def copy_to_user(self, goal_id: int, user_id: int, target_user_id: int) -> LifeGoalOut:
        goal = await self.repo.get_by_id(goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        if goal.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        new_goal = await self.repo.copy_to_user(goal, target_user_id)
        return _serialize(new_goal)
