import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Create axios instance with auth header interceptor
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const DashboardService = {
  // Get dashboard statistics for farmer
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/dashboard-stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch dashboard statistics'
      };
    }
  },

  // Get user upload history
  getUploadHistory: async (limit = 10, offset = 0, diseaseFilter = null) => {
    try {
      const params = { limit, offset };
      if (diseaseFilter) {
        params.disease_filter = diseaseFilter;
      }

      const response = await apiClient.get('/history', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching upload history:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch upload history'
      };
    }
  },

  // Get prediction detail
  getPredictionDetail: async (predictionId) => {
    try {
      const response = await apiClient.get(`/history/${predictionId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching prediction detail:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch prediction detail'
      };
    }
  },

  // Delete prediction
  deletePrediction: async (predictionId) => {
    try {
      const response = await apiClient.delete(`/history/${predictionId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting prediction:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete prediction'
      };
    }
  },

  // Get recent activities (formatted for dashboard)
  getRecentActivities: async () => {
    try {
      const historyResult = await DashboardService.getUploadHistory(5, 0);
      if (historyResult.success) {
        const activities = historyResult.data.history.map(item => ({
          id: item.id,
          type: 'analysis',
          disease: item.disease,
          confidence: item.confidence,
          time_ago: DashboardService.formatTimeAgo(item.created_at),
          icon: item.disease === 'nodisease' ? '🌱' : '🔍',
          message: `Phân tích hoàn thành - ${item.disease} (${item.confidence}% độ tin cậy)`,
          date: item.date,
          time: item.time
        }));

        return {
          success: true,
          data: activities
        };
      }
      return historyResult;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return {
        success: false,
        error: 'Failed to fetch recent activities'
      };
    }
  },

  // Helper function to format time ago
  formatTimeAgo: (isoString) => {
    if (!isoString) return 'Không xác định';
    
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now - date;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} ngày trước`;
    } else if (diffHours > 0) {
      return `${diffHours} giờ trước`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  }
};

export default DashboardService;