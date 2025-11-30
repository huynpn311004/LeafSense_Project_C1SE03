from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ultralytics import YOLO
from PIL import Image, ImageDraw
import io, os, base64
import logging
import traceback
from dotenv import load_dotenv
import google.generativeai as genai
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError

from core.database import get_db
from core.security import get_current_user
from app.models.users import User
from app.models.disease_prediction import DiseasePrediction
from app.services.firebase_service import upload_pil_image_to_firebase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress ALTS credentials warnings
logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.ERROR)
logging.getLogger('google.auth.transport.grpc').setLevel(logging.ERROR)

# ---- Router ----
router = APIRouter(prefix="/api/prediction", tags=["prediction"])

# ---- Load environment and Gemini key ----
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")
genai.configure(api_key=GEMINI_API_KEY)

# ---- Disease colors ----
DISEASE_COLORS = {
    'nodisease': (0, 255, 0),    # Green
    'rust': (255, 165, 0),       # Orange
    'phoma': (255, 0, 0),        # Red
    'miner': (0, 0, 255),        # Blue
    'notleaf': (255, 0, 255)     # Magenta - Not a leaf
}

# ---- Supported diseases ----
SUPPORTED_DISEASES = ['nodisease', 'rust', 'phoma', 'miner', 'notleaf']

# ---- Load YOLO models ----
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
cls_model_path = os.path.join(BASE_DIR, '..', 'ml_model', 'coffee_cls_best.pt')
seg_model_path = os.path.join(BASE_DIR, '..', 'ml_model', 'coffee_seg_best.pt')

cls_model = YOLO(cls_model_path)
seg_model = YOLO(seg_model_path)

# ---- Function: get treatment suggestion from Gemini ----
def get_treatment_suggestion(disease_name: str, confidence: float) -> str:
    try:
        disease_info = "nodisease" if disease_name.lower() == "nodisease" else f"bệnh {disease_name}"
        confidence_level = "%.1f%%" % (confidence * 100)
        
        prompt = f"""
        Bạn là chuyên gia điều trị bệnh cà phê. Hãy phân tích tình trạng {disease_info} và trả lời NGẮN GỌN.
        Bắt buộc giữ đúng 8 mục, mỗi mục trên một dòng tiêu đề, phần nội dung liệt kê gạch đầu dòng:

        1. Triệu chứng
           - Nêu 2-3 dấu hiệu nhận biết rõ ràng
        2. Nguyên nhân
           - Chỉ rõ tác nhân gây bệnh và điều kiện thuận lợi
        3. Thuốc điều trị chính
           - Liệt kê 2-3 hoạt chất khuyến nghị
        4. Liều lượng
           - Ghi rõ liều dùng tham khảo (ví dụ ml/bình 16L)
        5. Phác đồ điều trị
           - Liệt kê từng bước xử lý đánh số Bước 1, Bước 2...
        6. Lịch phun
           - Số lần và khoảng cách giữa các lần phun
        7. Thời điểm phun
           - Khung thời gian trong ngày hoặc giai đoạn sinh trưởng
        8. Biện pháp phòng ngừa
           - Các biện pháp canh tác và vệ sinh đồng ruộng

        Lưu ý: trả lời hoàn toàn bằng tiếng Việt, không thêm mục khác.
        """

        disease_name_lower = disease_name.lower()

        if disease_name_lower == "nodisease":
            return "Cây của bạn hoàn toàn khỏe mạnh! Hãy tiếp tục duy trì chế độ chăm sóc hiện tại."
        
        if disease_name_lower == "notleaf":
            return "Đây không phải là lá cà phê. Vui lòng chụp lại ảnh lá cà phê để hệ thống có thể phân tích bệnh chính xác."
        
        # Get available models
        available_models = [m.name for m in genai.list_models()]
        if "models/gemini-2.5-pro" not in available_models:
            raise ValueError(f"Gemini Pro model not available. Available models: {available_models}")

        model = genai.GenerativeModel("models/gemini-2.5-pro")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Không thể lấy được giải pháp điều trị. Lỗi: {str(e)}"

# ---- Function: Get optional current user ----
def get_optional_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    if not credentials:
        return None
    
    try:
        # Manually call get_current_user with the token
        from core.security import SECRET_KEY, ALGORITHM
        
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            return None
        
        user = db.query(User).filter(User.email == email).first()
        return user
    except JWTError:
        return None
    except Exception:
        return None

# ---- API: Analyze Image ----
@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
    request: Request = None
):
    # Đọc ảnh
    contents = await file.read()
    original_image = Image.open(io.BytesIO(contents)).convert("RGB")
    image = original_image.copy()  # Tạo copy để xử lý

    # Phân loại bệnh (classification)
    try:
        cls_results = cls_model(image)[0]
        cls_index = int(cls_results.probs.top1)
        predicted_class = cls_results.names[cls_index]
        
        # Chuẩn hóa tên class (fix typo notlleaf -> notleaf)
        if predicted_class.lower() == 'notlleaf':
            predicted_class = 'notleaf'
        
        cls_prediction = {
            'class': predicted_class,
            'confidence': float(cls_results.probs.top1conf)
        }
        logger.info(f"Disease classification completed: {cls_prediction['class']} ({cls_prediction['confidence']:.2%})")
    except Exception as e:
        logger.error(f"Error in classification: {str(e)}")
        raise

    # Phân vùng vùng bệnh (segmentation) - Bỏ qua nếu là notleaf
    seg_predictions = []
    
    if predicted_class.lower() != 'notleaf':
        seg_results = seg_model(image)[0]
        boxes = seg_results.boxes

        draw = ImageDraw.Draw(image)
        logger.info("Starting disease region segmentation")

        if boxes is not None:
            for box in boxes:
                try:
                    xy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    disease_class = seg_results.names[int(box.cls[0])]
                    color = DISEASE_COLORS.get(disease_class.lower(), (255, 0, 0))
                    draw.rectangle(xy, outline=color, width=3)
                    label = f"{disease_class}: {float(box.conf[0]):.2f}"
                    draw.text((xy[0], xy[1]-15), label, fill=color)

                    seg_predictions.append({
                        'class': disease_class,
                        'confidence': float(box.conf[0]),
                        'bbox': xy,
                        'color': color
                    })
                except Exception:
                    continue
    else:
        logger.info("Skipping segmentation - image is not a coffee leaf")

    # Gọi Gemini để lấy hướng dẫn điều trị
    disease_name = cls_prediction["class"]
    confidence = cls_prediction["confidence"]
    treatment_suggestion = get_treatment_suggestion(disease_name, confidence)

    # Chuyển ảnh thành base64
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64}"

    # Upload ảnh lên Firebase và lưu vào database (chỉ nếu user đã đăng nhập)
    prediction_record = None
    
    if current_user:
        try:
            # Upload ảnh gốc lên Firebase
            original_image_url = upload_pil_image_to_firebase(
                original_image, 
                folder="originals", 
                filename_prefix=f"original_{current_user.id}"
            )
            
            # Upload ảnh highlight lên Firebase
            highlight_image_url = upload_pil_image_to_firebase(
                image,  # Ảnh đã được vẽ highlight
                folder="highlights", 
                filename_prefix=f"highlight_{current_user.id}"
            )
            
            # Lưu thông tin vào database
            prediction_record = DiseasePrediction(
                user_id=current_user.id,
                image_url=original_image_url,
                highlight_image_url=highlight_image_url,
                disease_type=disease_name,
                confidence=confidence,
                treatment_recommendation=treatment_suggestion
            )
            
            db.add(prediction_record)
            db.commit()
            db.refresh(prediction_record)
            
        except Exception as e:
            # Rollback nếu có lỗi
            try:
                db.rollback()
            except Exception as rollback_error:
                pass

    # Trả về kết quả (cho cả trường hợp đã đăng nhập hoặc chưa)
    response_data = {
        "filename": file.filename,
        "classification": cls_prediction,
        "segmentation": seg_predictions,
        "highlight_image": data_uri,
        "treatment_suggestion": treatment_suggestion,
        "prediction_id": prediction_record.id if prediction_record else None,
        "saved": prediction_record is not None,
        "user_authenticated": current_user is not None
    }

    return response_data

# ---- API: Check Authentication Status ----
@router.get("/auth-status")
async def check_auth_status(current_user: Optional[User] = Depends(get_optional_current_user)):
    if current_user:
        return {
            "authenticated": True,
            "user_id": current_user.id,
            "user_email": current_user.email,
            "user_name": current_user.name
        }
    else:
        return {
            "authenticated": False,
            "message": "No valid authentication token provided"
        }