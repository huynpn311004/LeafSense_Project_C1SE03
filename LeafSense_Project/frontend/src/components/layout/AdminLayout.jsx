import React from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import './AdminLayout.css'

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getActiveNav = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'dashboard'
    if (path.includes('/users')) return 'users'
    if (path.includes('/categories')) return 'categories'
    if (path.includes('/products')) return 'products'
    if (path.includes('/orders')) return 'orders'
    if (path.includes('/coupons')) return 'coupons'
    if (path.includes('/community')) return 'community'
    if (path.includes('/statistics')) return 'statistics'
    if (path.includes('/settings')) return 'settings'
    return 'dashboard'
  }

  const activeNav = getActiveNav()

  return (
    <div className="admin-layout">
      <div className="admin-top-fixed">
        <div className="admin-header">
          <div className="admin-header-left">
            <h1>LeafSense Admin</h1>
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
            className={`nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeNav === 'users' ? 'active' : ''}`}
            onClick={() => navigate('/admin/users')}
          >
            User Management
          </button>
          <button 
            className={`nav-btn ${activeNav === 'categories' ? 'active' : ''}`}
            onClick={() => navigate('/admin/categories')}
          >
            Category Management
          </button>
          <button 
            className={`nav-btn ${activeNav === 'products' ? 'active' : ''}`}
            onClick={() => navigate('/admin/products')}
          >
            Product Management
          </button>
          <button 
            className={`nav-btn ${activeNav === 'orders' ? 'active' : ''}`}
            onClick={() => navigate('/admin/orders')}
          >
            Order Management
          </button>
          <button 
            className={`nav-btn ${activeNav === 'coupons' ? 'active' : ''}`}
            onClick={() => navigate('/admin/coupons')}
          >
            Coupon Management
          </button>
          <button 
            className={`nav-btn ${activeNav === 'community' ? 'active' : ''}`}
            onClick={() => navigate('/admin/community')}
          >
            Community Management
          </button>
          <button 
            className={`nav-btn ${activeNav === 'statistics' ? 'active' : ''}`}
            onClick={() => navigate('/admin/statistics')}
          >
            Statistics
          </button>
          <button 
            className={`nav-btn ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('/admin/settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout

