from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class CouponUsage(Base):
    __tablename__ = "coupon_usages"
    
    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    discount_amount = Column(Float, nullable=False)  # Số tiền đã giảm
    order_amount = Column(Float, nullable=False)     # Tổng tiền đơn hàng khi áp dụng
    
    used_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    coupon = relationship("Coupon")
    user = relationship("User")
    order = relationship("Order")