from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    ADMIN = "admin"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    avatar_url = Column(String(250))
    phone = Column(String(20))
    address = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.FARMER)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    disease_predictions = relationship("DiseasePrediction", back_populates="user")
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    posts = relationship("Post", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
