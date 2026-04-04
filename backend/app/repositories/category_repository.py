from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Category
from app.schemas.tasks import CategoryCreate, CategoryUpdate
from typing import Optional, List


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Category]:
        result = await self.db.execute(select(Category).order_by(Category.name))
        return result.scalars().all()

    async def get_by_id(self, cat_id: int) -> Optional[Category]:
        result = await self.db.execute(select(Category).where(Category.id == cat_id))
        return result.scalar_one_or_none()

    async def create(self, data: CategoryCreate) -> Category:
        cat = Category(**data.model_dump())
        self.db.add(cat)
        await self.db.flush()
        return cat

    async def update(self, cat: Category, data: CategoryUpdate) -> Category:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(cat, field, value)
        await self.db.flush()
        return cat

    async def delete(self, cat: Category) -> None:
        await self.db.delete(cat)
        await self.db.flush()
