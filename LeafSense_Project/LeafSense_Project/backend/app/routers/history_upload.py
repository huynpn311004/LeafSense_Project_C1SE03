from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from ..models.users import User
from ..models.disease_prediction import DiseasePrediction
from core.database import get_db
from core.security import get_current_user

router = APIRouter()

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    disease_filter: Optional[str] = Query(None, description="Filter by disease type")
):
    """
    Get upload history for the current user
    """
    try:
        # Tạo query cơ bản
        query = db.query(DiseasePrediction).filter(DiseasePrediction.user_id == current_user.id)
        
        # Áp dụng filter theo disease type nếu có
        if disease_filter and disease_filter.lower() != "all":
            query = query.filter(DiseasePrediction.disease_type.ilike(f"%{disease_filter}%"))
        
        # Sắp xếp theo thời gian tạo (mới nhất trước)
        query = query.order_by(desc(DiseasePrediction.created_at))
        
        # Đếm tổng số bản ghi
        total = query.count()
        
        # Áp dụng phân trang
        history_records = query.offset(offset).limit(limit).all()
        
        # Chuyển đổi dữ liệu sang format phù hợp cho frontend
        formatted_history = []
        for record in history_records:
            # Xử lý confidence để hiển thị phần trăm
            confidence_percent = round(record.confidence * 100, 1) if record.confidence else 0
            
            # Xác định severity dựa trên disease type và confidence
            severity = "Low"
            if record.disease_type and record.disease_type.lower() != "nodisease":
                if confidence_percent >= 80:
                    severity = "High"
                elif confidence_percent >= 60:
                    severity = "Medium"
            
            # Format date và time
            created_time = record.created_at
            date_str = created_time.strftime("%d/%m/%Y") if created_time else ""
            time_str = created_time.strftime("%H:%M") if created_time else ""
            month_str = created_time.strftime("%B %Y") if created_time else ""
            
            formatted_record = {
                "id": record.id,
                "image": record.image_url,
                "highlight_image": record.highlight_image_url,
                "disease": record.disease_type or "Unknown",
                "confidence": confidence_percent,
                "severity": severity,
                "date": date_str,
                "time": time_str,
                "month": month_str,
                "treatment_recommendation": record.treatment_recommendation,
                "created_at": record.created_at.isoformat() if record.created_at else None
            }
            formatted_history.append(formatted_record)
        
        return {
            "history": formatted_history,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": total > (offset + len(formatted_history))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")

@router.get("/history/{prediction_id}")
def get_prediction_detail(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information for a specific prediction
    """
    try:
        # Lấy prediction với kiểm tra ownership
        prediction = db.query(DiseasePrediction).filter(
            DiseasePrediction.id == prediction_id,
            DiseasePrediction.user_id == current_user.id
        ).first()
        
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        # Xử lý confidence để hiển thị phần trăm
        confidence_percent = round(prediction.confidence * 100, 1) if prediction.confidence else 0
        
        # Format date và time
        created_time = prediction.created_at
        date_str = created_time.strftime("%d/%m/%Y %H:%M:%S") if created_time else ""
        
        return {
            "id": prediction.id,
            "image_url": prediction.image_url,
            "highlight_image_url": prediction.highlight_image_url,
            "disease_type": prediction.disease_type,
            "confidence": confidence_percent,
            "treatment_recommendation": prediction.treatment_recommendation,
            "created_at": date_str,
            "created_at_iso": prediction.created_at.isoformat() if prediction.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prediction detail: {str(e)}")

@router.delete("/history/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific prediction record
    """
    try:
        # Lấy prediction với kiểm tra ownership
        prediction = db.query(DiseasePrediction).filter(
            DiseasePrediction.id == prediction_id,
            DiseasePrediction.user_id == current_user.id
        ).first()
        
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        # Xóa record
        db.delete(prediction)
        db.commit()
        
        return {"message": "Prediction deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting prediction: {str(e)}")
