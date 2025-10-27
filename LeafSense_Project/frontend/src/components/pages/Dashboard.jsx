import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../layout/Layout';
import DashboardService from '../../services/dashboardApi';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_analysis: 0,
    diseases_detected: 0,
    accuracy_rate: 0,
    this_month_analysis: 0,
    healthy_plants: 0,
    success_rate: 0,
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_spent: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      fetchDashboardData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
      // Show mock data for non-authenticated users
      setStats({
        total_analysis: 1234,
        diseases_detected: 89,
        accuracy_rate: 94.2,
        this_month_analysis: 89,
        healthy_plants: 1145,
        success_rate: 92.8,
        total_orders: 45,
        pending_orders: 3,
        completed_orders: 42,
        total_spent: 2850000
      });
      setRecentActivities([
        {
          id: 1,
          icon: '🌱',
          message: 'Phân tích hoàn thành - nodisease (95% độ tin cậy)',
          time_ago: '2 giờ trước'
        },
        {
          id: 2,
          icon: '🔍',
          message: 'Phân tích hoàn thành - rust (87% độ tin cậy)', 
          time_ago: '4 giờ trước'
        }
      ]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResult = await DashboardService.getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
        setRecentActivities(statsResult.data.recent_activities || []);
      } else {
        toast.error(statsResult.error || 'Không thể tải thống kê dashboard');
        // Fallback to mock data
        setStats({
          total_analysis: 0,
          diseases_detected: 0,
          accuracy_rate: 0,
          this_month_analysis: 0,
          healthy_plants: 0,
          success_rate: 0,
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          total_spent: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Lỗi khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để sử dụng tính năng này');
      navigate('/login');
      return;
    }
    
    switch (action) {
      case 'upload':
        navigate('/upload');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'chatbot':
        navigate('/chatbot');
        break;
      case 'marketplace':
        navigate('/marketplace');
        break;
      case 'community':
        navigate('/community');
        break;
      case 'orders':
        navigate('/orders');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-content">
        {/* Authentication Status */}
        {!isAuthenticated && (
          <div className="auth-notice">
            <div className="auth-notice-content">
              <h3>👋 Chào mừng đến với LeafSense!</h3>
              <p>Đăng nhập để xem thống kê cá nhân và lưu lịch sử phân tích của bạn</p>
              <button 
                className="login-btn"
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Tổng phân tích</h3>
              <p className="stat-number">{stats.total_analysis.toLocaleString()}</p>
              {isAuthenticated && <small>Tất cả thời gian</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🦠</div>
            <div className="stat-info">
              <h3>Bệnh phát hiện</h3>
              <p className="stat-number">{stats.diseases_detected}</p>
              {isAuthenticated && <small>Cần điều trị</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Độ chính xác</h3>
              <p className="stat-number">{stats.accuracy_rate}%</p>
              {isAuthenticated && <small>Trung bình</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>Tháng này</h3>
              <p className="stat-number">{stats.this_month_analysis}</p>
              {isAuthenticated && <small>Phân tích mới</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌿</div>
            <div className="stat-info">
              <h3>Cây khỏe mạnh</h3>
              <p className="stat-number">{stats.healthy_plants}</p>
              {isAuthenticated && <small>Không có bệnh</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-info">
              <h3>Tổng đơn hàng</h3>
              <p className="stat-number">{stats.total_orders}</p>
              {isAuthenticated && <small>{stats.pending_orders} đang xử lý</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Đã hoàn thành</h3>
              <p className="stat-number">{stats.completed_orders}</p>
              {isAuthenticated && <small>Đơn hàng</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Tổng chi tiêu</h3>
              <p className="stat-number">{stats.total_spent.toLocaleString('vi-VN')}₫</p>
              {isAuthenticated && <small>Đã thanh toán</small>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Thao tác nhanh</h3>
          <div className="actions-grid">
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('upload')}
            >
              <span className="action-icon">📷</span>
              <span>Phân tích lá cây</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('history')}
            >
              <span className="action-icon">📋</span>
              <span>Lịch sử phân tích</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('chatbot')}
            >
              <span className="action-icon">🤖</span>
              <span>Tư vấn AI</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('marketplace')}
            >
              <span className="action-icon">🛒</span>
              <span>Cửa hàng</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('community')}
            >
              <span className="action-icon">👥</span>
              <span>Cộng đồng</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('orders')}
            >
              <span className="action-icon">📦</span>
              <span>Đơn hàng</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <div className="activity-header">
            <h3>Hoạt động gần đây</h3>
            {isAuthenticated && (
              <button 
                className="view-all-btn"
                onClick={() => navigate('/history')}
              >
                Xem tất cả
              </button>
            )}
          </div>
          
          <div className="activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <p><strong>{activity.message}</strong></p>
                    <span className="activity-time">{activity.time_ago}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>Chưa có hoạt động nào</p>
                {isAuthenticated && (
                  <button 
                    className="start-analysis-btn"
                    onClick={() => navigate('/upload')}
                  >
                    Bắt đầu phân tích
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
