#!/usr/bin/env python3
"""
Script đơn giản để tạo admin account
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Database configuration
DATABASE_URL = "sqlite:///./instance/leafsense.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Mã hóa mật khẩu"""
    return pwd_context.hash(password)

def create_admin():
    """Tạo admin account"""
    db = SessionLocal()
    
    try:
        # Kiểm tra xem admin đã tồn tại chưa
        result = db.execute(text("SELECT * FROM users WHERE email = :email AND role = :role"), {
            "email": "admin@gmail.com",
            "role": "admin"
        }).fetchone()
        
        if result:
            print("Admin account already exists!")
            print(f"Email: {result[2]}")  # email column
            print(f"Status: {result[7]}")  # status column
            return
        
        # Tạo admin mới
        hashed_password = get_password_hash("admin123")
        
        db.execute(text("""
            INSERT INTO users (name, email, password, role, status, provider, created_at)
            VALUES (:name, :email, :password, :role, :status, :provider, datetime('now'))
        """), {
            "name": "Administrator",
            "email": "admin@gmail.com",
            "password": hashed_password,
            "role": "admin",
            "status": "active",
            "provider": "normal"
        })
        
        db.commit()
        
        print("✅ Admin account created successfully!")
        print("Email: admin@gmail.com")
        print("Password: admin123")
        print("Role: admin")
        print("Status: active")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
