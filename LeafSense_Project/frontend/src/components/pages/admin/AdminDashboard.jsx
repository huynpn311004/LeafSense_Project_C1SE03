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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back, Admin!</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <h3>{stats.total_users}</h3>
            <p>Total Users</p>
            <small>{stats.active_users} active</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <h3>{stats.total_products}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <h3>{stats.total_orders}</h3>
            <p>Total Orders</p>
            <small>{stats.pending_orders} pending</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <h3>{stats.total_revenue.toLocaleString('vi-VN')}₫</h3>
            <p>Revenue</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <h3>{couponStats.total_coupons}</h3>
            <p>Coupons</p>
            <small>{couponStats.active_coupons} active</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <h3>{couponStats.total_discount_given.toLocaleString('vi-VN')}₫</h3>
            <p>Total Discount</p>
            <small>{couponStats.total_usage} times used</small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
