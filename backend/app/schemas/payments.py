from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class PaymentCreate(BaseModel):
    paid_at: str
    description: str
    currency: str
    amount: float
    lessons_count: int
    lessons_per_week: float


class PaymentUpdate(BaseModel):
    paid_at: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None
    amount: Optional[float] = None
    lessons_count: Optional[int] = None
    lessons_per_week: Optional[float] = None


class PaymentOut(BaseModel):
    id: int
    paid_at: str
    description: str
    currency: str
    amount: float
    lessons_count: int
    lessons_per_week: float

    model_config = {"from_attributes": True}
