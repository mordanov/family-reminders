from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.models.models import Task, RecurringRule, Category
from app.schemas.tasks import TaskCreate, TaskUpdate, RecurringRuleCreate
from typing import Optional, List
from datetime import datetime, timezone, timedelta


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _task_query(self):
        return select(Task).options(
            selectinload(Task.category),
            selectinload(Task.recurring_rule),
        )

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        result = await self.db.execute(
            self._task_query().where(Task.id == task_id, Task.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_today_for_user(self, user_id: int, date: datetime) -> List[Task]:
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        result = await self.db.execute(
            self._task_query().where(
                Task.creator_id == user_id,
                Task.is_deleted == False,
                Task.start_datetime >= day_start,
                Task.start_datetime <= day_end,
            ).order_by(Task.start_datetime)
        )
        return result.scalars().all()

    async def get_range_for_user(self, user_id: int, start: datetime, end: datetime) -> List[Task]:
        result = await self.db.execute(
            self._task_query().where(
                Task.creator_id == user_id,
                Task.is_deleted == False,
                Task.start_datetime >= start,
                Task.start_datetime <= end,
            ).order_by(Task.start_datetime)
        )
        return result.scalars().all()

    async def get_reminders_now(self, user_id: int, now: datetime) -> List[Task]:
        day_end = now.replace(hour=23, minute=59, second=59)
        result = await self.db.execute(
            self._task_query().where(
                Task.creator_id == user_id,
                Task.is_deleted == False,
                Task.remind_at_start == True,
                Task.start_datetime > now,
                Task.start_datetime <= day_end,
            ).order_by(Task.start_datetime)
        )
        return result.scalars().all()

    async def create(self, user_id: int, data: TaskCreate) -> Task:
        rule_id = None
        if data.is_recurring and data.recurring_rule:
            rule = RecurringRule(
                frequency=data.recurring_rule.frequency,
                interval=data.recurring_rule.interval,
                days_of_week=data.recurring_rule.days_of_week,
                end_date=data.recurring_rule.end_date,
            )
            self.db.add(rule)
            await self.db.flush()
            rule_id = rule.id

        task = Task(
            creator_id=user_id,
            start_datetime=data.start_datetime,
            end_datetime=data.end_datetime,
            remind_at_start=data.remind_at_start,
            description=data.description,
            category_id=data.category_id,
            color=data.color,
            is_recurring=data.is_recurring,
            recurring_rule_id=rule_id,
        )
        self.db.add(task)
        await self.db.flush()
        return await self.get_by_id(task.id)

    async def update(self, task: Task, data: TaskUpdate) -> Task:
        for field, value in data.model_dump(exclude_unset=True, exclude={"recurring_rule"}).items():
            setattr(task, field, value)

        if data.recurring_rule is not None and task.is_recurring:
            if task.recurring_rule_id:
                result = await self.db.execute(
                    select(RecurringRule).where(RecurringRule.id == task.recurring_rule_id)
                )
                rule = result.scalar_one_or_none()
                if rule:
                    rule.frequency = data.recurring_rule.frequency
                    rule.interval = data.recurring_rule.interval
                    rule.days_of_week = data.recurring_rule.days_of_week
                    rule.end_date = data.recurring_rule.end_date
            else:
                rule = RecurringRule(**data.recurring_rule.model_dump())
                self.db.add(rule)
                await self.db.flush()
                task.recurring_rule_id = rule.id

        await self.db.flush()
        return await self.get_by_id(task.id)

    async def delete(self, task: Task) -> None:
        task.is_deleted = True
        await self.db.flush()

    async def delete_future_occurrences(self, original_task_id: int, from_datetime: datetime) -> None:
        result = await self.db.execute(
            select(Task).where(
                Task.original_task_id == original_task_id,
                Task.start_datetime >= from_datetime,
                Task.is_deleted == False,
            )
        )
        tasks = result.scalars().all()
        for t in tasks:
            t.is_deleted = True
        await self.db.flush()

    async def get_archive_for_user(
        self,
        user_id: int,
        start_dt: datetime,
        end_dt: datetime,
        category_id: Optional[int] = None,
    ) -> List[Task]:
        q = self._task_query().where(
            Task.creator_id == user_id,
            Task.is_deleted == False,
            Task.start_datetime >= start_dt,
            Task.start_datetime <= end_dt,
        )
        if category_id is not None:
            q = q.where(Task.category_id == category_id)
        result = await self.db.execute(q.order_by(Task.start_datetime.desc()))
        return result.scalars().all()

    async def get_future_recurring(self, original_task_id: int, from_datetime: datetime) -> List[Task]:
        result = await self.db.execute(
            self._task_query().where(
                Task.original_task_id == original_task_id,
                Task.start_datetime >= from_datetime,
                Task.is_deleted == False,
            )
        )
        return result.scalars().all()
