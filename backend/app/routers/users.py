from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.database.schemas import UserOut, UserUpdateRole
from app.core.dependencies import require_role
from app.services.audit_service import audit_service

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator"]))
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_update: UserUpdateRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid_roles = {"Administrator", "Investigator", "Viewer"}
    if role_update.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    old_role = user.role
    user.role = role_update.role
    db.commit()
    db.refresh(user)

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="USER_ROLE_CHANGED",
        resource_type="USER",
        resource_id=str(user.id),
        outcome="SUCCESS",
        details=f"Role changed from {old_role} to {user.role} by {current_user.username}"
    )

    return user
