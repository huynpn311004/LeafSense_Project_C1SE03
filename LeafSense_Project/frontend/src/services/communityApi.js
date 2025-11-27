/**
 * Community API Service
 * Xử lý tất cả API calls liên quan đến cộng đồng
 */

const API_BASE_URL = 'http://localhost:8000/api/community';

// Helper function để lấy auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (!token) {
    console.warn('No auth token found in localStorage');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function để lấy auth header không có Content-Type
const getAuthHeadersOnly = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (!token) {
    console.warn('No auth token found in localStorage');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// Helper function để xử lý response
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * POSTS API
 */
export const communityApi = {
  // Lấy danh sách bài viết
  getPosts: async (params = {}) => {
    const { skip = 0, limit = 10, search = '', status = '', user_id = '' } = params;
    
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(user_id && { user_id: user_id.toString() })
    });

    try {
      console.log('🔍 Fetching posts from:', `${API_BASE_URL}/posts?${queryParams}`);
      const response = await fetch(`${API_BASE_URL}/posts?${queryParams}`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Posts fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in getPosts:', error);
      throw error;
    }
  },

  // Lấy chi tiết bài viết
  getPost: async (postId, incrementView = true) => {
    const queryParams = new URLSearchParams({
      increment_view: incrementView.toString()
    });

    const response = await fetch(`${API_BASE_URL}/posts/${postId}?${queryParams}`);
    return handleResponse(response);
  },

  // Tạo bài viết mới
  createPost: async (postData) => {
    const formData = new FormData();
    
    // Thêm các trường bắt buộc
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('status_value', postData.status || 'published');
    
    // Thêm ảnh nếu có
    if (postData.image) {
      formData.append('image', postData.image);
    }

    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeadersOnly(), // Không set Content-Type cho FormData
      body: formData
    });

    return handleResponse(response);
  },

  // Cập nhật bài viết
  updatePost: async (postId, postData) => {
    const formData = new FormData();
    
    // Thêm các trường cần update
    if (postData.title) formData.append('title', postData.title);
    if (postData.content) formData.append('content', postData.content);
    if (postData.status) formData.append('status_value', postData.status);
    
    // Xử lý ảnh
    if (postData.image) {
      formData.append('image', postData.image);
    }
    if (postData.removeImage) {
      formData.append('remove_image', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: getAuthHeadersOnly(), // Không set Content-Type cho FormData
      body: formData
    });

    return handleResponse(response);
  },

  // Xóa bài viết
  deletePost: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    
    return true; // 204 No Content
  },

  // Lấy bài viết của tôi
  getMyPosts: async (params = {}) => {
    const { skip = 0, limit = 10 } = params;
    
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}/my-posts?${queryParams}`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  }
};

/**
 * COMMENTS API
 */
export const commentsApi = {
  // Lấy comments của bài viết
  getComments: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
    return handleResponse(response);
  },

  // Tạo comment mới
  createComment: async (postId, commentData) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        content: commentData.content,
        parent_id: commentData.parent_id || null
      })
    });

    return handleResponse(response);
  },

  // Cập nhật comment
  updateComment: async (commentId, content) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ content })
    });

    return handleResponse(response);
  },

  // Xóa comment
  deleteComment: async (commentId) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    
    return true; // 204 No Content
  }
};

/**
 * REACTIONS API
 */
export const reactionsApi = {
  // Toggle reaction (like/unlike)
  toggleReaction: async (postId, reactionType = 'like') => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/reactions?reaction_type=${reactionType}`, {
      method: 'POST',
      headers: getAuthHeadersOnly()
    });

    return handleResponse(response);
  },

  // Get post reactions
  getPostReactions: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/reactions`);
    return handleResponse(response);
  },

  // Get my reaction to post
  getMyReaction: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/reactions/me`, {
      headers: getAuthHeadersOnly()
    });
    return handleResponse(response);
  }
};

/**
 * UTILITY FUNCTIONS
 */
export const communityUtils = {
  // Format thời gian
  formatTimeAgo: (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  },

  // Validate ảnh
  validateImage: (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      throw new Error('Ảnh không được vượt quá 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF');
    }

    return true;
  },

  // Tạo image URL
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    
    // Nếu là URL đầy đủ (Firebase)
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Nếu là đường dẫn local
    return `http://localhost:8000${imagePath}`;
  }
};