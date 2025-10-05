from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from app.models.users import User
from app.schemas.user_schema import UserResponse
from core.security import get_current_user, verify_password, get_password_hash
from sqlalchemy.exc import SQLAlchemyError
import os
import uuid

router = APIRouter()

# Tạo thư mục uploads nếu chưa có
UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/profile", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Lấy thông tin profile của user hiện tại"""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    address: str = Form(None),
    avatar: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin profile của user"""

    # Cập nhật thông tin cơ bản
    current_user.name = name
    current_user.email = email
    current_user.phone = phone
    current_user.address = address

    # Xử lý avatar nếu có
    if avatar:
        # Kiểm tra loại file
        if not avatar.content_type or not avatar.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Tạo tên file unique
        file_extension = os.path.splitext(avatar.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Lưu file
        try:
            content = await avatar.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save avatar: {e}")

        # Cập nhật avatar_url
        current_user.avatar_url = f"/uploads/avatars/{filename}"

    try:
        db.commit()
        db.refresh(current_user)
        return current_user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


@router.put("/change-password")
def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu"""

    # Kiểm tra mật khẩu cũ
    if not verify_password(old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    # Kiểm tra độ dài mật khẩu mới
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    try:
        # Hash và cập nhật mật khẩu
        hashed_password = get_password_hash(new_password)
        current_user.password = hashed_password

        db.commit()
        db.refresh(current_user)
        return {"message": "Password changed successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
