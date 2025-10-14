import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
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
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardStats()
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>LeafSense Admin Dashboard</h1>
          <p>Quản lý hệ thống</p>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
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
          Quản lý Users
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/products')}
        >
          Quản lý Sản phẩm
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/orders')}
        >
          Quản lý Đơn hàng
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/categories')}
        >
          Quản lý Danh mục
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-content">
            <h3>{stats.total_users}</h3>
            <p>Tổng Users</p>
            <small>{stats.active_users} đang hoạt động</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">📦</div>
          <div className="stat-content">
            <h3>{stats.total_products}</h3>
            <p>Tổng Sản phẩm</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">📋</div>
          <div className="stat-content">
            <h3>{stats.total_orders}</h3>
            <p>Tổng Đơn hàng</p>
            <small>{stats.pending_orders} chờ xử lý</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-content">
            <h3>{stats.total_revenue.toLocaleString('vi-VN')}₫</h3>
            <p>Doanh thu</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Thao tác nhanh</h2>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/users')}
          >
            <span className="action-icon">👥</span>
            <span>Quản lý Users</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/products')}
          >
            <span className="action-icon">📦</span>
            <span>Quản lý Sản phẩm</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/orders')}
          >
            <span className="action-icon">📋</span>
            <span>Quản lý Đơn hàng</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/categories')}
          >
            <span className="action-icon">🏷️</span>
            <span>Quản lý Danh mục</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
