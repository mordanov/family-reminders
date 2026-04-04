from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ActivityCreate(BaseModel):
    description: str
    category_id: Optional[int] = None
    color: str = "#6366f1"
    priority: int = 5
    assigned_user_ids: List[int] = []


class ActivityUpdate(BaseModel):
    description: Optional[str] = None
    category_id: Optional[int] = None
    color: Optional[str] = None
    priority: Optional[int] = None
    completed: Optional[bool] = None
    assigned_user_ids: Optional[List[int]] = None


class ActivityOut(BaseModel):
    id: int
    created_at: datetime
    creator_id: int
    description: str
    category_id: Optional[int] = None
    color: str
    completed: bool
    priority: int
    assigned_user_ids: List[int] = []

    class Config:
        from_attributes = True


class LifeGoalCreate(BaseModel):
    description: str
    activity_ids: List[int] = []


class LifeGoalUpdate(BaseModel):
    description: Optional[str] = None
    activity_ids: Optional[List[int]] = None


class LifeGoalOut(BaseModel):
    id: int
    owner_id: int
    description: str
    created_at: datetime
    progress: float = 0.0
    activity_count: int = 0
    activity_ids: List[int] = []

    class Config:
        from_attributes = True


class LifeGoalCopy(BaseModel):
    target_user_id: int
