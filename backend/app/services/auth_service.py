from typing import Optional

import pyotp
from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from ..models.user import User


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email.lower().strip())).first()


def create_user(session: Session, email: str, password: str, enable_mfa: bool) -> User:
    existing = get_user_by_email(session, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    user = User(
        email=email.lower().strip(),
        password_hash=get_password_hash(password),
        mfa_secret=None,
        mfa_enabled=False,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, email: str, password: str) -> User:
    user = get_user_by_email(session, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return user


def generate_tokens(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}


def verify_totp(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)
