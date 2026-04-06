from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.repositories.task_repository import TaskRepository
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskOut, RecurringEditScope
from app.models.models import Task, RecurringRule
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import pytz


def _serialize(task: Task) -> TaskOut:
    assigned = []
    return TaskOut(
        id=task.id,
        created_at=task.created_at,
        start_datetime=task.start_datetime,
        end_datetime=task.end_datetime,
        remind_at_start=task.remind_at_start,
        creator_id=task.creator_id,
        description=task.description,
        category_id=task.category_id,
        category=task.category,
        color=task.color,
        is_recurring=task.is_recurring,
        recurring_rule_id=task.recurring_rule_id,
        recurring_rule=task.recurring_rule,
        original_task_id=task.original_task_id,
    )


class TaskService:
    def __init__(self, db: AsyncSession):
        self.repo = TaskRepository(db)

    async def get_today(self, user_id: int, user_tz: str, target_date=None) -> List[TaskOut]:
        tz = pytz.timezone(user_tz)
        if target_date:
            local_dt = tz.localize(datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0))
        else:
            local_dt = datetime.now(tz)
        now_utc = local_dt.astimezone(pytz.utc)
        tasks = await self.repo.get_today_for_user(user_id, now_utc)
        return [_serialize(t) for t in tasks]

    async def get_week(self, user_id: int, start: datetime, end: datetime) -> List[TaskOut]:
        tasks = await self.repo.get_range_for_user(user_id, start, end)
        return [_serialize(t) for t in tasks]

    async def get_reminders(self, user_id: int, user_tz: str) -> List[TaskOut]:
        tz = pytz.timezone(user_tz)
        now_utc = datetime.now(timezone.utc)
        tasks = await self.repo.get_reminders_now(user_id, now_utc)
        return [_serialize(t) for t in tasks]

    async def create(self, user_id: int, data: TaskCreate) -> TaskOut:
        if data.is_recurring and data.recurring_rule and not data.recurring_rule.end_date:
            end = data.start_datetime + timedelta(days=365)
            data.recurring_rule.end_date = end
        task = await self.repo.create(user_id, data)
        return _serialize(task)

    async def update(self, task_id: int, user_id: int, data: TaskUpdate, scope: str = "this") -> TaskOut:
        task = await self.repo.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if task.creator_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        if task.is_recurring and scope == "future":
            # Delete this and all future occurrences, recreate
            ref_id = task.original_task_id or task.id
            await self.repo.delete_future_occurrences(ref_id, task.start_datetime)
            await self.repo.delete(task)
            # Create new task with updated data applied
            new_data = TaskCreate(
                start_datetime=data.start_datetime or task.start_datetime,
                end_datetime=data.end_datetime or task.end_datetime,
                remind_at_start=data.remind_at_start if data.remind_at_start is not None else task.remind_at_start,
                description=data.description or task.description,
                category_id=data.category_id if data.category_id is not None else task.category_id,
                color=data.color or task.color,
                is_recurring=task.is_recurring,
                recurring_rule=data.recurring_rule or (
                    TaskCreate.__fields__['recurring_rule'].default
                ),
            )
            new_task = await self.repo.create(user_id, new_data)
            return _serialize(new_task)

        updated = await self.repo.update(task, data)
        return _serialize(updated)

    async def get_archive(
        self,
        user_id: int,
        start_dt,
        end_dt,
        category_id=None,
    ) -> List[TaskOut]:
        tasks = await self.repo.get_archive_for_user(user_id, start_dt, end_dt, category_id)
        return [_serialize(t) for t in tasks]

    async def delete(self, task_id: int, user_id: int, scope: str = "this") -> None:
        task = await self.repo.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if task.creator_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        if task.is_recurring and scope == "future":
            ref_id = task.original_task_id or task.id
            await self.repo.delete_future_occurrences(ref_id, task.start_datetime)

        await self.repo.delete(task)
