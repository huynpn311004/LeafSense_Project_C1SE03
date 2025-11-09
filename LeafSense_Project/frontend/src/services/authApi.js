import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Tạo axios instance với interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor để thêm token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để xử lý lỗi authentication
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Kiểm tra nếu tài khoản bị khóa
    if (error.response && error.response.status === 403) {
      const errorDetail = error.response.data.detail;
      
      // Nếu là lỗi tài khoản bị khóa
      if (errorDetail && errorDetail.includes('khóa')) {
        // Clear localStorage và chuyển đến trang account-locked
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/account-locked';
        return Promise.reject(error);
      }
    }
    
    // Nếu token hết hạn hoặc không hợp lệ
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Chỉ chuyển đến login nếu không phải trang public
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/signup', '/forgot-password', '/account-locked', '/'];
      
      if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Đăng ký
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Quên mật khẩu
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset mật khẩu
  resetPassword: async (token, newPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, { 
      new_password: newPassword 
    });
    return response.data;
  },

  // Kiểm tra trạng thái token
  validateToken: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Lấy thông tin user từ localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  // Kiểm tra user có đăng nhập không
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Kiểm tra user có phải admin không
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'admin';
  }
};

export default api;