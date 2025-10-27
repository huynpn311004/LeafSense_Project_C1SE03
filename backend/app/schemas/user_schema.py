from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str
    status: str
    provider: str
    created_at: datetime

    class Config:
        from_attributes = True  # Cho phép convert từ SQLAlchemy object

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    phone: Optional[str]
    address: Optional[str]

class ChangePassword(BaseModel):
    old_password: str
    new_password: str
