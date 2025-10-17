from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db
from core.security import get_current_user, get_optional_current_user
from app.models.users import User
from app.models.coupon import Coupon, CouponStatusEnum
from app.models.coupon_usage import CouponUsage
from app.schemas.coupon_schema import (
    CouponCreate, CouponUpdate, CouponResponse, 
    CouponApplyRequest, CouponApplyResponse,
    AvailableCouponResponse, CouponUsageResponse
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])

# ==================== PUBLIC ENDPOINTS ====================

@router.post("/validate", response_model=CouponApplyResponse)
def validate_coupon(
    request: CouponApplyRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Validate coupon code and calculate discount (public endpoint)"""
    
    # Tìm coupon theo code
    coupon = db.query(Coupon).filter(
        Coupon.code.ilike(request.coupon_code.strip()),
        Coupon.is_active == True
    ).first()
    
    if not coupon:
        return CouponApplyResponse(
            valid=False,
            message="Mã giảm giá không tồn tại"
        )
    
    # Kiểm tra tính hợp lệ
    is_valid, reason = coupon.is_valid()
    if not is_valid:
        return CouponApplyResponse(
            valid=False,
            message=reason
        )
    
    # Kiểm tra giới hạn sử dụng per user (nếu user đã đăng nhập)
    if current_user:
        user_usage_count = db.query(CouponUsage).filter(
            CouponUsage.coupon_id == coupon.id,
            CouponUsage.user_id == current_user.id
        ).count()
        
        if user_usage_count >= coupon.usage_limit_per_customer:
            return CouponApplyResponse(
                valid=False,
                message=f"Bạn đã sử dụng hết lượt áp dụng mã này (tối đa {coupon.usage_limit_per_customer} lần)"
            )
    
    # Tính toán discount
    discount_info = coupon.calculate_discount(request.order_amount)
    
    if not discount_info["can_apply"]:
        return CouponApplyResponse(
            valid=False,
            message=discount_info["reason"]
        )
    
    return CouponApplyResponse(
        valid=True,
        message="Áp dụng mã giảm giá thành công",
        discount_amount=discount_info["discount_amount"],
        final_amount=discount_info["final_amount"],
        coupon=CouponResponse.from_orm(coupon)
    )

@router.get("/available", response_model=List[AvailableCouponResponse])
def get_available_coupons(
    order_amount: Optional[float] = Query(None, description="Số tiền đơn hàng để kiểm tra tính khả dụng"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get list of available coupons"""
    
    # Lấy tất cả coupon đang hoạt động
    coupons = db.query(Coupon).filter(
        Coupon.is_active == True,
        Coupon.status == CouponStatusEnum.ACTIVE,
        Coupon.start_date <= datetime.utcnow(),
        Coupon.end_date >= datetime.utcnow()
    ).all()
    
    result = []
    for coupon in coupons:
        # Kiểm tra user có thể sử dụng không
        can_use = True
        reason = None
        
        # Kiểm tra total usage limit
        if coupon.total_usage_limit and coupon.current_usage_count >= coupon.total_usage_limit:
            can_use = False
            reason = "Mã giảm giá đã được sử dụng hết"
        
        # Kiểm tra user usage limit (nếu user đã đăng nhập)
        elif current_user:
            user_usage_count = db.query(CouponUsage).filter(
                CouponUsage.coupon_id == coupon.id,
                CouponUsage.user_id == current_user.id
            ).count()
            
            if user_usage_count >= coupon.usage_limit_per_customer:
                can_use = False
                reason = f"Bạn đã sử dụng hết lượt áp dụng mã này"
        
        # Kiểm tra minimum order amount (nếu có order_amount)
        elif order_amount is not None and order_amount < coupon.minimum_order_amount:
            can_use = False
            reason = f"Đơn hàng tối thiểu ${coupon.minimum_order_amount}"
        
        result.append(AvailableCouponResponse(
            id=coupon.id,
            code=coupon.code,
            name=coupon.name,
            description=coupon.description,
            coupon_type=coupon.coupon_type,
            value=coupon.value,
            minimum_order_amount=coupon.minimum_order_amount,
            maximum_discount_amount=coupon.maximum_discount_amount,
            can_use=can_use,
            reason=reason
        ))
    
    return result

# ==================== USER ENDPOINTS ====================

@router.post("/apply/{coupon_id}")
def apply_coupon(
    coupon_id: int,
    order_amount: float,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply coupon to user's order (requires authentication)"""
    
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Validate coupon
    is_valid, reason = coupon.is_valid()
    if not is_valid:
        raise HTTPException(status_code=400, detail=reason)
    
    # Check user usage limit
    user_usage_count = db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon.id,
        CouponUsage.user_id == current_user.id
    ).count()
    
    if user_usage_count >= coupon.usage_limit_per_customer:
        raise HTTPException(
            status_code=400, 
            detail=f"Bạn đã sử dụng hết lượt áp dụng mã này (tối đa {coupon.usage_limit_per_customer} lần)"
        )
    
    # Calculate discount
    discount_info = coupon.calculate_discount(order_amount)
    if not discount_info["can_apply"]:
        raise HTTPException(status_code=400, detail=discount_info["reason"])
    
    # Create usage record
    usage = CouponUsage(
        coupon_id=coupon.id,
        user_id=current_user.id,
        order_id=order_id,
        discount_amount=discount_info["discount_amount"],
        order_amount=order_amount
    )
    
    db.add(usage)
    
    # Update coupon usage count
    coupon.current_usage_count += 1
    
    db.commit()
    db.refresh(usage)
    
    return {
        "message": "Áp dụng mã giảm giá thành công",
        "usage_id": usage.id,
        "discount_amount": discount_info["discount_amount"],
        "final_amount": discount_info["final_amount"]
    }

@router.get("/my-usage", response_model=List[CouponUsageResponse])
def get_my_coupon_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's coupon usage history"""
    
    usages = db.query(CouponUsage).filter(
        CouponUsage.user_id == current_user.id
    ).order_by(CouponUsage.used_at.desc()).all()
    
    return usages

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/all", response_model=List[CouponResponse])
def get_all_coupons_admin(
    skip: int = 0,
    limit: int = 100,
    status: Optional[CouponStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all coupons (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Coupon)
    
    if status:
        query = query.filter(Coupon.status == status)
    
    coupons = query.offset(skip).limit(limit).all()
    return coupons

@router.get("/admin/stats")
def get_coupon_stats_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get coupon statistics (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from sqlalchemy import func
    
    # Basic stats
    total_coupons = db.query(Coupon).count()
    active_coupons = db.query(Coupon).filter(
        Coupon.status == CouponStatusEnum.ACTIVE,
        Coupon.is_active == True
    ).count()
    
    # Usage stats
    total_usage = db.query(func.sum(Coupon.current_usage_count)).scalar() or 0
    
    # Discount given (sum from usage table)
    total_discount_given = db.query(func.sum(CouponUsage.discount_amount)).scalar() or 0
    
    # Top used coupons
    top_coupons = db.query(Coupon).order_by(Coupon.current_usage_count.desc()).limit(5).all()
    
    # Recent activity (last 30 days)
    from datetime import datetime, timedelta
    recent_date = datetime.utcnow() - timedelta(days=30)
    recent_usage = db.query(CouponUsage).filter(CouponUsage.used_at >= recent_date).count()
    
    return {
        "total_coupons": total_coupons,
        "active_coupons": active_coupons,
        "total_usage": total_usage,
        "total_discount_given": float(total_discount_given),
        "recent_usage": recent_usage,
        "top_coupons": [
            {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "usage_count": c.current_usage_count
            } for c in top_coupons
        ]
    }

@router.get("/admin/{coupon_id}/usage", response_model=List[CouponUsageResponse])
def get_coupon_usage_admin(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage history for a specific coupon (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    usages = db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon_id
    ).order_by(CouponUsage.used_at.desc()).all()
    
    return usages

@router.post("/admin/create", response_model=CouponResponse)
def create_coupon_admin(
    coupon: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new coupon (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if code already exists
    existing_coupon = db.query(Coupon).filter(Coupon.code.ilike(coupon.code)).first()
    if existing_coupon:
        raise HTTPException(status_code=400, detail="Mã giảm giá đã tồn tại")
    
    db_coupon = Coupon(**coupon.dict())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    
    return db_coupon

@router.put("/admin/{coupon_id}", response_model=CouponResponse)
def update_coupon_admin(
    coupon_id: int,
    coupon_update: CouponUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update coupon (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = coupon_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(coupon, field, value)
    
    db.commit()
    db.refresh(coupon)
    
    return coupon

@router.delete("/admin/{coupon_id}")
def delete_coupon_admin(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete coupon (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Soft delete - just deactivate
    coupon.is_active = False
    coupon.status = CouponStatusEnum.INACTIVE
    
    db.commit()
    
    return {"message": "Coupon deleted successfully"}