"""
Script để tạo dữ liệu test cho tính năng kiểm duyệt bài viết
"""
import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from core.database import get_db
from app.models.users import User
from app.models.post import Post
from core.security import get_password_hash

def create_test_data():
    """Tạo dữ liệu test"""
    db = next(get_db())
    
    try:
        # Tạo admin nếu chưa có
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                name="Admin User",
                email="admin@example.com",
                password=get_password_hash("admin123"),
                role="admin",
                status="active",
                provider="email"
            )
            db.add(admin)
            print("✓ Created admin user")
        else:
            print("✓ Admin user already exists")
        
        # Tạo user thường nếu chưa có
        user = db.query(User).filter(User.email == "user@example.com").first()
        if not user:
            user = User(
                name="Test User",
                email="user@example.com",
                password=get_password_hash("user123"),
                role="farmer",
                status="active",
                provider="email"
            )
            db.add(user)
            print("✓ Created test user")
        else:
            print("✓ Test user already exists")
        
        db.commit()
        
        # Tạo một vài bài viết test với trạng thái khác nhau
        test_posts = [
            {
                "title": "Bài viết đã được duyệt",
                "content": "Đây là bài viết đã được admin duyệt và hiển thị công khai",
                "status": "published",
                "user_id": user.id
            },
            {
                "title": "Bài viết chờ duyệt 1",
                "content": "Đây là bài viết đang chờ admin kiểm duyệt",
                "status": "pending",
                "user_id": user.id
            },
            {
                "title": "Bài viết chờ duyệt 2",
                "content": "Đây là bài viết khác cũng đang chờ admin kiểm duyệt",
                "status": "pending",
                "user_id": user.id
            },
            {
                "title": "Bài viết bị từ chối",
                "content": "Đây là bài viết đã bị admin từ chối",
                "status": "rejected",
                "user_id": user.id
            }
        ]
        
        for post_data in test_posts:
            existing_post = db.query(Post).filter(Post.title == post_data["title"]).first()
            if not existing_post:
                post = Post(**post_data)
                db.add(post)
                print(f"✓ Created post: {post_data['title']} (Status: {post_data['status']})")
        
        db.commit()
        print("\n🎉 Test data created successfully!")
        
        # Hiển thị thông tin tài khoản
        print("\n📋 Test Accounts:")
        print("Admin:")
        print("  Email: admin@example.com")
        print("  Password: admin123")
        print("\nUser:")
        print("  Email: user@example.com")
        print("  Password: user123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()