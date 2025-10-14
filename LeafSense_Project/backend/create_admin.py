#!/usr/bin/env python3
"""
Script để tạo admin account
Chạy: python create_admin.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from app.models.users import User
from core.security import get_password_hash
from sqlalchemy import text

def create_admin():
    """Tạo admin account"""
    db = SessionLocal()
    
    try:
        # Kiểm tra xem admin đã tồn tại chưa
        existing_admin = db.query(User).filter(
            User.email == "admin@gmail.com",
            User.role == "admin"
        ).first()
        
        if existing_admin:
            print("Admin account already exists!")
            print(f"Email: {existing_admin.email}")
            print(f"Status: {existing_admin.status}")
            return
        
        # Tạo admin mới
        admin_user = User(
            name="Administrator",
            email="admin@gmail.com",
            password=get_password_hash("admin123"),
            role="admin",
            status="active",
            provider="normal"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin account created successfully!")
        print(f"Email: {admin_user.email}")
        print(f"Password: admin123")
        print(f"Role: {admin_user.role}")
        print(f"Status: {admin_user.status}")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
