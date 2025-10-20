#!/usr/bin/env python3
"""
Test script để kiểm tra reactions API
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/community"

def test_reactions():
    """Test reactions endpoints"""
    print("🧪 Testing Reactions API...")
    
    # Test case 1: Kiểm tra bài viết có tồn tại không
    print("\n1. Checking available posts...")
    try:
        response = requests.get(f"{API_URL}/posts")
        if response.status_code == 200:
            posts = response.json()
            if posts['posts']:
                print(f"✅ Found {len(posts['posts'])} posts")
                test_post_id = posts['posts'][0]['id']
                print(f"🎯 Will test with post ID: {test_post_id}")
            else:
                print("❌ No posts found")
                return
        else:
            print(f"❌ Error getting posts: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test case 2: Kiểm tra reactions của post (không cần auth)
    print(f"\n2. Getting reactions for post {test_post_id}...")
    try:
        response = requests.get(f"{API_URL}/posts/{test_post_id}/reactions")
        if response.status_code == 200:
            reactions = response.json()
            print(f"✅ Reactions: {reactions}")
        else:
            print(f"❌ Error getting reactions: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test case 3: Kiểm tra debug auth endpoint
    print("\n3. Testing debug auth endpoint...")
    try:
        response = requests.get(f"{API_URL}/debug/auth")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("🔒 Authentication required (expected for this endpoint)")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test case 4: Tạo test post (cần auth)
    print(f"\n4. Testing create test post endpoint...")
    try:
        response = requests.post(f"{API_URL}/debug/create-test-post")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("🔒 Authentication required (expected)")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_reactions()