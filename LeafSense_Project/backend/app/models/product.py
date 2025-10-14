from sqlalchemy import Column, Integer, String, Text, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String(255))
    category_id = Column(Integer, ForeignKey("categories.id"))
    disease_type = Column(String(50))  # For disease-based recommendations
    
    # Relationships
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product")
