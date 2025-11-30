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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
          return;
        }
        setIsAuthenticated(true);
        fetchDashboardData();
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
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
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResult = await DashboardService.getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        // Suppress error toast as requested
        // toast.error(statsResult.error || 'Unable to load dashboard statistics');
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
      // Suppress error toast as requested
      // toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Analysis</h3>
              <p className="stat-number">{stats.total_analysis.toLocaleString()}</p>
              {isAuthenticated && <small>All time</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Diseases Detected</h3>
              <p className="stat-number">{stats.diseases_detected}</p>
              {isAuthenticated && <small>Need treatment</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Accuracy Rate</h3>
              <p className="stat-number">{stats.accuracy_rate}%</p>
              {isAuthenticated && <small>Average</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>This Month</h3>
              <p className="stat-number">{stats.this_month_analysis}</p>
              {isAuthenticated && <small>New analyses</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Healthy Plants</h3>
              <p className="stat-number">{stats.healthy_plants}</p>
              {isAuthenticated && <small>No disease</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Orders</h3>
              <p className="stat-number">{stats.total_orders}</p>
              {isAuthenticated && <small>{stats.pending_orders} pending</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Completed</h3>
              <p className="stat-number">{stats.completed_orders}</p>
              {isAuthenticated && <small>Orders</small>}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Spent</h3>
              <p className="stat-number">${stats.total_spent.toLocaleString('en-US')}</p>
              {isAuthenticated && <small>Paid</small>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
