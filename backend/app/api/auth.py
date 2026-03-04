from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
import pyotp

from ..dependencies import get_current_user
from ..db import get_session
from ..models.user import (
    MFASetup,
    MFAVerify,
    User,
    UserCreate,
    UserLogin,
    UserOut,
)
from ..services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register_user(payload: UserCreate, session: Session = Depends(get_session)):
    user = auth_service.create_user(
        session, payload.email, payload.password, payload.enable_mfa or False
    )
    return UserOut(
        id=user.id,
        email=user.email,
        mfa_enabled=user.mfa_enabled,
        created_at=user.created_at,
    )


@router.post("/login")
def login(payload: UserLogin, session: Session = Depends(get_session)):
    user = auth_service.authenticate_user(session, payload.email, payload.password)

    if user.mfa_enabled:
        if not payload.totp_code or not auth_service.verify_totp(
            user.mfa_secret or "", payload.totp_code
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="MFA code required or invalid",
            )

    tokens = auth_service.generate_tokens(user)
    return {"user": UserOut(**user.model_dump()), **tokens}


@router.post("/mfa/setup", response_model=MFASetup)
def setup_mfa(
    current_user: User = Depends(get_current_user), session: Session = Depends(get_session)
):
    # Generate a new secret and persist
    secret = pyotp.random_base32()
    current_user.mfa_secret = secret
    current_user.mfa_enabled = False
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(
        name=current_user.email, issuer_name="IngredientVision"
    )
    return MFASetup(secret=secret, otpauth_url=otpauth_url)


@router.post("/mfa/verify")
def verify_mfa(
    payload: MFAVerify,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA not initialized")

    if not auth_service.verify_totp(current_user.mfa_secret, payload.totp_code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")

    current_user.mfa_enabled = True
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {"status": "mfa_enabled"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        mfa_enabled=current_user.mfa_enabled,
        created_at=current_user.created_at,
    )
