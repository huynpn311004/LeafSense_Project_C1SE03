from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPING = "shipping"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    COD = "COD"
    MOMO = "MoMo"

# Category Schemas
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int = 0
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    disease_type: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    disease_type: Optional[str] = None

class Product(ProductBase):
    id: int
    category: Optional[Category] = None
    
    class Config:
        from_attributes = True

# Cart Schemas
class CartItemBase(BaseModel):
    product_id: int
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int

class CartItem(CartItemBase):
    id: int
    product: Product
    
    class Config:
        from_attributes = True

class Cart(BaseModel):
    id: int
    user_id: int
    cart_items: List[CartItem] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    product: Product
    
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    total_amount: Decimal
    payment_method: PaymentMethod = PaymentMethod.COD
    shipping_name: str
    shipping_phone: str
    shipping_address: str

class OrderCreate(OrderBase):
    order_items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_method: Optional[PaymentMethod] = None
    shipping_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_address: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    order_items: List[OrderItem] = []
    created_at: datetime
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Review Schemas
class ReviewBase(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None

class Review(ReviewBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Recommendation Schema
class ProductRecommendation(BaseModel):
    disease_type: str
    products: List[Product]
    
    class Config:
        from_attributes = True
