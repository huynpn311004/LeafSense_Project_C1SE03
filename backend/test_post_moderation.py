"""
Test script để kiểm tra tính năng kiểm duyệt bài viết
"""
import requests
import json

# Cấu hình
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"
USER_EMAIL = "user@example.com"
USER_PASSWORD = "user123"

def test_admin_login():
    """Test đăng nhập admin"""
    print("=== Test Admin Login ===")
    response = requests.post(f"{BASE_URL}/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✓ Admin login successful")
        return token
    else:
        print(f"✗ Admin login failed: {response.text}")
        return None

def test_user_login():
    """Test đăng nhập user"""
    print("=== Test User Login ===")
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✓ User login successful")
        return token
    else:
        print(f"✗ User login failed: {response.text}")
        return None

def test_create_post(user_token):
    """Test tạo bài viết mới (sẽ có status pending)"""
    print("=== Test Create Post ===")
    
    data = {
        "title": "Bài viết test kiểm duyệt",
        "content": "Đây là bài viết để test tính năng kiểm duyệt của admin"
    }
    
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.post(f"{BASE_URL}/api/community/posts", 
                           data=data, headers=headers)
    
    if response.status_code == 201:
        post = response.json()
        print(f"✓ Post created with ID: {post['id']}, Status: {post['status']}")
        return post["id"]
    else:
        print(f"✗ Create post failed: {response.text}")
        return None

def test_get_posts_public():
    """Test lấy bài viết công khai (chỉ published)"""
    print("=== Test Get Public Posts ===")
    
    response = requests.get(f"{BASE_URL}/api/community/posts")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Found {data['total']} public posts")
        for post in data["posts"]:
            print(f"  - {post['title']} (Status: {post['status']})")
    else:
        print(f"✗ Get posts failed: {response.text}")

def test_get_my_posts(user_token):
    """Test lấy bài viết của user (bao gồm pending)"""
    print("=== Test Get My Posts ===")
    
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/api/community/my-posts", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Found {data['total']} posts in my posts")
        for post in data["posts"]:
            print(f"  - {post['title']} (Status: {post['status']} - {post.get('status_description', 'N/A')})")
    else:
        print(f"✗ Get my posts failed: {response.text}")

def test_admin_get_pending_posts(admin_token):
    """Test admin lấy bài viết chờ duyệt"""
    print("=== Test Admin Get Pending Posts ===")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/admin/posts/pending", headers=headers)
    
    if response.status_code == 200:
        posts = response.json()
        print(f"✓ Found {len(posts)} pending posts")
        for post in posts:
            print(f"  - {post['title']} by {post['user']['name']} (ID: {post['id']})")
        return posts
    else:
        print(f"✗ Get pending posts failed: {response.text}")
        return []

def test_admin_approve_post(admin_token, post_id):
    """Test admin phê duyệt bài viết"""
    print(f"=== Test Admin Approve Post {post_id} ===")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.put(f"{BASE_URL}/admin/posts/{post_id}/approve", headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Post approved: {result['message']}")
    else:
        print(f"✗ Approve post failed: {response.text}")

def test_admin_reject_post(admin_token, post_id):
    """Test admin từ chối bài viết"""
    print(f"=== Test Admin Reject Post {post_id} ===")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    data = {
        "status": "rejected",
        "rejection_reason": "Nội dung không phù hợp với quy định cộng đồng"
    }
    response = requests.put(f"{BASE_URL}/admin/posts/{post_id}/reject", 
                           json=data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Post rejected: {result['message']}")
    else:
        print(f"✗ Reject post failed: {response.text}")

def test_admin_get_stats(admin_token):
    """Test admin lấy thống kê kiểm duyệt"""
    print("=== Test Admin Get Post Stats ===")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/admin/posts/stats", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✓ Post moderation stats:")
        print(f"  - Pending: {stats['total_pending']}")
        print(f"  - Published: {stats['total_published']}")
        print(f"  - Rejected: {stats['total_rejected']}")
        print(f"  - Recent pending: {len(stats['recent_posts'])}")
    else:
        print(f"✗ Get stats failed: {response.text}")

def main():
    """Chạy tất cả test"""
    print("🚀 Starting Post Moderation Tests...\n")
    
    # Test login
    admin_token = test_admin_login()
    user_token = test_user_login()
    
    if not admin_token or not user_token:
        print("❌ Cannot proceed without tokens")
        return
    
    print("\n" + "="*50 + "\n")
    
    # Test tạo bài viết
    post_id = test_create_post(user_token)
    
    print("\n" + "="*50 + "\n")
    
    # Test xem bài viết công khai (không có bài mới)
    test_get_posts_public()
    
    print("\n" + "="*50 + "\n")
    
    # Test xem bài viết của user (có bài pending)
    test_get_my_posts(user_token)
    
    print("\n" + "="*50 + "\n")
    
    # Test admin xem bài chờ duyệt
    pending_posts = test_admin_get_pending_posts(admin_token)
    
    print("\n" + "="*50 + "\n")
    
    # Test admin xem thống kê
    test_admin_get_stats(admin_token)
    
    if post_id:
        print("\n" + "="*50 + "\n")
        
        # Test phê duyệt bài viết
        test_admin_approve_post(admin_token, post_id)
        
        print("\n" + "="*50 + "\n")
        
        # Test xem bài viết công khai sau khi duyệt
        print("=== After Approval ===")
        test_get_posts_public()
    
    print("\n🎉 Tests completed!")

if __name__ == "__main__":
    main()