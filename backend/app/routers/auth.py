from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.session import RefreshSession
from app.models.user import User
from app.schemas.user import LoginRequest, RegisterRequest, UserOut
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _set_auth_cookie(response: Response, key: str, value: str, max_age_minutes: int) -> None:
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path="/",
    )


def _clear_auth_cookie(response: Response, key: str) -> None:
    response.delete_cookie(
        key=key,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path="/",
    )


def _issue_session(db: Session, user: User, response: Response) -> None:
    """Create access + refresh tokens, record the refresh session, and set both cookies."""
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.refresh_token_expire_minutes)
    db.add(RefreshSession(user_id=user.id, token_hash=hash_token(refresh), expires_at=expires_at))
    db.commit()

    _set_auth_cookie(response, ACCESS_COOKIE, access, settings.access_token_expire_minutes)
    _set_auth_cookie(response, REFRESH_COOKIE, refresh, settings.refresh_token_expire_minutes)


@router.post("/login", response_model=UserOut)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == body.email).first()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    _issue_session(db, user, response)
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db)) -> User:
    if db.query(User).filter(User.email == body.email).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="staff",
        warehouse_id=str(body.warehouse_id),
        status="active",
        joined_date=date.today(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _issue_session(db, user, response)
    return user


@router.post("/refresh", response_model=UserOut)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    if not refresh_token:
        raise unauthorized

    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise unauthorized from exc

    if payload.get("type") != "refresh":
        raise unauthorized

    session_row = (
        db.query(RefreshSession).filter(RefreshSession.token_hash == hash_token(refresh_token)).first()
    )
    if session_row is None or session_row.revoked:
        raise unauthorized
    expires_at = session_row.expires_at
    if expires_at.tzinfo is None:
        # SQLite (tests) returns naive datetimes; treat stored values as UTC.
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise unauthorized

    user = db.get(User, payload.get("sub"))
    if user is None:
        raise unauthorized

    # Rotate: revoke the old session and issue a fresh access + refresh pair.
    session_row.revoked = True
    db.add(session_row)
    _issue_session(db, user, response)
    return user


@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if refresh_token:
        session_row = (
            db.query(RefreshSession)
            .filter(RefreshSession.token_hash == hash_token(refresh_token))
            .first()
        )
        if session_row is not None and not session_row.revoked:
            session_row.revoked = True
            db.add(session_row)
            db.commit()

    _clear_auth_cookie(response, ACCESS_COOKIE)
    _clear_auth_cookie(response, REFRESH_COOKIE)
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
