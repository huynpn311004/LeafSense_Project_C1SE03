from pydantic import BaseModel, EmailStr
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

# Admin Authentication Schemas
class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Management Schemas
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    role: str
    status: str
    provider: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Management Schemas
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int = 0
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: Decimal
    stock: int
    image_url: Optional[str]
    category_id: Optional[int]
    
    class Config:
        from_attributes = True

# Category Management Schemas
class CategoryCreate(BaseModel):
    name: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

# Order Management Schemas
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: Decimal
    
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: Decimal
    status: str
    payment_method: str
    shipping_name: str
    shipping_phone: str
    shipping_address: str
    created_at: datetime
    order_items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True

class OrderUpdate(BaseModel):
    status: Optional[str] = None

# Dashboard Statistics
class DashboardStats(BaseModel):
    total_users: int
    total_products: int
    total_orders: int
    total_revenue: Decimal
    pending_orders: int
    active_users: int
