from datetime import date
from typing import List

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import MedicationPeriod
from app.repositories.medication_repository import MedicationRepository
from app.schemas.medications import (
    MedicationIntakeCreate,
    MedicationIntakeOut,
    MedicationItemCreate,
    MedicationItemOut,
    MedicationLogOut,
    MedicationLogRequest,
    MedicationPeriodCreate,
    MedicationPeriodDetailOut,
    MedicationPeriodOut,
)


def _serialize_period(p: MedicationPeriod, include_logs: bool = False):
    today = date.today()
    intakes = [
        MedicationIntakeOut(
            id=intake.id,
            name=intake.name,
            order_index=intake.order_index,
            items=[
                MedicationItemOut(id=it.id, name=it.name, pill_count=it.pill_count)
                for it in intake.items
            ],
        )
        for intake in sorted(p.intakes, key=lambda i: i.order_index)
    ]
    data = dict(
        id=p.id,
        name=p.name,
        start_date=p.start_date,
        end_date=p.end_date,
        is_closed=p.end_date < today,
        intakes=intakes,
    )
    if include_logs:
        all_logs: List[MedicationLogOut] = []
        for intake in p.intakes:
            for log in intake.logs:
                all_logs.append(
                    MedicationLogOut(id=log.id, intake_id=log.intake_id, date=log.date, taken=log.taken)
                )
        data["logs"] = all_logs
        return MedicationPeriodDetailOut(**data)
    return MedicationPeriodOut(**data)


class MedicationService:
    def __init__(self, db: AsyncSession):
        self.repo = MedicationRepository(db)

    async def list_periods(self, user_id: int) -> List[MedicationPeriodOut]:
        periods = await self.repo.get_user_periods(user_id)
        return [_serialize_period(p) for p in periods]

    async def create_period(self, user_id: int, data: MedicationPeriodCreate) -> MedicationPeriodOut:
        if data.end_date < data.start_date:
            raise HTTPException(status_code=400, detail="end_date must be >= start_date")
        for intake in data.intakes:
            for item in intake.items:
                if not (1 <= item.pill_count <= 4):
                    raise HTTPException(status_code=400, detail="pill_count must be between 1 and 4")
        period = await self.repo.create_period(user_id, data)
        return _serialize_period(period)

    async def get_period_detail(self, period_id: int, user_id: int) -> MedicationPeriodDetailOut:
        period = await self.repo.get_period_detail(period_id)
        if not period:
            raise HTTPException(status_code=404, detail="Period not found")
        if period.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return _serialize_period(period, include_logs=True)

    async def delete_period(self, period_id: int, user_id: int) -> None:
        period = await self.repo.get_period_detail(period_id)
        if not period:
            raise HTTPException(status_code=404, detail="Period not found")
        if period.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        await self.repo.delete_period(period)

    async def copy_period(self, period_id: int, user_id: int) -> MedicationPeriodOut:
        period = await self.repo.get_period_detail(period_id)
        if not period:
            raise HTTPException(status_code=404, detail="Period not found")
        if period.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        payload = MedicationPeriodCreate(
            name=f"{period.name} копия",
            start_date=period.start_date,
            end_date=period.end_date,
            intakes=[
                MedicationIntakeCreate(
                    name=intake.name,
                    order_index=intake.order_index,
                    items=[
                        MedicationItemCreate(name=item.name, pill_count=item.pill_count)
                        for item in intake.items
                    ],
                )
                for intake in sorted(period.intakes, key=lambda i: i.order_index)
            ],
        )
        new_period = await self.repo.create_period(user_id, payload)
        return _serialize_period(new_period)

    async def upsert_log(self, user_id: int, data: MedicationLogRequest) -> MedicationLogOut:
        period = await self.repo.get_period_by_intake(data.intake_id, user_id)
        if not period:
            raise HTTPException(status_code=403, detail="Forbidden")
        if not (period.start_date <= data.date <= period.end_date):
            raise HTTPException(status_code=400, detail="Date is outside the period range")
        log = await self.repo.upsert_log(user_id, data.intake_id, data.date, data.taken)
        return MedicationLogOut(id=log.id, intake_id=log.intake_id, date=log.date, taken=log.taken)

    async def get_suggestions(self, q: str) -> List[str]:
        if not q:
            return []
        return await self.repo.get_suggestions(q)
