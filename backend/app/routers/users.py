from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from app.models.users import User
from app.schemas.user_schema import UserResponse, ChangePassword
from core.security import get_current_user, verify_password, get_password_hash
from sqlalchemy.exc import SQLAlchemyError
from app.services.firebase_service import upload_file_to_firebase

router = APIRouter()


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
        current_user.avatar_url = None
        
    elif avatar:
        # Kiểm tra loại file
        if not avatar.content_type or not avatar.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Upload avatar lên Firebase
        try:
            avatar_url = await upload_file_to_firebase(
                file=avatar,
                folder="avatars",
                filename_prefix=f"avatar_{current_user.id}_"
            )
            
            # Cập nhật avatar_url với URL từ Firebase
            current_user.avatar_url = avatar_url
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload avatar to Firebase: {str(e)}"
            )

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
