import firebase_admin
from firebase_admin import credentials, storage
import os

# Đường dẫn tuyệt đối đến file key
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIREBASE_KEY_PATH = os.path.join(BASE_DIR, "firebase-key.json")

# Khởi tạo Firebase (chỉ 1 lần)
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'leafsense-project-f1f19.firebasestorage.app',  # đúng tên bucket
        'databaseURL': 'https://leafsense-project-f1f19-default-rtdb.asia-southeast1.firebasedatabase.app'
    })

bucket = storage.bucket()
