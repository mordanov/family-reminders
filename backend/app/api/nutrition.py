from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.security import get_current_user
from app.models.models import User
from app.schemas.nutrition import (
    MealPlanOut, MealPlanUpsert,
    ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemOut, ShoppingListOut,
)
from app.services.nutrition_service import NutritionService

router = APIRouter()


@router.get("/meal-plan", response_model=list[MealPlanOut])
async def get_meal_plan(
    date: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await NutritionService(db).get_meal_plan(date)


@router.put("/meal-plan", response_model=MealPlanOut)
async def upsert_meal_plan(
    data: MealPlanUpsert,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await NutritionService(db).upsert_meal_plan(data)


@router.get("/shopping-list", response_model=ShoppingListOut)
async def get_shopping_list(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await NutritionService(db).get_shopping_list()


@router.post("/shopping-list/items", response_model=ShoppingItemOut, status_code=201)
async def add_shopping_item(
    data: ShoppingItemCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await NutritionService(db).add_item(data)


@router.put("/shopping-list/items/{item_id}", response_model=ShoppingItemOut)
async def update_shopping_item(
    item_id: int,
    data: ShoppingItemUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    item = await NutritionService(db).update_item(item_id, data)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/shopping-list/items/{item_id}", status_code=204)
async def delete_shopping_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    deleted = await NutritionService(db).delete_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")


@router.post("/shopping-list/clear", response_model=ShoppingListOut)
async def clear_shopping_list(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await NutritionService(db).clear_list()


@router.post("/shopping-list/new-version", response_model=ShoppingListOut)
async def new_shopping_list_version(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await NutritionService(db).new_version()
