/**
 * Test authentication flow để debug
 */

// Test 1: Kiểm tra token trong localStorage
console.log("=== AUTHENTICATION DEBUG ===");

const token1 = localStorage.getItem('token');
const token2 = localStorage.getItem('access_token');
const user = localStorage.getItem('user');

console.log("Token (key: 'token'):", token1 ? "EXISTS" : "NOT FOUND");
console.log("Token (key: 'access_token'):", token2 ? "EXISTS" : "NOT FOUND");
console.log("User:", user ? "EXISTS" : "NOT FOUND");

// Test 2: Thử gọi API với token hiện tại
const testAuth = async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  
  if (!token) {
    console.log("❌ No token found - User needs to login");
    return;
  }

  try {
    console.log("🔄 Testing API call with token...");
    
    const response = await fetch('http://localhost:8000/api/community/posts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status:", response.status);
    
    if (response.status === 401) {
      console.log("❌ Token is invalid or expired");
      console.log("💡 User needs to login again");
    } else if (response.ok) {
      console.log("✅ Token is valid");
      const data = await response.json();
      console.log("Posts count:", data.posts?.length || 0);
    } else {
      console.log("⚠️ Other error:", response.statusText);
    }
    
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }
};

// Test 3: Login function
const testLogin = async () => {
  const email = prompt("Enter email for testing (hoặc Cancel để skip):");
  if (!email) return;
  
  const password = prompt("Enter password:");
  if (!password) return;

  try {
    console.log("🔄 Testing login...");
    
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Login successful");
      console.log("Token received:", data.access_token ? "YES" : "NO");
      
      // Lưu token (test cả 2 cách)
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('access_token', data.access_token);
      
      console.log("💾 Token saved to localStorage");
      
    } else {
      const error = await response.text();
      console.log("❌ Login failed:", error);
    }
    
  } catch (error) {
    console.log("❌ Login error:", error.message);
  }
};

// Chạy tests
testAuth();

console.log("\n=== ACTIONS ===");
console.log("Để test login, chạy: testLogin()");
console.log("Để test lại auth, chạy: testAuth()");

// Make functions available globally
window.testLogin = testLogin;
window.testAuth = testAuth;