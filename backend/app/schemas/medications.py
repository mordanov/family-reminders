from datetime import date
from typing import List

from pydantic import BaseModel


class MedicationItemCreate(BaseModel):
    name: str
    pill_count: int


class MedicationIntakeCreate(BaseModel):
    name: str
    order_index: int = 0
    items: List[MedicationItemCreate] = []


class MedicationPeriodCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    intakes: List[MedicationIntakeCreate] = []


class MedicationItemOut(BaseModel):
    id: int
    name: str
    pill_count: int

    model_config = {"from_attributes": True}


class MedicationIntakeOut(BaseModel):
    id: int
    name: str
    order_index: int
    items: List[MedicationItemOut]

    model_config = {"from_attributes": True}


class MedicationLogOut(BaseModel):
    id: int
    intake_id: int
    date: date
    taken: bool

    model_config = {"from_attributes": True}


class MedicationPeriodOut(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    is_closed: bool
    intakes: List[MedicationIntakeOut]

    model_config = {"from_attributes": True}


class MedicationPeriodDetailOut(MedicationPeriodOut):
    logs: List[MedicationLogOut]


class MedicationLogRequest(BaseModel):
    intake_id: int
    date: date
    taken: bool
