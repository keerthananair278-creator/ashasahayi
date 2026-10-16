"""Pydantic request models. Both camelCase (frontend) and snake_case keys are accepted."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

HOUSE_NO = r"^[A-Za-z0-9\-]{1,20}$"


class _Base(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)


class MemberIn(_Base):
    name: str = Field(min_length=1, max_length=120)
    age: float | None = Field(default=None, ge=0, le=120)
    relation: str | None = Field(default=None, max_length=60)
    health_status: str | None = Field(default=None, max_length=300, alias="healthStatus")
    sex: str | None = Field(default=None, pattern="^[MFO]$")


class HouseIn(_Base):
    house_no: str = Field(pattern=HOUSE_NO, alias="houseNo")
    house_name: str = Field(min_length=1, max_length=150, alias="houseName")
    ward_id: str = Field(default="WARD-4", min_length=1, max_length=30, alias="wardId")
    password: str | None = Field(default=None, min_length=4, max_length=64)  # required on create
    phone: str | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=2000)
    members: list[MemberIn] = Field(min_length=1, max_length=15)


class CitizenLogin(_Base):
    house_no: str = Field(pattern=HOUSE_NO, alias="houseNo")
    password: str = Field(min_length=1, max_length=64)


class AshaLogin(_Base):
    pin: str | None = Field(default=None, max_length=32)


class TokenOut(BaseModel):
    token: str
    role: str
    house_no: str | None = None


class TaskIn(_Base):
    completed: bool


class VaccineIn(_Base):
    code: str = Field(min_length=1, max_length=20)
    given_date: str = Field(alias="givenDate", description="YYYY-MM-DD")


class AskIn(_Base):
    question: str = Field(min_length=3, max_length=500)


class QuestionsIn(_Base):
    topic: str = Field(min_length=2, max_length=100)
