from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.activity.service import log_event
from app.auth.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.users.models import User, UserSetting
from app.users.schemas import UserOut, UserSettingOut, UserSettingUpdate, UserUpdate

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


@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> List[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


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
