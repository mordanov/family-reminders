from datetime import date as date_type
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import MedicationPeriod, MedicationIntake, MedicationItem, MedicationLog
from app.schemas.medications import MedicationPeriodCreate


class MedicationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_period(self, user_id: int, data: MedicationPeriodCreate) -> MedicationPeriod:
        period = MedicationPeriod(
            user_id=user_id,
            name=data.name,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        self.db.add(period)
        await self.db.flush()

        for intake_data in data.intakes:
            intake = MedicationIntake(
                period_id=period.id,
                name=intake_data.name,
                order_index=intake_data.order_index,
            )
            self.db.add(intake)
            await self.db.flush()

            for item_data in intake_data.items:
                item = MedicationItem(
                    intake_id=intake.id,
                    name=item_data.name,
                    pill_count=item_data.pill_count,
                )
                self.db.add(item)

        await self.db.flush()
        return await self._get_period_with_intakes(period.id)

    async def get_user_periods(self, user_id: int) -> List[MedicationPeriod]:
        result = await self.db.execute(
            select(MedicationPeriod)
            .where(MedicationPeriod.user_id == user_id)
            .options(
                selectinload(MedicationPeriod.intakes).selectinload(MedicationIntake.items)
            )
            .order_by(MedicationPeriod.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_period_detail(self, period_id: int) -> Optional[MedicationPeriod]:
        result = await self.db.execute(
            select(MedicationPeriod)
            .where(MedicationPeriod.id == period_id)
            .options(
                selectinload(MedicationPeriod.intakes).selectinload(MedicationIntake.items),
                selectinload(MedicationPeriod.intakes).selectinload(MedicationIntake.logs),
            )
        )
        return result.scalar_one_or_none()

    async def get_period_by_intake(self, intake_id: int, user_id: int) -> Optional[MedicationPeriod]:
        """Return the period owning this intake, checking user ownership."""
        result = await self.db.execute(
            select(MedicationPeriod)
            .join(MedicationIntake, MedicationIntake.period_id == MedicationPeriod.id)
            .where(MedicationIntake.id == intake_id, MedicationPeriod.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def delete_period(self, period: MedicationPeriod) -> None:
        await self.db.delete(period)
        await self.db.flush()

    async def upsert_log(
        self, user_id: int, intake_id: int, log_date: date_type, taken: bool
    ) -> MedicationLog:
        stmt = (
            pg_insert(MedicationLog)
            .values(user_id=user_id, intake_id=intake_id, date=log_date, taken=taken)
            .on_conflict_do_update(
                constraint="uq_medication_log_intake_date",
                set_={"taken": taken, "user_id": user_id},
            )
            .returning(MedicationLog)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.scalar_one()

    async def get_suggestions(self, q: str) -> List[str]:
        result = await self.db.execute(
            select(MedicationItem.name)
            .where(MedicationItem.name.ilike(f"%{q}%"))
            .distinct()
            .order_by(MedicationItem.name)
            .limit(10)
        )
        return list(result.scalars().all())

    async def _get_period_with_intakes(self, period_id: int) -> MedicationPeriod:
        result = await self.db.execute(
            select(MedicationPeriod)
            .where(MedicationPeriod.id == period_id)
            .options(
                selectinload(MedicationPeriod.intakes).selectinload(MedicationIntake.items)
            )
        )
        return result.scalar_one()
