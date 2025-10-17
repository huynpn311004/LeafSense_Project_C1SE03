from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from decimal import Decimal

from core.database import get_db
from core.security import get_current_user, verify_password, get_password_hash
from app.models.users import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.admin_schema import (
    AdminLogin, AdminResponse, UserUpdate, UserResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    OrderResponse, OrderUpdate, DashboardStats
)
from app.schemas.user_schema import ChangePassword

router = APIRouter(prefix="/admin", tags=["Admin"])

# ==================== ADMIN AUTHENTICATION ====================

def get_admin_user(current_user: User = Depends(get_current_user)):
    """Kiểm tra user có phải admin không"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required."
        )
    return current_user

@router.post("/login", response_model=dict)
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    """Admin login"""
    admin = db.query(User).filter(
        User.email == login_data.email,
        User.role == "admin"
    ).first()
    
    if not admin or not verify_password(login_data.password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    if admin.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )
    
    from core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": admin
    }

@router.get("/profile", response_model=AdminResponse)
def get_admin_profile(admin: User = Depends(get_admin_user)):
    """Lấy thông tin admin profile"""
    return admin

# ==================== ADMIN SETTINGS ====================

@router.put("/profile", response_model=AdminResponse)
def update_admin_profile(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    address: str = Form(None),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin profile admin"""

    # Cập nhật thông tin cơ bản
    admin.name = name
    admin.email = email
    admin.phone = phone
    admin.address = address

    try:
        db.commit()
        db.refresh(admin)
        return admin
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.put("/change-password")
def change_admin_password(
    password_data: ChangePassword,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu admin"""

    # Kiểm tra xem admin có phải đăng nhập bằng Google không
    if admin.provider == "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể thay đổi mật khẩu cho tài khoản đăng nhập bằng Google"
        )

    # Kiểm tra mật khẩu cũ
    if not verify_password(password_data.old_password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    try:
        # Hash và cập nhật mật khẩu
        hashed_password = get_password_hash(password_data.new_password)
        admin.password = hashed_password

        db.commit()
        db.refresh(admin)
        return {"message": "Admin password changed successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER MANAGEMENT ====================

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách tất cả users"""
    query = db.query(User).filter(User.role == "farmer")
    
    if search:
        query = query.filter(User.name.contains(search) | User.email.contains(search))
    
    if status_filter:
        query = query.filter(User.status == status_filter)
    
    return query.offset(skip).limit(limit).all()

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Lấy thông tin chi tiết user"""
    user = db.query(User).filter(User.id == user_id, User.role == "farmer").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin user"""
    user = db.query(User).filter(User.id == user_id, User.role == "farmer").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Khóa/mở khóa user"""
    user = db.query(User).filter(User.id == user_id, User.role == "farmer").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = "inactive" if user.status == "active" else "active"
    db.commit()
    
    action = "khóa" if user.status == "inactive" else "mở khóa"
    return {"message": f"Đã {action} tài khoản user thành công", "status": user.status}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Xóa user"""
    user = db.query(User).filter(User.id == user_id, User.role == "farmer").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# ==================== PRODUCT MANAGEMENT ====================

@router.get("/products", response_model=List[ProductResponse])
def get_all_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách tất cả products"""
    query = db.query(Product)
    
    if search:
        query = query.filter(Product.name.contains(search))
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    return query.offset(skip).limit(limit).all()

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Lấy thông tin chi tiết product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Tạo product mới"""
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cập nhật product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Xóa product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

# ==================== CATEGORY MANAGEMENT ====================

@router.get("/categories", response_model=List[CategoryResponse])
def get_all_categories(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Lấy danh sách tất cả categories"""
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Tạo category mới"""
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cập nhật category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return category

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Xóa category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Kiểm tra xem có products nào đang sử dụng category này không
    products_count = db.query(Product).filter(Product.category_id == category_id).count()
    if products_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. {products_count} products are using this category."
        )
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

# ==================== ORDER MANAGEMENT ====================

@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách tất cả orders"""
    query = db.query(Order)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    return query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Lấy thông tin chi tiết order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cập nhật trạng thái order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    return order

# ==================== DASHBOARD STATISTICS ====================

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Lấy thống kê dashboard"""
    total_users = db.query(User).filter(User.role == "farmer").count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    
    # Tính tổng doanh thu
    total_revenue_result = db.query(func.sum(Order.total_amount)).filter(
        Order.status.in_(["completed", "delivered"])
    ).scalar()
    total_revenue = total_revenue_result or Decimal('0')
    
    # Đơn hàng chờ xử lý
    pending_orders = db.query(Order).filter(Order.status == "pending").count()
    
    # Users đang hoạt động
    active_users = db.query(User).filter(
        User.role == "farmer",
        User.status == "active"
    ).count()
    
    return DashboardStats(
        total_users=total_users,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        pending_orders=pending_orders,
        active_users=active_users
    )
