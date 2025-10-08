from sqlalchemy import Column, Integer, String, Enum, DateTime
from datetime import datetime
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    avatar_url = Column(String(250))
    phone = Column(String(20))
    address = Column(String(255))
    role = Column(Enum("farmer", "admin", name="user_roles"), default="farmer")
    status = Column(Enum("active", "inactive", name="user_status"), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
