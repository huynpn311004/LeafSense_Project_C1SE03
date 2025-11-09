from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from core.database import Base
import pytz
VN_TZ = pytz.timezone("Asia/Ho_Chi_Minh")

class DiseasePrediction(Base):
    __tablename__ = "disease_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # URL của ảnh gốc được lưu trên Firebase
    image_url = Column(String(500), nullable=False)
    # URL của ảnh highlight được lưu trên Firebase
    highlight_image_url = Column(String(500))
    disease_type = Column(String(50))
    confidence = Column(Float)
    treatment_recommendation = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(VN_TZ))
