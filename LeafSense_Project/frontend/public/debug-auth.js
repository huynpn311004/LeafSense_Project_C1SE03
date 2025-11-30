/**
 * Debug script để test authentication cho reactions
 */

// Function để test auth
const testAuth = async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  
  console.log('=== DEBUG AUTH ===');
  console.log('Token:', token ? 'EXISTS' : 'MISSING');
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');
  
  if (!token) {
    console.error('❌ No token found in localStorage');
    return;
  }
  
  try {
    // Test debug auth endpoint
    const response = await fetch('http://localhost:8000/api/community/debug/auth', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auth successful:', data);
    } else {
      console.error('❌ Auth failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
};

// Function để test toggle reaction
const testToggleReaction = async (postId = 1) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  
  console.log('=== DEBUG TOGGLE REACTION ===');
  console.log('Testing post ID:', postId);
  
  if (!token) {
    console.error('❌ No token found');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:8000/api/community/posts/${postId}/reactions?reaction_type=like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Toggle reaction successful:', data);
    } else {
      console.error('❌ Toggle reaction failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
};

// Export để có thể dùng trong console
window.debugAuth = testAuth;
window.debugToggleReaction = testToggleReaction;

console.log('Debug functions loaded. Use:');
console.log('- debugAuth() to test authentication');
console.log('- debugToggleReaction(postId) to test reaction toggle');