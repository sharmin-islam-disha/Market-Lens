from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import jwt

from db.database import get_db
from db import models
from core import security

router = APIRouter()
users_router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class UserCreate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    gmail: Optional[str] = None
    email: Optional[str] = None
    staff_id: str

    def get_name(self) -> str:
        return self.full_name or self.name or self.staff_id

    def get_email(self) -> str:
        return self.email or self.gmail or f"{self.staff_id}@domain.com"

class ApiKeyUpdate(BaseModel):
    api_key: str

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        staff_id: str = payload.get("sub")
        if staff_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.staff_id == staff_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    reg_email = user.get_email()
    db_user = db.query(models.User).filter(
        (models.User.gmail == reg_email) | (models.User.staff_id == user.staff_id)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or Staff ID already registered")
    
    hashed_password = security.get_password_hash(user.staff_id)
    db_user = models.User(
        name=user.get_name(), 
        gmail=reg_email, 
        staff_id=user.staff_id, 
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Deterministic immediate session creation
    access_token_expires = security.timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": db_user.staff_id}, expires_delta=access_token_expires
    )
    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "has_api_key": False
    }

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.staff_id == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Staff ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = security.timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.staff_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "has_api_key": bool(user.gemini_api_key)}

def _handle_key_update(key_update: ApiKeyUpdate, db: Session, current_user: models.User):
    from services.api_key_provider import test_api_key
    
    is_valid, msg = test_api_key("gemini", key_update.api_key)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid API Key: {msg}")
    
    current_user.gemini_api_key = key_update.api_key
    db.commit()
    return {"message": "API Key updated successfully"}

@router.post("/api-key")
def update_api_key_auth(key_update: ApiKeyUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return _handle_key_update(key_update, db, current_user)

@users_router.patch("/me/key")
def update_api_key_users(key_update: ApiKeyUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return _handle_key_update(key_update, db, current_user)

def _build_user_profile(current_user: models.User):
    has_key = bool(current_user.gemini_api_key and len(current_user.gemini_api_key.strip()) >= 15)
    preview = None
    if has_key:
        k = current_user.gemini_api_key.strip()
        preview = f"{k[:6]}...{k[-4:]}"
    return {
        "name": current_user.name, 
        "full_name": current_user.name,
        "gmail": current_user.gmail, 
        "email": current_user.gmail,
        "staff_id": current_user.staff_id, 
        "has_api_key": has_key,
        "is_supervisor": False,
        "api_key_status": "Valid" if has_key else "Not Configured",
        "api_key_preview": preview
    }

@router.get("/me")
def read_users_me_auth(current_user: models.User = Depends(get_current_user)):
    return _build_user_profile(current_user)

@users_router.get("/me")
def read_users_me_users(current_user: models.User = Depends(get_current_user)):
    return _build_user_profile(current_user)
