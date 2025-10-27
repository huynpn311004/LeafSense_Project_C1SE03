from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class CouponTypeEnum(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    FREE_SHIPPING = "free_shipping"

class CouponStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"

# Base Coupon schemas
class CouponBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    coupon_type: CouponTypeEnum
    value: float
    minimum_order_amount: Optional[float] = 0
    maximum_discount_amount: Optional[float] = None
    total_usage_limit: Optional[int] = None
    usage_limit_per_customer: Optional[int] = 1
    start_date: datetime
    end_date: datetime
    status: Optional[CouponStatusEnum] = CouponStatusEnum.ACTIVE
    is_active: Optional[bool] = True
    
    @validator('value')
    def validate_value(cls, v, values):
        if v <= 0:
            raise ValueError('Giá trị giảm giá phải lớn hơn 0')
        
        coupon_type = values.get('coupon_type')
        if coupon_type == CouponTypeEnum.PERCENTAGE and v > 100:
            raise ValueError('Phần trăm giảm giá không được vượt quá 100%')
        
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        start_date = values.get('start_date')
        if start_date and v <= start_date:
            raise ValueError('Ngày kết thúc phải sau ngày bắt đầu')
        return v

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    coupon_type: Optional[CouponTypeEnum] = None
    value: Optional[float] = None
    minimum_order_amount: Optional[float] = None
    maximum_discount_amount: Optional[float] = None
    total_usage_limit: Optional[int] = None
    usage_limit_per_customer: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[CouponStatusEnum] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: int
    current_usage_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schema cho việc áp dụng coupon
class CouponApplyRequest(BaseModel):
    coupon_code: str
    order_amount: float

class CouponApplyResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: Optional[float] = 0
    final_amount: Optional[float] = None
    coupon: Optional[CouponResponse] = None

# Schema cho coupon usage
class CouponUsageBase(BaseModel):
    coupon_id: int
    user_id: int
    order_id: Optional[int] = None
    discount_amount: float
    order_amount: float

class CouponUsageCreate(CouponUsageBase):
    pass

class CouponUsageResponse(CouponUsageBase):
    id: int
    used_at: datetime
    coupon: Optional[CouponResponse] = None
    
    class Config:
        from_attributes = True

# Schema cho danh sách coupon có thể sử dụng
class AvailableCouponResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    coupon_type: CouponTypeEnum
    value: float
    minimum_order_amount: float
    maximum_discount_amount: Optional[float]
    can_use: bool
    reason: Optional[str] = None  # Lý do không thể sử dụng (nếu có)
    
    class Config:
        from_attributes = True