from core.firebase_config import bucket
import uuid
import io
import base64
from PIL import Image

def upload_image_to_firebase(local_path: str, folder: str = "uploads"):
    """Upload ảnh lên Firebase và trả về URL công khai"""
    blob_name = f"{folder}/{uuid.uuid4()}.jpg"
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(local_path)
    blob.make_public()
    return blob.public_url

def upload_image_from_bytes_to_firebase(image_bytes: bytes, folder: str = "uploads", filename_prefix: str = "image"):
    """Upload ảnh từ bytes lên Firebase và trả về URL công khai"""
    blob_name = f"{folder}/{filename_prefix}_{uuid.uuid4()}.jpg"
    blob = bucket.blob(blob_name)
    blob.upload_from_string(image_bytes, content_type='image/jpeg')
    blob.make_public()
    return blob.public_url

def upload_pil_image_to_firebase(pil_image: Image.Image, folder: str = "uploads", filename_prefix: str = "image"):
    """Upload PIL Image lên Firebase và trả về URL công khai"""
    # Convert PIL image to bytes
    img_byte_array = io.BytesIO()
    pil_image.save(img_byte_array, format='JPEG', quality=90)
    img_bytes = img_byte_array.getvalue()
    
    return upload_image_from_bytes_to_firebase(img_bytes, folder, filename_prefix)

def upload_base64_image_to_firebase(base64_data: str, folder: str = "uploads", filename_prefix: str = "image"):
    """Upload ảnh từ base64 string lên Firebase và trả về URL công khai"""
    # Remove data URL prefix if present
    if base64_data.startswith('data:image'):
        base64_data = base64_data.split(',')[1]
    
    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_data)
    
    return upload_image_from_bytes_to_firebase(image_bytes, folder, filename_prefix)
