from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from datetime import datetime, timedelta

from ..models.users import User
from ..models.disease_prediction import DiseasePrediction
from ..models.order import Order
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

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard statistics for the current user
    """
    try:
        # Lấy tổng số phân tích
        total_analysis = db.query(DiseasePrediction).filter(
            DiseasePrediction.user_id == current_user.id
        ).count()
        
        # Lấy số bệnh được phát hiện (loại trừ nodisease)
        diseases_detected = db.query(DiseasePrediction).filter(
            and_(
                DiseasePrediction.user_id == current_user.id,
                DiseasePrediction.disease_type != 'nodisease',
                DiseasePrediction.disease_type.isnot(None)
            )
        ).count()
        
        # Tính accuracy rate dựa trên confidence trung bình
        avg_confidence_result = db.query(func.avg(DiseasePrediction.confidence)).filter(
            DiseasePrediction.user_id == current_user.id
        ).scalar()
        accuracy_rate = round(avg_confidence_result * 100, 1) if avg_confidence_result else 0
        
        # Lấy số phân tích trong tháng này
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_analysis = db.query(DiseasePrediction).filter(
            and_(
                DiseasePrediction.user_id == current_user.id,
                DiseasePrediction.created_at >= current_month_start
            )
        ).count()
        
        # Lấy thống kê đơn hàng
        total_orders = db.query(Order).filter(
            Order.user_id == current_user.id
        ).count()
        
        pending_orders = db.query(Order).filter(
            and_(
                Order.user_id == current_user.id,
                Order.status == 'pending'
            )
        ).count()
        
        completed_orders = db.query(Order).filter(
            and_(
                Order.user_id == current_user.id,
                Order.status.in_(['completed', 'delivered'])
            )
        ).count()
        
        # Tính tổng tiền đã chi tiêu
        total_spent_result = db.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.user_id == current_user.id,
                Order.status.in_(['completed', 'delivered'])
            )
        ).scalar()
        total_spent = float(total_spent_result) if total_spent_result else 0
        
        # Lấy hoạt động gần đây (5 records mới nhất)
        recent_activities = db.query(DiseasePrediction).filter(
            DiseasePrediction.user_id == current_user.id
        ).order_by(desc(DiseasePrediction.created_at)).limit(5).all()
        
        # Format recent activities
        formatted_activities = []
        for activity in recent_activities:
            confidence_percent = round(activity.confidence * 100, 1) if activity.confidence else 0
            time_diff = datetime.utcnow() - activity.created_at if activity.created_at else timedelta(0)
            
            # Tính thời gian relative
            if time_diff.days > 0:
                time_ago = f"{time_diff.days} ngày trước"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                time_ago = f"{hours} giờ trước"
            elif time_diff.seconds > 60:
                minutes = time_diff.seconds // 60
                time_ago = f"{minutes} phút trước"
            else:
                time_ago = "Vừa xong"
            
            formatted_activities.append({
                "id": activity.id,
                "type": "analysis",
                "disease": activity.disease_type or "Unknown",
                "confidence": confidence_percent,
                "time_ago": time_ago,
                "icon": "🌱" if activity.disease_type == "nodisease" else "🔍",
                "message": f"Phân tích hoàn thành - {activity.disease_type} ({confidence_percent}% độ tin cậy)"
            })
        
        # Lấy thống kê loại bệnh
        disease_stats = db.query(
            DiseasePrediction.disease_type,
            func.count(DiseasePrediction.id).label('count')
        ).filter(
            DiseasePrediction.user_id == current_user.id
        ).group_by(DiseasePrediction.disease_type).all()
        
        disease_distribution = {}
        for disease, count in disease_stats:
            disease_key = disease or "unknown"
            disease_distribution[disease_key] = count
        
        return {
            "total_analysis": total_analysis,
            "diseases_detected": diseases_detected,
            "accuracy_rate": accuracy_rate,
            "this_month_analysis": this_month_analysis,
            "recent_activities": formatted_activities,
            "disease_distribution": disease_distribution,
            "healthy_plants": disease_distribution.get("nodisease", 0),
            "success_rate": round((disease_distribution.get("nodisease", 0) / total_analysis * 100), 1) if total_analysis > 0 else 0,
            # Thêm thống kê đơn hàng
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "total_spent": total_spent
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving dashboard stats: {str(e)}")
