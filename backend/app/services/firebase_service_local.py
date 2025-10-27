import os
import uuid
import shutil
from fastapi import UploadFile
from pathlib import Path

# Đường dẫn uploads local
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def upload_file_to_firebase(file: UploadFile, folder: str = "uploads", filename_prefix: str = "file"):
    """Upload file local cho development và trả về URL giả"""
    
    # Tạo thư mục nếu chưa có
    folder_path = UPLOAD_DIR / folder
    folder_path.mkdir(exist_ok=True)
    
    # Tạo tên file unique
    file_extension = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg'
    filename = f"{filename_prefix}_{uuid.uuid4()}.{file_extension}"
    file_path = folder_path / filename
    
    # Lưu file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Reset file pointer
    await file.seek(0)
    
    # Trả về URL local (giả lập Firebase URL)
    return f"/uploads/{folder}/{filename}"

def upload_image_from_bytes_to_firebase(image_bytes: bytes, folder: str = "uploads", filename_prefix: str = "image"):
    """Upload ảnh từ bytes local và trả về URL giả"""
    
    folder_path = UPLOAD_DIR / folder
    folder_path.mkdir(exist_ok=True)
    
    filename = f"{filename_prefix}_{uuid.uuid4()}.jpg"
    file_path = folder_path / filename
    
    with open(file_path, "wb") as f:
        f.write(image_bytes)
    
    return f"/uploads/{folder}/{filename}"