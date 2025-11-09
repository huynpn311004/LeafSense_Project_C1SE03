"""
Migration script to update User table with account locking functionality
Chạy script này để cập nhật cơ sở dữ liệu hiện tại
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    # Lấy database URL từ environment variables
    database_url = os.getenv("DATABASE_URL", "sqlite:///./leafsense.db")
    
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Kiểm tra xem bảng users có tồn tại không
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='users';
            """))
            
            if result.fetchone():
                print("✅ Bảng users đã tồn tại")
                
                # Kiểm tra xem cột status đã tồn tại chưa
                result = conn.execute(text("PRAGMA table_info(users)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'status' in columns:
                    print("✅ Cột status đã tồn tại")
                    print("✅ Tính năng khóa tài khoản sử dụng cột status hiện có")
                    print("   - 'active': Tài khoản hoạt động")
                    print("   - 'inactive': Tài khoản bị khóa")
                else:
                    print("❌ Cột status không tồn tại, cần tạo mới")
                    return False
                    
            else:
                print("❌ Bảng users không tồn tại")
                return False
                
            # Hiển thị thống kê users hiện tại
            result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users
                FROM users 
                WHERE role = 'farmer'
            """))
            
            stats = result.fetchone()
            if stats:
                print(f"\n📊 Thống kê tài khoản người dùng:")
                print(f"   - Tổng số: {stats[0]}")
                print(f"   - Đang hoạt động: {stats[1]}")
                print(f"   - Đã bị khóa: {stats[2]}")
            
        print("\n✅ Migration completed successfully!")
        print("\n🔧 Hướng dẫn sử dụng:")
        print("1. Admin có thể khóa tài khoản user bằng cách thay đổi status từ 'active' sang 'inactive'")
        print("2. Khi user bị khóa đăng nhập sẽ hiển thị thông báo và chuyển đến trang /account-locked")
        print("3. User cần liên hệ email leafsensehotro@gmail.com.vn để được mở khóa")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi migration: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Bắt đầu migration cho tính năng khóa tài khoản...")
    run_migration()