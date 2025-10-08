from fastapi import APIRouter, UploadFile, File
from ultralytics import YOLO
from PIL import Image, ImageDraw
import io, os, base64

router = APIRouter(prefix="/api/prediction", tags=["prediction"])

# ---- Load models ----
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
cls_model_path = os.path.join(BASE_DIR, '..', 'ml_model', 'coffee_cls_best.pt')
seg_model_path = os.path.join(BASE_DIR, '..', 'ml_model', 'coffee_seg_best.pt')

cls_model = YOLO(cls_model_path)
seg_model = YOLO(seg_model_path)

@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    #Đọc ảnh
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    #Phân loại
    cls_results = cls_model(image)[0]
    cls_index = int(cls_results.probs.top1)
    cls_prediction = {
        'class': cls_results.names[cls_index],
        'confidence': float(cls_results.probs.top1conf)
    }

    #Segmentation
    seg_results = seg_model(image)[0]
    boxes = seg_results.boxes

    draw = ImageDraw.Draw(image)
    seg_predictions = []

    if boxes is not None:
        for i, box in enumerate(boxes):
            try:
                xy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                # Vẽ rectangle hoặc ellipse để khoanh vùng
                draw.rectangle(xy, outline=(255, 0, 0), width=3)
                # Hoặc nếu muốn khoanh tròn (ellipse):
                # draw.ellipse(xy, outline=(255,0,0), width=3)

                seg_predictions.append({
                    'class': seg_results.names[int(box.cls[0])],
                    'confidence': float(box.conf[0]),
                    'bbox': xy
                })
            except Exception:
                continue

    # Chuyển ảnh sang base64
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64}"

    return {
        "classification": cls_prediction,
        "segmentation": seg_predictions,
        "filename": file.filename,
        "highlight_image": data_uri
    }
