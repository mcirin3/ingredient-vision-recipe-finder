from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Column, String, DateTime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column=Column(String, unique=True, nullable=False, index=True)
    )
    password_hash: str
    mfa_secret: Optional[str] = None
    mfa_enabled: bool = False
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column=Column(DateTime, nullable=False)
    )


class UserCreate(SQLModel):
    email: str
    password: str
    enable_mfa: bool | None = False


class UserLogin(SQLModel):
    email: str
    password: str
    totp_code: str | None = None


class UserOut(SQLModel):
    id: int
    email: str
    mfa_enabled: bool
    created_at: datetime


class MFASetup(SQLModel):
    secret: str
    otpauth_url: str


class MFAVerify(SQLModel):
    totp_code: str
