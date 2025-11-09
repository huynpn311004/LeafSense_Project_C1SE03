// Debug script cho chức năng like
// Paste vào browser console để test

const debugLike = async () => {
  console.log('=== DEBUG LIKE FUNCTION ===');
  
  // Check authentication
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  console.log('1. Token exists:', !!token);
  
  if (!token) {
    console.error('❌ No authentication token found');
    return;
  }
  
  // Check if we can access auth endpoint
  try {
    const authResponse = await fetch('http://localhost:8000/api/community/debug/auth', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('2. ✅ Authentication successful:', authData);
    } else {
      console.error('❌ Authentication failed:', authResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Auth request failed:', error);
    return;
  }
  
  // Check if we can get posts
  try {
    const postsResponse = await fetch('http://localhost:8000/api/community/posts');
    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      console.log('3. ✅ Posts loaded:', postsData.posts?.length, 'posts');
      
      if (postsData.posts?.length > 0) {
        const firstPost = postsData.posts[0];
        console.log('First post ID:', firstPost.id);
        
        // Test like toggle
        try {
          const likeResponse = await fetch(`http://localhost:8000/api/community/posts/${firstPost.id}/reactions?reaction_type=like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            console.log('4. ✅ Like toggle successful:', likeData);
          } else {
            console.error('❌ Like toggle failed:', likeResponse.status, await likeResponse.text());
          }
        } catch (error) {
          console.error('❌ Like request failed:', error);
        }
      }
    } else {
      console.error('❌ Failed to load posts:', postsResponse.status);
    }
  } catch (error) {
    console.error('❌ Posts request failed:', error);
  }
};

// Auto run
debugLike();