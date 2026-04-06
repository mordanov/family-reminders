from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import MealPlan, ShoppingListVersion, ShoppingListItem


class NutritionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Meal plan ──────────────────────────────────────────────────────────

    async def get_meal_plan(self, date: str) -> list[MealPlan]:
        result = await self.db.execute(
            select(MealPlan).where(MealPlan.date == date)
        )
        return result.scalars().all()

    async def upsert_meal_plan(
        self, date: str, meal_type: str, adults_text: str, children_text: str
    ) -> MealPlan:
        result = await self.db.execute(
            select(MealPlan).where(MealPlan.date == date, MealPlan.meal_type == meal_type)
        )
        row = result.scalar_one_or_none()
        if row is None:
            row = MealPlan(
                date=date, meal_type=meal_type,
                adults_text=adults_text, children_text=children_text,
            )
            self.db.add(row)
        else:
            row.adults_text = adults_text
            row.children_text = children_text
        await self.db.flush()
        return row

    # ── Shopping list ──────────────────────────────────────────────────────

    async def get_or_create_current_version(self) -> ShoppingListVersion:
        result = await self.db.execute(
            select(ShoppingListVersion)
            .where(ShoppingListVersion.is_current == True)
            .options(selectinload(ShoppingListVersion.items))
        )
        version = result.scalar_one_or_none()
        if version is None:
            version = ShoppingListVersion(is_current=True)
            self.db.add(version)
            await self.db.flush()
            # reload with items relationship
            result = await self.db.execute(
                select(ShoppingListVersion)
                .where(ShoppingListVersion.id == version.id)
                .options(selectinload(ShoppingListVersion.items))
            )
            version = result.scalar_one()
        return version

    async def add_item(self, version_id: int, text: str) -> ShoppingListItem:
        result = await self.db.execute(
            select(ShoppingListItem.position)
            .where(ShoppingListItem.version_id == version_id)
            .order_by(ShoppingListItem.position.desc())
            .limit(1)
        )
        max_pos = result.scalar_one_or_none()
        position = (max_pos + 1) if max_pos is not None else 0
        item = ShoppingListItem(version_id=version_id, text=text, position=position)
        self.db.add(item)
        await self.db.flush()
        return item

    async def update_item(self, item_id: int, text: str | None, checked: bool | None) -> ShoppingListItem | None:
        result = await self.db.execute(
            select(ShoppingListItem).where(ShoppingListItem.id == item_id)
        )
        item = result.scalar_one_or_none()
        if item is None:
            return None
        if text is not None:
            item.text = text
        if checked is not None:
            item.checked = checked
        await self.db.flush()
        return item

    async def delete_item(self, item_id: int) -> bool:
        result = await self.db.execute(
            select(ShoppingListItem).where(ShoppingListItem.id == item_id)
        )
        item = result.scalar_one_or_none()
        if item is None:
            return False
        await self.db.delete(item)
        await self.db.flush()
        return True

    async def clear_items(self, version_id: int) -> None:
        await self.db.execute(
            delete(ShoppingListItem).where(ShoppingListItem.version_id == version_id)
        )
        await self.db.flush()

    async def new_version(self) -> ShoppingListVersion:
        await self.db.execute(
            update(ShoppingListVersion)
            .where(ShoppingListVersion.is_current == True)
            .values(is_current=False)
        )
        version = ShoppingListVersion(is_current=True)
        self.db.add(version)
        await self.db.flush()
        result = await self.db.execute(
            select(ShoppingListVersion)
            .where(ShoppingListVersion.id == version.id)
            .options(selectinload(ShoppingListVersion.items))
        )
        return result.scalar_one()
