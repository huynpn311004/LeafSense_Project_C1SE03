from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, Text
from sqlalchemy.sql import func
from core.database import Base
import enum

class CouponTypeEnum(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    FREE_SHIPPING = "free_shipping"

class CouponStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"

class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Loại giảm giá
    coupon_type = Column(Enum(CouponTypeEnum), nullable=False)
    value = Column(Float, nullable=False)  # Giá trị giảm (phần trăm hoặc số tiền cố định)
    
    # Điều kiện áp dụng
    minimum_order_amount = Column(Float, default=0)  # Số tiền tối thiểu để áp dụng
    maximum_discount_amount = Column(Float)  # Số tiền giảm tối đa (cho loại percentage)
    
    # Số lượng và sử dụng
    total_usage_limit = Column(Integer)  # Tổng số lần có thể sử dụng
    usage_limit_per_customer = Column(Integer, default=1)  # Số lần mỗi khách hàng có thể sử dụng
    current_usage_count = Column(Integer, default=0)  # Số lần đã được sử dụng
    
    # Thời gian hiệu lực
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Trạng thái
    status = Column(Enum(CouponStatusEnum), default=CouponStatusEnum.ACTIVE)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def is_valid(self):
        """Kiểm tra coupon có còn hiệu lực không"""
        from datetime import datetime
        
        if not self.is_active or self.status != CouponStatusEnum.ACTIVE:
            return False, "Mã giảm giá không khả dụng"
            
        now = datetime.utcnow()
        if now < self.start_date:
            return False, "Mã giảm giá chưa có hiệu lực"
            
        if now > self.end_date:
            return False, "Mã giảm giá đã hết hạn"
            
        if self.total_usage_limit and self.current_usage_count >= self.total_usage_limit:
            return False, "Mã giảm giá đã được sử dụng hết"
            
        return True, "Hợp lệ"
    
    def calculate_discount(self, order_amount: float) -> dict:
        """Tính toán số tiền giảm giá"""
        if order_amount < self.minimum_order_amount:
            return {
                "can_apply": False,
                "reason": f"Đơn hàng tối thiểu ${self.minimum_order_amount}",
                "discount_amount": 0
            }
        
        if self.coupon_type == CouponTypeEnum.PERCENTAGE:
            discount = order_amount * (self.value / 100)
            if self.maximum_discount_amount:
                discount = min(discount, self.maximum_discount_amount)
        elif self.coupon_type == CouponTypeEnum.FIXED:
            discount = min(self.value, order_amount)
        elif self.coupon_type == CouponTypeEnum.FREE_SHIPPING:
            discount = self.value  # Giá trị shipping fee
        else:
            discount = 0
        
        return {
            "can_apply": True,
            "discount_amount": round(discount, 2),
            "final_amount": round(order_amount - discount, 2)
        }