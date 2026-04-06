from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.nutrition_repository import NutritionRepository
from app.schemas.nutrition import (
    MealPlanOut, MealPlanUpsert,
    ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemOut, ShoppingListOut,
)


def _meal_out(row) -> MealPlanOut:
    return MealPlanOut(
        id=row.id,
        date=str(row.date),
        meal_type=row.meal_type,
        adults_text=row.adults_text,
        children_text=row.children_text,
    )


def _list_out(version) -> ShoppingListOut:
    return ShoppingListOut(
        version_id=version.id,
        items=[
            ShoppingItemOut(id=i.id, text=i.text, checked=i.checked, position=i.position)
            for i in sorted(version.items, key=lambda x: x.position)
        ],
    )


class NutritionService:
    def __init__(self, db: AsyncSession):
        self.repo = NutritionRepository(db)

    async def get_meal_plan(self, date: str) -> list[MealPlanOut]:
        rows = await self.repo.get_meal_plan(date)
        return [_meal_out(r) for r in rows]

    async def upsert_meal_plan(self, data: MealPlanUpsert) -> MealPlanOut:
        row = await self.repo.upsert_meal_plan(
            data.date, data.meal_type, data.adults_text, data.children_text
        )
        return _meal_out(row)

    async def get_shopping_list(self) -> ShoppingListOut:
        version = await self.repo.get_or_create_current_version()
        return _list_out(version)

    async def add_item(self, data: ShoppingItemCreate) -> ShoppingItemOut:
        version = await self.repo.get_or_create_current_version()
        item = await self.repo.add_item(version.id, data.text)
        return ShoppingItemOut(id=item.id, text=item.text, checked=item.checked, position=item.position)

    async def update_item(self, item_id: int, data: ShoppingItemUpdate) -> ShoppingItemOut | None:
        item = await self.repo.update_item(item_id, data.text, data.checked)
        if item is None:
            return None
        return ShoppingItemOut(id=item.id, text=item.text, checked=item.checked, position=item.position)

    async def delete_item(self, item_id: int) -> bool:
        return await self.repo.delete_item(item_id)

    async def clear_list(self) -> ShoppingListOut:
        version = await self.repo.get_or_create_current_version()
        await self.repo.clear_items(version.id)
        version = await self.repo.get_or_create_current_version()
        return _list_out(version)

    async def new_version(self) -> ShoppingListOut:
        version = await self.repo.new_version()
        return _list_out(version)
