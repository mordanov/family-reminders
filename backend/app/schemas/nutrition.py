from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel


class MealPlanUpsert(BaseModel):
    date: str          # YYYY-MM-DD
    meal_type: str     # breakfast | lunch | dinner
    adults_text: str = ''
    children_text: str = ''


class MealPlanOut(BaseModel):
    id: int
    date: str
    meal_type: str
    adults_text: str
    children_text: str

    model_config = {"from_attributes": True}


class ShoppingItemCreate(BaseModel):
    text: str


class ShoppingItemUpdate(BaseModel):
    text: Optional[str] = None
    checked: Optional[bool] = None


class ShoppingItemOut(BaseModel):
    id: int
    text: str
    checked: bool
    position: int

    model_config = {"from_attributes": True}


class ShoppingListOut(BaseModel):
    version_id: int
    items: List[ShoppingItemOut]
