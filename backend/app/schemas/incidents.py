from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from typing import Optional


class IncidentBase(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    description: str
    actions_taken: str
    importance: int = Field(default=3, ge=1, le=5)

    @model_validator(mode="after")
    def validate_range(self):
        if self.end_datetime < self.start_datetime:
            raise ValueError("end_datetime must be greater than or equal to start_datetime")
        return self


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    description: Optional[str] = None
    actions_taken: Optional[str] = None
    importance: Optional[int] = Field(default=None, ge=1, le=5)


class IncidentOut(BaseModel):
    id: int
    created_at: datetime
    creator_id: int
    start_datetime: datetime
    end_datetime: datetime
    description: str
    actions_taken: str
    importance: int

    class Config:
        from_attributes = True

