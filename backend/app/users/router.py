from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.activity.service import log_event
from app.auth.dependencies import get_current_user, require_role
from app.auth.jwt import hash_password, verify_password
from app.auth.router import _is_email_allowed
from app.db.session import get_db
from app.users.models import User, UserSetting
from app.warehouses.models import Warehouse
from app.users.schemas import (
    AdminCreateUserRequest,
    ChangePasswordRequest,
    UserOut,
    UserSettingOut,
    UserSettingUpdate,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


# Declared before /{user_id} so "me" isn't swallowed as a user_id path param.
@router.get("/me/settings", response_model=UserSettingOut)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserSetting:
    settings = current_user.settings
    if settings is None:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/me/settings", response_model=UserSettingOut)
def update_my_settings(
    body: UserSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserSetting:
    settings = current_user.settings or UserSetting(user_id=current_user.id)
    updates = {
        "notify_low_stock": body.notifyLowStock,
        "notify_order_update": body.notifyOrderUpdate,
        "notify_po_approval": body.notifyPoApproval,
        "language": body.language,
        "timezone": body.timezone,
    }
    for column, value in updates.items():
        if value is not None:
            setattr(settings, column, value)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.put("/me/change-password", response_model=UserOut)
def change_my_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(body.new_password)
    current_user.must_change_password = False
    # Same reasoning as logout/role changes: invalidate tokens minted under the
    # old password so a stolen still-valid access token doesn't outlive the
    # change the user just made.
    current_user.token_version += 1
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> List[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    body: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> User:
    """Admin-provisioned account: active immediately (no self-registration
    pending step -- the admin is vouching for it directly), temp password,
    must be changed on first login."""
    if not _is_email_allowed(body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @grandroyal.com email addresses are allowed.",
        )
    if db.query(User).filter(User.email == body.email).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if body.warehouse_id is not None and db.get(Warehouse, body.warehouse_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Warehouse not found")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        warehouse_id=body.warehouse_id,
        status="active",
        must_change_password=True,
        joined_date=date.today(),
    )
    db.add(user)
    db.flush()
    log_event(
        db,
        kind="user",
        title="User account created",
        description=f"{current_user.name} created {user.name} ({user.email}, role={user.role})",
        actor=current_user,
        target_roles=["admin"],
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    changes: list[str] = []

    # Update fields
    if user_update.name is not None and user_update.name != user.name:
        changes.append(f"name: {user.name!r} -> {user_update.name!r}")
        user.name = user_update.name
    if user_update.email is not None and user_update.email != user.email:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        changes.append(f"email: {user.email!r} -> {user_update.email!r}")
        user.email = user_update.email
    if user_update.role is not None and user_update.role != user.role:
        changes.append(f"role: {user.role!r} -> {user_update.role!r}")
        user.role = user_update.role
    if user_update.warehouse_id is not None and user_update.warehouse_id != user.warehouse_id:
        changes.append(f"warehouse_id: {user.warehouse_id!r} -> {user_update.warehouse_id!r}")
        user.warehouse_id = user_update.warehouse_id
    if user_update.status is not None and user_update.status != user.status:
        changes.append(f"status: {user.status!r} -> {user_update.status!r}")
        user.status = user_update.status

    # role/status changed => any access token already issued to this user was
    # minted under the OLD permissions and would otherwise keep working for
    # up to its remaining lifetime (e.g. a just-deactivated or demoted
    # account could still act as before for ~30 more minutes).
    if user_update.role is not None or user_update.status is not None:
        user.token_version += 1

    if changes:
        log_event(
            db,
            kind="user",
            title="User account updated",
            description=f"{current_user.name} updated {user.name} ({user.email}): {'; '.join(changes)}",
            actor=current_user,
            target_roles=["admin"],
        )

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Don't allow deleting yourself
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

    log_event(
        db,
        kind="user",
        title="User account deleted",
        description=f"{current_user.name} deleted {user.name} ({user.email}, role={user.role})",
        actor=current_user,
        target_roles=["admin"],
    )
    db.delete(user)
    db.commit()
