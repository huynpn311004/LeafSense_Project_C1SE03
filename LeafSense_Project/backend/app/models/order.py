from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPING = "shipping"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentMethod(str, enum.Enum):
    COD = "COD"
    MOMO = "MoMo"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    original_amount = Column(DECIMAL(10, 2), nullable=True)  # Số tiền gốc trước khi giảm
    discount_amount = Column(DECIMAL(10, 2), default=0)  # Số tiền được giảm
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=True)  # Mã giảm giá áp dụng
    coupon_code = Column(String(50), nullable=True)  # Backup mã coupon
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.COD)
    shipping_name = Column(String(100))
    shipping_phone = Column(String(20))
    shipping_address = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
  # Relationships
    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    coupon = relationship("Coupon", backref="orders")
