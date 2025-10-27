#!/usr/bin/env python3
"""
Script tạo các mã ưu đãi mẫu cho hệ thống LeafSense
Chạy script này để thêm các mã ưu đãi vào database
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Thêm đường dẫn backend vào Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import engine, get_db
from app.models.coupon import Coupon, CouponTypeEnum, CouponStatusEnum

def create_sample_coupons():
    """Tạo các mã ưu đãi mẫu"""
    
    # Tạo database session
    db = Session(bind=engine)
    
    try:
        # Lấy thời gian hiện tại
        now = datetime.utcnow()
        start_date = now
        end_date = now + timedelta(days=90)  # Hiệu lực 3 tháng
        
        # Danh sách các mã ưu đãi mẫu
        sample_coupons = [
            {
                "code": "LEAFSENSE10",
                "name": "Giảm giá 10% cho đơn hàng đầu tiên",
                "description": "Giảm 10% cho đơn hàng đầu tiên, áp dụng cho đơn hàng từ 100,000 VNĐ",
                "coupon_type": CouponTypeEnum.PERCENTAGE,
                "value": 10.0,
                "minimum_order_amount": 100000,
                "maximum_discount_amount": 50000,  # Giảm tối đa 50k
                "total_usage_limit": 1000,
                "usage_limit_per_customer": 1,
            },
            {
                "code": "WELCOME20",
                "name": "Chào mừng khách hàng mới",
                "description": "Giảm 20% cho khách hàng mới, áp dụng cho đơn hàng từ 200,000 VNĐ",
                "coupon_type": CouponTypeEnum.PERCENTAGE,
                "value": 20.0,
                "minimum_order_amount": 200000,
                "maximum_discount_amount": 100000,  # Giảm tối đa 100k
                "total_usage_limit": 500,
                "usage_limit_per_customer": 1,
            },
            {
                "code": "FIXED50K",
                "name": "Giảm 50,000 VNĐ",
                "description": "Giảm cố định 50,000 VNĐ cho đơn hàng từ 300,000 VNĐ",
                "coupon_type": CouponTypeEnum.FIXED,
                "value": 50000,
                "minimum_order_amount": 300000,
                "maximum_discount_amount": None,
                "total_usage_limit": 200,
                "usage_limit_per_customer": 2,
            },
            {
                "code": "SAVE100K",
                "name": "Tiết kiệm 100,000 VNĐ",
                "description": "Giảm cố định 100,000 VNĐ cho đơn hàng từ 500,000 VNĐ",
                "coupon_type": CouponTypeEnum.FIXED,
                "value": 100000,
                "minimum_order_amount": 500000,
                "maximum_discount_amount": None,
                "total_usage_limit": 100,
                "usage_limit_per_customer": 1,
            },
            {
                "code": "FREESHIP",
                "name": "Miễn phí vận chuyển",
                "description": "Miễn phí vận chuyển cho đơn hàng từ 150,000 VNĐ",
                "coupon_type": CouponTypeEnum.FREE_SHIPPING,
                "value": 30000,  # Giả sử phí ship là 30k
                "minimum_order_amount": 150000,
                "maximum_discount_amount": None,
                "total_usage_limit": 1000,
                "usage_limit_per_customer": 5,
            },
            {
                "code": "SUMMER25",
                "name": "Khuyến mãi mùa hè",
                "description": "Giảm 25% trong mùa hè, áp dụng cho đơn hàng từ 250,000 VNĐ",
                "coupon_type": CouponTypeEnum.PERCENTAGE,
                "value": 25.0,
                "minimum_order_amount": 250000,
                "maximum_discount_amount": 150000,  # Giảm tối đa 150k
                "total_usage_limit": 300,
                "usage_limit_per_customer": 1,
            },
            {
                "code": "LOYAL15",
                "name": "Khách hàng thân thiết",
                "description": "Giảm 15% cho khách hàng thân thiết, không giới hạn đơn hàng tối thiểu",
                "coupon_type": CouponTypeEnum.PERCENTAGE,
                "value": 15.0,
                "minimum_order_amount": 0,
                "maximum_discount_amount": 75000,  # Giảm tối đa 75k
                "total_usage_limit": 500,
                "usage_limit_per_customer": 3,
            },
            {
                "code": "MEGA30",
                "name": "Siêu khuyến mãi 30%",
                "description": "Giảm 30% cho đơn hàng lớn từ 1,000,000 VNĐ",
                "coupon_type": CouponTypeEnum.PERCENTAGE,
                "value": 30.0,
                "minimum_order_amount": 1000000,
                "maximum_discount_amount": 300000,  # Giảm tối đa 300k
                "total_usage_limit": 50,
                "usage_limit_per_customer": 1,
            },
            {
                "code": "FLASH200K",
                "name": "Flash Sale - Giảm 200K",
                "description": "Flash Sale: Giảm 200,000 VNĐ cho đơn hàng từ 800,000 VNĐ",
                "coupon_type": CouponTypeEnum.FIXED,
                "value": 200000,
                "minimum_order_amount": 800000,
                "maximum_discount_amount": None,
                "total_usage_limit": 30,
                "usage_limit_per_customer": 1,
            },
            {
                "code": "WEEKEND12",
                "name": "Khuyến mãi cuối tuần",
                "description": "Giảm 12% cho các đơn hàng cuối tuần từ 180,000 VNĐ",
                "coupon_type": CouponTypeEnum.PERCENTAGE,
                "value": 12.0,
                "minimum_order_amount": 180000,
                "maximum_discount_amount": 60000,  # Giảm tối đa 60k
                "total_usage_limit": 800,
                "usage_limit_per_customer": 2,
            }
        ]
        
        # Tạo các coupon mẫu
        created_count = 0
        for coupon_data in sample_coupons:
            # Kiểm tra xem mã đã tồn tại chưa
            existing_coupon = db.query(Coupon).filter(Coupon.code == coupon_data["code"]).first()
            if existing_coupon:
                print(f"⚠️  Mã '{coupon_data['code']}' đã tồn tại, bỏ qua...")
                continue
            
            # Tạo coupon mới
            new_coupon = Coupon(
                code=coupon_data["code"],
                name=coupon_data["name"],
                description=coupon_data["description"],
                coupon_type=coupon_data["coupon_type"],
                value=coupon_data["value"],
                minimum_order_amount=coupon_data["minimum_order_amount"],
                maximum_discount_amount=coupon_data["maximum_discount_amount"],
                total_usage_limit=coupon_data["total_usage_limit"],
                usage_limit_per_customer=coupon_data["usage_limit_per_customer"],
                current_usage_count=0,
                start_date=start_date,
                end_date=end_date,
                status=CouponStatusEnum.ACTIVE,
                is_active=True
            )
            
            db.add(new_coupon)
            created_count += 1
            print(f"✅ Tạo mã ưu đãi: {coupon_data['code']} - {coupon_data['name']}")
        
        # Commit vào database
        db.commit()
        print(f"\n🎉 Đã tạo thành công {created_count} mã ưu đãi!")
        
        # Hiển thị tổng kết
        total_coupons = db.query(Coupon).count()
        print(f"📊 Tổng số mã ưu đãi trong hệ thống: {total_coupons}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi tạo mã ưu đãi: {str(e)}")
        raise e
    finally:
        db.close()

def list_all_coupons():
    """Hiển thị danh sách tất cả mã ưu đãi"""
    db = Session(bind=engine)
    
    try:
        coupons = db.query(Coupon).all()
        
        if not coupons:
            print("Không có mã ưu đãi nào trong hệ thống.")
            return
        
        print("\n📋 DANH SÁCH MÃ ƯU ĐÃI:")
        print("=" * 80)
        
        for coupon in coupons:
            status_icon = "🟢" if coupon.status == CouponStatusEnum.ACTIVE else "🔴"
            type_icon = {
                CouponTypeEnum.PERCENTAGE: "📊",
                CouponTypeEnum.FIXED: "💰", 
                CouponTypeEnum.FREE_SHIPPING: "🚚"
            }.get(coupon.coupon_type, "❓")
            
            print(f"{status_icon} {type_icon} {coupon.code}")
            print(f"   📝 {coupon.name}")
            print(f"   💵 Giá trị: {coupon.value}{'%' if coupon.coupon_type == CouponTypeEnum.PERCENTAGE else ' VNĐ'}")
            print(f"   📦 Đơn tối thiểu: {coupon.minimum_order_amount:,.0f} VNĐ")
            if coupon.maximum_discount_amount:
                print(f"   🔝 Giảm tối đa: {coupon.maximum_discount_amount:,.0f} VNĐ")
            print(f"   🔢 Sử dụng: {coupon.current_usage_count}/{coupon.total_usage_limit}")
            print(f"   ⏰ Hết hạn: {coupon.end_date.strftime('%d/%m/%Y')}")
            print("-" * 50)
            
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách mã ưu đãi: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 KHỞI TẠO MÃ ƯU ĐÃI CHO LEAFSENSE")
    print("=" * 50)
    
    try:
        # Tạo mã ưu đãi mẫu
        create_sample_coupons()
        
        # Hiển thị danh sách
        list_all_coupons()
        
    except Exception as e:
        print(f"💥 Lỗi: {str(e)}")
        sys.exit(1)