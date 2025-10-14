from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from app.models.users import User
from app.schemas.user_schema import UserResponse, ChangePassword
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
    remove_avatar: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin profile của user"""

    # Cập nhật thông tin cơ bản
    current_user.name = name
    current_user.email = email
    current_user.phone = phone
    current_user.address = address

    # Xử lý avatar
    if remove_avatar == "true":
        # Xóa avatar hiện tại
        if current_user.avatar_url:
            try:
                # Xóa file cũ nếu có
                old_file_path = current_user.avatar_url.replace("/uploads/avatars/", "")
                full_old_path = os.path.join(UPLOAD_DIR, old_file_path)
                if os.path.exists(full_old_path):
                    os.remove(full_old_path)
            except Exception:
                pass  # Ignore errors when deleting old files
        current_user.avatar_url = None
        
    elif avatar:
        # Kiểm tra loại file
        if not avatar.content_type or not avatar.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Xóa avatar cũ nếu có
        if current_user.avatar_url:
            try:
                old_file_path = current_user.avatar_url.replace("/uploads/avatars/", "")
                full_old_path = os.path.join(UPLOAD_DIR, old_file_path)
                if os.path.exists(full_old_path):
                    os.remove(full_old_path)
            except Exception:
                pass  # Ignore errors when deleting old files

        # Tạo tên file unique
        file_extension = os.path.splitext(avatar.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Lưy file với async I/O
        try:
            content = await avatar.read()
            # Sử dụng aiofiles để write async (nếu có) hoặc thread pool
            import asyncio
            
            def write_file(path, content):
                with open(path, "wb") as buffer:
                    buffer.write(content)
            
            # Write file in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, write_file, file_path, content)
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
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu"""

    # Kiểm tra xem user có phải đăng nhập bằng Google không
    if current_user.provider == "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể thay đổi mật khẩu cho tài khoản đăng nhập bằng Google"
        )

    # Kiểm tra mật khẩu cũ
    if not verify_password(password_data.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    try:
        # Hash và cập nhật mật khẩu
        hashed_password = get_password_hash(password_data.new_password)
        current_user.password = hashed_password

        db.commit()
        db.refresh(current_user)
        return {"message": "Password changed successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
