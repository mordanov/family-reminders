from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.security import get_current_user
from app.models.models import User
from app.schemas.payments import PaymentCreate, PaymentOut, PaymentUpdate
from app.services.payments_service import PaymentsService

router = APIRouter()


@router.get("", response_model=list[PaymentOut])
async def get_payments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await PaymentsService(db).get_all()


@router.post("", response_model=PaymentOut, status_code=201)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await PaymentsService(db).create(data)


@router.put("/{payment_id}", response_model=PaymentOut)
async def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await PaymentsService(db).update(payment_id, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    deleted = await PaymentsService(db).delete(payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
