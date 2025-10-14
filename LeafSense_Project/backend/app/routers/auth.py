import os
from datetime import timedelta
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse

from app.models.user import User 
from app.schemas.user_schema import UserCreate, UserLogin, UserResponse, Token
from core.database import get_db
from core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, get_password_hash
from dotenv import load_dotenv

load_dotenv()


router = APIRouter(prefix="/auth", tags=["Authentication"])

# Đăng ký
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Kiểm tra email tồn tại
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được đăng ký"
        )
    
    # Hash password
    hashed_password = get_password_hash(user.password)

    # Tạo user mới
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# Đăng nhập
@router.post("/login", response_model=Token)
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    # Tìm user theo email
    db_user = db.query(User).filter(User.email == form_data.email).first()
    if not db_user or not verify_password(form_data.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai email hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Tạo access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

# Cấu hình OAuth Google

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# B1: User click login google
@router.get("/google/login", name="google_login")
async def google_login(request: Request):
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)

# B2: Google callback
@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(status_code=400, detail="Không lấy được thông tin từ Google")

        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")

        # 🔍 Kiểm tra người dùng trong DB
        user = db.query(User).filter(User.email == email).first()

        if not user:
            try:
                user = User(
                    name=name,
                    email=email,
                    password="",  # Google login không cần password
                    avatar_url=picture,
                    role="farmer",
                    status="active"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception as e:
                db.rollback()
                print(f"❌ Lỗi tạo user mới: {e}")
                raise HTTPException(status_code=500, detail=f"Lỗi tạo user: {e}")

        # 🔑 Tạo JWT token
        expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user.email}, expires_delta=expires)

        # 🔁 Redirect về frontend (React)
        redirect_url = (
            f"http://localhost:5173/google/callback?"
            f"token={quote(access_token)}&email={quote(user.email)}&name={quote(user.name or '')}&avatar_url={quote(user.avatar_url or '')}"
        )

        return RedirectResponse(url=redirect_url)

    except Exception as e:
        print(f"❌ Lỗi Google OAuth: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi Google OAuth: {e}")