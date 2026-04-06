from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.payments_repository import PaymentsRepository
from app.schemas.payments import PaymentCreate, PaymentOut, PaymentUpdate


def _out(row) -> PaymentOut:
    return PaymentOut(
        id=row.id,
        paid_at=row.paid_at.isoformat(),
        description=row.description,
        currency=row.currency,
        amount=float(row.amount),
        lessons_count=row.lessons_count,
        lessons_per_week=float(row.lessons_per_week),
    )


class PaymentsService:
    def __init__(self, db: AsyncSession):
        self.repo = PaymentsRepository(db)

    async def get_all(self) -> list[PaymentOut]:
        return [_out(r) for r in await self.repo.get_all()]

    async def create(self, data: PaymentCreate) -> PaymentOut:
        return _out(await self.repo.create(data))

    async def update(self, payment_id: int, data: PaymentUpdate) -> PaymentOut | None:
        row = await self.repo.update(payment_id, data)
        return _out(row) if row else None

    async def delete(self, payment_id: int) -> bool:
        return await self.repo.delete(payment_id)
