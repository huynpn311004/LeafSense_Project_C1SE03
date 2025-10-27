import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './AdminSettings.css'

const AdminSettings = () => {
  const [adminInfo, setAdminInfo] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    provider: 'normal'
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  
  const navigate = useNavigate()

  // Load admin profile data
  const loadAdminProfile = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please login first!' })
        navigate('/admin/login')
        return
      }

      const response = await fetch('http://localhost:8000/api/admin/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token')
          navigate('/admin/login')
          return
        }
        throw new Error('Failed to load admin profile')
      }

      const data = await response.json()
      
      setAdminInfo({
        id: data.id || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        provider: data.provider || 'normal'
      })
      
    } catch (error) {
      console.error('Error loading admin profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdminProfile()
  }, [])

  const handleAdminInfoChange = (e) => {
    const { name, value } = e.target
    setAdminInfo(prev => ({
      ...prev,
      [name]: value
    }))
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    if (passwordMessage.text) {
      setPasswordMessage({ type: '', text: '' })
    }
  }



  // Save admin profile
  const saveAdminInfo = async () => {
    try {
      setIsLoading(true)
      setMessage({ type: 'info', text: 'Updating profile...' })

      // Validation
      if (!adminInfo.name.trim()) {
        setMessage({ type: 'error', text: 'Name is required!' })
        return
      }
      if (!adminInfo.email.trim()) {
        setMessage({ type: 'error', text: 'Email is required!' })
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(adminInfo.email)) {
        setMessage({ type: 'error', text: 'Invalid email!' })
        return
      }

      const formData = new FormData()
      formData.append('name', adminInfo.name)
      formData.append('email', adminInfo.email)
      formData.append('phone', adminInfo.phone || '')
      formData.append('address', adminInfo.address || '')

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/admin/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to update admin profile')
      }
      
      const data = await response.json()
      
      setAdminInfo(data)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      toast.success('Admin profile updated successfully!')

      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    
    } catch (error) {
      console.error('Error updating admin profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
      toast.error('Failed to update admin profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Change admin password
  const updateAdminPassword = async () => {
    try {
      setIsPasswordLoading(true)
      setPasswordMessage({ type: '', text: '' })

      // Validation
      if (!passwordData.old_password.trim()) {
        setPasswordMessage({ type: 'error', text: 'Old password is required!' })
        return
      }

      if (!passwordData.new_password.trim()) {
        setPasswordMessage({ type: 'error', text: 'New password is required!' })
        return
      }

      if (passwordData.new_password !== passwordData.confirmPassword) {
        setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match!' })
        return
      }

      if (passwordData.old_password === passwordData.new_password) {
        setPasswordMessage({ type: 'error', text: 'New password must be different from old password!' })
        return
      }

      const token = localStorage.getItem('token')
      
      if (!token) {
        setPasswordMessage({ type: 'error', text: 'Please login first!' })
        return
      }
      
      const response = await fetch('http://localhost:8000/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.message || 'Failed to change password')
      }

      const data = await response.json()
      
      setPasswordMessage({ 
        type: 'success', 
        text: data.message || 'Password changed successfully!'
      })

      // Reset password form
      setPasswordData({
        old_password: '',
        new_password: '',
        confirmPassword: ''
      })
      
      toast.success('Admin password changed successfully!')
      
    } catch (error) {
      console.error('Error changing admin password:', error)
      setPasswordMessage({ 
        type: 'error', 
        text: error.message || 'Failed to change password. Please try again.' 
      })
      toast.error('Failed to change admin password')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/admin/login')
    toast.success('Đã đăng xuất')
  }

  return (
    <div className="admin-settings">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Settings</h1>
          <p>Manage your admin account settings</p>
        </div>
        <div className="admin-header-right">
          <button 
            className="back-btn"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className="nav-btn"
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
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/coupons')}
        >
          Quản lý Mã giảm giá
        </button>
        <button 
          className="nav-btn active"
          onClick={() => navigate('/admin/settings')}
        >
          Settings
        </button>
      </div>

      <div className="settings-container">
        {/* ACCOUNT SETTINGS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              👤
            </div>
            <div className="settings-title">
              <h3>Admin Account</h3>
              <p>Manage your admin personal information and password</p>
            </div>
          </div>

          <div className="account-sections">
            {/* PERSONAL INFO SECTION */}
            <div className="account-section">
              <h4>Personal Info</h4>
              
              {message.text && (
                <div className={`message-display ${message.type}`} style={{ marginBottom: '15px' }}>
                  {message.text}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={adminInfo.name}
                  onChange={handleAdminInfoChange}
                  className="form-input"
                  placeholder="Enter admin name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={adminInfo.email}
                  onChange={handleAdminInfoChange}
                  className="form-input"
                  placeholder="Enter admin email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={adminInfo.phone}
                  onChange={handleAdminInfoChange}
                  className="form-input"
                  placeholder="Enter admin phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={adminInfo.address}
                  onChange={handleAdminInfoChange}
                  className="form-input form-textarea"
                  placeholder="Enter admin address"
                  rows="3"
                />
              </div>
              <button 
                className="save-btn"
                onClick={saveAdminInfo}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* CHANGE PASSWORD SECTION */}
            {adminInfo.provider === 'normal' && (
              <div className="account-section">
                <h4>Change Password</h4>
                
                {passwordMessage.text && (
                  <div className={`message-display ${passwordMessage.type}`} style={{ marginBottom: '15px' }}>
                    {passwordMessage.text}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="old_password">Old Password</label>
                  <input
                    type="password"
                    id="old_password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter old password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new_password">New Password</label>
                  <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirm new password"
                  />
                </div>
                <button 
                  className="update-btn"
                  onClick={updateAdminPassword}
                  disabled={isPasswordLoading}
                >
                  {isPasswordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}

            {/* GOOGLE ACCOUNT NOTICE */}
            {adminInfo.provider === 'google' && (
              <div className="account-section">
                <h4>Change Password</h4>
                <div className="info-message">
                  ℹ️ You are logged in with Google. Cannot change password for this account.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings