from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import RegularPayment
from app.schemas.payments import PaymentCreate, PaymentUpdate


class PaymentsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[RegularPayment]:
        result = await self.db.execute(
            select(RegularPayment).order_by(RegularPayment.paid_at.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, payment_id: int) -> RegularPayment | None:
        result = await self.db.execute(
            select(RegularPayment).where(RegularPayment.id == payment_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: PaymentCreate) -> RegularPayment:
        paid_at = datetime.fromisoformat(data.paid_at)
        row = RegularPayment(
            paid_at=paid_at,
            description=data.description,
            currency=data.currency,
            amount=data.amount,
            lessons_count=data.lessons_count,
            lessons_per_week=data.lessons_per_week,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def update(self, payment_id: int, data: PaymentUpdate) -> RegularPayment | None:
        row = await self.get_by_id(payment_id)
        if row is None:
            return None
        patch = data.model_dump(exclude_unset=True)
        if 'paid_at' in patch:
            patch['paid_at'] = datetime.fromisoformat(patch['paid_at'])
        for key, value in patch.items():
            setattr(row, key, value)
        await self.db.flush()
        return row

    async def delete(self, payment_id: int) -> bool:
        row = await self.get_by_id(payment_id)
        if row is None:
            return False
        await self.db.delete(row)
        await self.db.flush()
        return True
