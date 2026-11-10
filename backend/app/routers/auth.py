from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.database.schemas import UserCreate, UserLogin, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.services.audit_service import audit_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email exists
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    # Validate role
    valid_roles = {"Administrator", "Investigator", "Viewer"}
    role = user_in.role if user_in.role in valid_roles else "Investigator"

    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name.strip(),
        role=role,
        badge_number=user_in.badge_number,
        agency=user_in.agency or "Digital Forensic Investigation Unit",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit_service.log_event(
        db=db,
        actor=new_user.username,
        action="USER_REGISTRATION",
        resource_type="USER",
        resource_id=str(new_user.id),
        outcome="SUCCESS",
        details=f"User {new_user.username} registered with role {new_user.role}"
    )

    return new_user

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_in.username.strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        audit_service.log_event(
            db=db,
            actor=login_in.username,
            action="USER_LOGIN_FAILED",
            resource_type="USER",
            outcome="FAILURE",
            details="Invalid credentials provided"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact Administrator."
        )

    token = create_access_token(data={"sub": user.username, "role": user.role, "uid": user.id})

    audit_service.log_event(
        db=db,
        actor=user.username,
        action="USER_LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=str(user.id),
        outcome="SUCCESS",
        details=f"Successful authentication for {user.username} ({user.role})"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
