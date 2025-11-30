import os
from datetime import datetime, timedelta
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks, Form
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

from app.models.users import User, PasswordResetToken
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
        password=hashed_password,
        provider="normal"  # Mark this as a regular registration account
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

    # Check if account is locked
    if db_user.status == "inactive":
        raise HTTPException(
            status_code=403, 
            detail="Your account has been locked. Please contact leafsensehotro@gmail.com to unlock your account",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Create access token
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

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# === B1: User click "Login Google" ===
@router.get("/google/login", name="google_login")
async def google_login(request: Request):
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)

# === B2: Google callback ===
@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(status_code=400, detail="Unable to get information from Google")

        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")

        # 🔍 Kiểm tra hoặc tạo user mới
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password=None,  # Google login doesn't need password
                avatar_url=picture,
                role="farmer",
                status="active",
                provider="google"  # Mark this as a Google account
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check if account is locked
        if user.status == "inactive":
            # Redirect to frontend with error message
            error_url = "http://localhost:5173/account-locked"
            return RedirectResponse(url=error_url)

        # 🔑 Create JWT token
        expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user.email}, expires_delta=expires)

        # ✅ Redirect về dashboard thay vì trang chủ
        redirect_url = (
            f"http://localhost:5173/dashboard?"
            f"token={quote(access_token)}&email={quote(user.email)}"
            f"&name={quote(user.name or '')}&avatar_url={quote(user.avatar_url or '')}"
            f"&user_id={user.id}&role={quote(user.role or 'farmer')}"
        )

        return RedirectResponse(url=redirect_url)

    except Exception as e:
        print(f"❌ Google OAuth Error: {e}")
        raise HTTPException(status_code=500, detail=f"Google OAuth Error: {e}")

def send_reset_email(email_to: str, user_name: str, reset_url: str):
    # Email settings
    smtp_server = os.getenv("MAIL_SERVER")
    smtp_port = int(os.getenv("MAIL_PORT", "587"))
    smtp_username = os.getenv("MAIL_USERNAME")
    smtp_password = os.getenv("MAIL_PASSWORD")

    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset - LeafSense"
    msg["From"] = smtp_username
    msg["To"] = email_to

    # HTML Content
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        # <img src="https://i.imgur.com/XYZ123.png" alt="LeafSense Logo" style="max-width: 200px; margin-bottom: 20px;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2E7D32; margin-bottom: 20px;">Password Reset</h2>
            <p style="color: #333333;">Hello {user_name},</p>
            <p style="color: #333333;">We received a request to reset the password for your LeafSense account.</p>
            <p style="color: #333333;">Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" 
                   style="background-color: #2E7D32; 
                          color: white; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border-radius: 4px;
                          display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #666666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="color: #999999; font-size: 12px;">
                Best regards,<br>
                LeafSense Team
            </p>
        </div>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    # Send email
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Error sending email")

@router.post("/forgot-password")
async def forgot_password(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # For security reasons, don't reveal if email exists
        return {"detail": "If the email exists, a password reset link will be sent."}
    
    # Delete any existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).delete()
    
    # Create new token
    reset_token = PasswordResetToken(user_id=user.id)
    db.add(reset_token)
    db.commit()
    
    # Generate reset URL
    frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    reset_url = f"{frontend_url}/reset-password/{reset_token.token}"
    
    # Send email asynchronously
    background_tasks.add_task(
        send_reset_email,
        email_to=user.email,
        user_name=user.name,
        reset_url=reset_url
    )
    
    return {"detail": "If the email exists, a password reset link will be sent."}

@router.post("/reset-password/{token}")
def reset_password(
    token: str,
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Find valid token
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Get user
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password = get_password_hash(new_password)
    token_record.used = True
    
    db.commit()
    
    return {"detail": "Password has been reset successfully"}

