from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.category_repository import CategoryRepository
from app.schemas.tasks import CategoryCreate, CategoryUpdate, CategoryOut
from app.auth.security import get_current_user
from app.models.models import User
from fastapi import HTTPException
from typing import List

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    repo = CategoryRepository(db)
    return await repo.get_all()


@router.post("", response_model=CategoryOut)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    repo = CategoryRepository(db)
    return await repo.create(data)


@router.put("/{cat_id}", response_model=CategoryOut)
async def update_category(cat_id: int, data: CategoryUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    repo = CategoryRepository(db)
    cat = await repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return await repo.update(cat, data)


@router.delete("/{cat_id}")
async def delete_category(cat_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    repo = CategoryRepository(db)
    cat = await repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await repo.delete(cat)
    return {"ok": True}
