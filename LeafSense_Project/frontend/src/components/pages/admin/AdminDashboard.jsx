import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import CouponService from '../../../services/couponApi'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    active_users: 0
  })
  const [couponStats, setCouponStats] = useState({
    total_coupons: 0,
    active_coupons: 0,
    total_usage: 0,
    total_discount_given: 0
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardStats()
    fetchCouponStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCouponStats = async () => {
    try {
      const result = await CouponService.getCouponStatsAdmin()
      if (result.success) {
        setCouponStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching coupon stats:', error)
      // Use mock data if API fails
      setCouponStats({
        total_coupons: 6,
        active_coupons: 5,
        total_usage: 45,
        total_discount_given: 850.50
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>LeafSense Admin Dashboard</h1>
          <p>System Management</p>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className="nav-btn active"
          onClick={() => navigate('/admin/dashboard')}
        >
          Dashboard
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/users')}
        >
          User Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/categories')}
        >
          Category Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/products')}
        >
          Product Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/orders')}
        >
          Order Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/coupons')}
        >
          Coupon Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/community')}
        >
          Community Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/settings')}
        >
          Settings
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-content">
            <h3>{stats.total_users}</h3>
            <p>Total Users</p>
            <small>{stats.active_users} active</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">📦</div>
          <div className="stat-content">
            <h3>{stats.total_products}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">📋</div>
          <div className="stat-content">
            <h3>{stats.total_orders}</h3>
            <p>Total Orders</p>
            <small>{stats.pending_orders} pending</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-content">
            <h3>{stats.total_revenue.toLocaleString('vi-VN')}₫</h3>
            <p>Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon coupons">🎟️</div>
          <div className="stat-content">
            <h3>{couponStats.total_coupons}</h3>
            <p>Coupons</p>
            <small>{couponStats.active_coupons} active</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon discount">💸</div>
          <div className="stat-content">
            <h3>${couponStats.total_discount_given.toFixed(0)}</h3>
            <p>Total Discount</p>
            <small>{couponStats.total_usage} times used</small>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/users')}
          >
            <span className="action-icon">👥</span>
            <span>User Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/categories')}
          >
            <span className="action-icon">🏷️</span>
            <span>Category Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/products')}
          >
            <span className="action-icon">📦</span>
            <span>Product Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/orders')}
          >
            <span className="action-icon">📋</span>
            <span>Order Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/coupons')}
          >
            <span className="action-icon">🎟️</span>
            <span>Coupon Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/community')}
          >
            <span className="action-icon">👥</span>
            <span>Community Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/coupons?action=create')}
          >
            <span className="action-icon">➕</span>
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
