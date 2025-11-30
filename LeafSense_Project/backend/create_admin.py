#!/usr/bin/env python
import sys
import os
import hashlib
from datetime import datetime

# Thêm thư mục backend vào Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import SessionLocal, Base, engine

# Import trực tiếp User model để tránh circular import
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

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

def get_password_hash(password: str) -> str:
    """Mã hóa mật khẩu"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin_account():
    """Tạo tài khoản admin"""
    
    # Khởi tạo database nếu chưa có
    Base.metadata.create_all(bind=engine)
    
    # Tạo session database
    db: Session = SessionLocal()
    
    try:
        # Thông tin admin
        admin_email = "leafsensehotro@gmail.com"
        admin_password = "admin123"
        admin_name = "LeafSense Admin"
        
        # Kiểm tra xem admin đã tồn tại chưa
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if existing_admin:
            print(f"❌ Tài khoản admin với email {admin_email} đã tồn tại!")
            return
        
        # Mã hóa mật khẩu
        hashed_password = get_password_hash(admin_password)
        
        # Tạo tài khoản admin mới
        admin_user = User(
            name=admin_name,
            email=admin_email,
            password=hashed_password,
            role="admin",
            status="active",
            provider="normal",
            created_at=datetime.utcnow()
        )
        
        # Lưu vào database
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Tạo tài khoản admin thành công!")
        print(f"📧 Email: {admin_email}")
        print(f"🔑 Password: {admin_password}")
        print(f"👤 Name: {admin_name}")
        print(f"🆔 ID: {admin_user.id}")
        print(f"⏰ Created at: {admin_user.created_at}")
        
    except Exception as e:
        print(f"❌ Lỗi khi tạo tài khoản admin: {e}")
        db.rollback()
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Bắt đầu tạo tài khoản admin...")
    create_admin_account()
    print("🎉 Hoàn thành!")