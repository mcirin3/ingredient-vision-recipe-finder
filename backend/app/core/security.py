from datetime import datetime, timedelta
from typing import Any, Optional

import jwt
from passlib.context import CryptContext

from .config import settings

# Use bcrypt_sha256 so the 72-byte bcrypt input limit doesn't block long passwords.
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

ALGORITHM = "HS256"


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.auth_secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.auth_secret_key, algorithms=[ALGORITHM])
