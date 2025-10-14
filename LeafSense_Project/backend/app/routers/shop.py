from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from core.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.cart import Cart
from app.models.cart_item import CartItem as CartItemModel
from app.models.order import Order
from app.models.order_item import OrderItem as OrderItemModel
from app.models.review import Review
from app.models.user import User
from app.schemas.shop_schema import (
    ProductCreate, ProductUpdate, Product as ProductSchema,
    CategoryCreate, Category as CategorySchema,
    CartItemCreate, CartItemUpdate, Cart as CartSchema,
    OrderCreate, OrderUpdate, Order as OrderSchema,
    ReviewCreate, ReviewUpdate, Review as ReviewSchema,
    ProductRecommendation,
    CartItem as CartItemSchema,
)

router = APIRouter()

# ==================== PRODUCT ENDPOINTS ====================

@router.get("/products", response_model=List[ProductSchema])
def get_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    disease_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of products with optional filtering"""
    query = db.query(Product)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        query = query.filter(Product.name.contains(search))
    
    if disease_type:
        query = query.filter(Product.disease_type == disease_type)
    
    return query.offset(skip).limit(limit).all()

@router.get("/products/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/products", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create new product (Admin only)"""
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int, 
    product_update: ProductUpdate, 
    db: Session = Depends(get_db)
):
    """Update product (Admin only)"""
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
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete product (Admin only)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

# ==================== CATEGORY ENDPOINTS ====================

@router.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    return db.query(Category).all()

@router.post("/categories", response_model=CategorySchema)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create new category (Admin only)"""
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# ==================== CART ENDPOINTS ====================

@router.get("/cart", response_model=CartSchema)
def get_cart(user_id: int, db: Session = Depends(get_db)):
    """Get user's cart"""
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        # Create cart if it doesn't exist
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

@router.post("/cart/items", response_model=CartItemSchema)
def add_to_cart(
    user_id: int,
    cart_item: CartItemCreate,
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    # Get or create cart
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Check if item already exists in cart
    existing_item = db.query(CartItemModel).filter(
        CartItemModel.cart_id == cart.id,
        CartItemModel.product_id == cart_item.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += cart_item.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    else:
        new_item = CartItemModel(
            cart_id=cart.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

@router.put("/cart/items/{item_id}", response_model=CartItemSchema)
def update_cart_item(
    item_id: int,
    cart_item_update: CartItemUpdate,
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    cart_item = db.query(CartItemModel).filter(CartItemModel.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    cart_item.quantity = cart_item_update.quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item

@router.delete("/cart/items/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    """Remove item from cart"""
    cart_item = db.query(CartItemModel).filter(CartItemModel.id == item_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}

@router.delete("/cart")
def clear_cart(user_id: int, db: Session = Depends(get_db)):
    """Clear user's cart"""
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if cart:
        db.query(CartItemModel).filter(CartItemModel.cart_id == cart.id).delete()
        db.commit()
    return {"message": "Cart cleared"}

# ==================== ORDER ENDPOINTS ====================

@router.post("/orders", response_model=OrderSchema)
def create_order(user_id: int, order: OrderCreate, db: Session = Depends(get_db)):
    """Create new order"""
    # Calculate total amount
    total_amount = sum(item.price * item.quantity for item in order.order_items)
    
    # Create order
    db_order = Order(
        user_id=user_id,
        total_amount=total_amount,
        payment_method=order.payment_method,
        shipping_name=order.shipping_name,
        shipping_phone=order.shipping_phone,
        shipping_address=order.shipping_address
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Create order items
    for item in order.order_items:
        order_item = OrderItemModel(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price
        )
        db.add(order_item)
    
    # Clear user's cart after order creation
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if cart:
        db.query(CartItemModel).filter(CartItemModel.cart_id == cart.id).delete()
    
    db.commit()
    return db_order

@router.get("/orders", response_model=List[OrderSchema])
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    """Get user's orders"""
    return db.query(Order).filter(Order.user_id == user_id).all()

@router.get("/orders/{order_id}", response_model=OrderSchema)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order details"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{order_id}", response_model=OrderSchema)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db)
):
    """Update order (Admin only)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    return order

# ==================== REVIEW ENDPOINTS ====================

@router.post("/reviews", response_model=ReviewSchema)
def create_review(user_id: int, review: ReviewCreate, db: Session = Depends(get_db)):
    """Create product review"""
    db_review = Review(
        user_id=user_id,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/products/{product_id}/reviews", response_model=List[ReviewSchema])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Get product reviews"""
    return db.query(Review).filter(Review.product_id == product_id).all()

@router.put("/reviews/{review_id}", response_model=ReviewSchema)
def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    db: Session = Depends(get_db)
):
    """Update review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    update_data = review_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    db.commit()
    db.refresh(review)
    return review

@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    """Delete review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}

# ==================== RECOMMENDATION ENDPOINTS ====================

@router.get("/shop/recommendations", response_model=List[ProductSchema])
def get_product_recommendations(
    disease: str = Query(..., description="Disease type to get recommendations for"),
    db: Session = Depends(get_db)
):
    """Get product recommendations based on disease type"""
    products = db.query(Product).filter(Product.disease_type == disease).all()
    return products
