from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.models import RecurrenceFrequency


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    emoji: str = "📌"


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    emoji: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    emoji: str

    class Config:
        from_attributes = True


class RecurringRuleCreate(BaseModel):
    frequency: RecurrenceFrequency
    interval: int = 1
    days_of_week: Optional[str] = None
    end_date: Optional[datetime] = None


class RecurringRuleOut(BaseModel):
    id: int
    frequency: RecurrenceFrequency
    interval: int
    days_of_week: Optional[str] = None
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    remind_at_start: bool = False
    description: str
    category_id: Optional[int] = None
    color: str = "#6366f1"
    is_recurring: bool = False
    recurring_rule: Optional[RecurringRuleCreate] = None


class TaskUpdate(BaseModel):
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    remind_at_start: Optional[bool] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    color: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurring_rule: Optional[RecurringRuleCreate] = None


class TaskOut(BaseModel):
    id: int
    created_at: datetime
    start_datetime: datetime
    end_datetime: datetime
    remind_at_start: bool
    creator_id: int
    description: str
    category_id: Optional[int] = None
    category: Optional[CategoryOut] = None
    color: str
    is_recurring: bool
    recurring_rule_id: Optional[int] = None
    recurring_rule: Optional[RecurringRuleOut] = None
    original_task_id: Optional[int] = None

    class Config:
        from_attributes = True


class RecurringEditScope(BaseModel):
    scope: str  # "this" | "future"
