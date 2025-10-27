from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import secrets
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=True)
    avatar_url = Column(String(250))
    phone = Column(String(20))
    address = Column(String(255))
    role = Column(Enum("farmer", "admin", name="user_roles"), default="farmer")
    status = Column(Enum("active", "inactive", name="user_status"), default="active")
    provider = Column(Enum("normal", "google", name="auth_providers"), default="normal")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    reset_tokens = relationship("PasswordResetToken", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="reset_tokens")
    
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.token = secrets.token_urlsafe(32)
        self.created_at = datetime.utcnow()
        self.expires_at = self.created_at + timedelta(hours=1)  # Token expires in 1 hour
        self.used = False

