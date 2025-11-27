import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './AdminSettings.css'

const AdminSettings = () => {
  // State cho thông tin admin
  const [adminInfo, setAdminInfo] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    provider: 'normal'
  })
  
  // State cho đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirmPassword: ''
  })
  
  // State cho loading và modal
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  
  const navigate = useNavigate()

  // Load admin profile data
  const loadAdminProfile = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
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
  const saveAdminInfo = async (e) => {
    e.preventDefault()
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
      
      toast.success('Profile updated successfully!')
      setShowProfileModal(false)

      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    
    } catch (error) {
      console.error('Error updating admin profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Change admin password
  const updateAdminPassword = async (e) => {
    e.preventDefault()
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
      
      toast.success('Password changed successfully!')
      setShowPasswordModal(false)
      
    } catch (error) {
      console.error('Error changing admin password:', error)
      setPasswordMessage({ 
        type: 'error', 
        text: error.message || 'Failed to change password. Please try again.' 
      })
      toast.error('Failed to change password')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="loading">Loading data...</div>
      </div>
    )
  }

  return (
    <div className="admin-settings">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Settings</h1>
          <p>Manage admin account settings</p>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
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
          className="nav-btn active"
          onClick={() => navigate('/admin/settings')}
        >
          Settings
        </button>
      </div>

      <div className="settings-grid">
        {/* Profile Settings Card */}
        <div className="setting-card">
          <div className="setting-icon">👤</div>
          <div className="setting-info">
            <h3>Profile Information</h3>
            <p>Name: {adminInfo.name || 'Not set'}</p>
            <p>Email: {adminInfo.email || 'Not set'}</p>
            <p>Phone: {adminInfo.phone || 'Not set'}</p>
          </div>
          <div className="setting-actions">
            <button 
              className="edit-btn"
              onClick={() => setShowProfileModal(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Password Settings Card */}
        {adminInfo.provider === 'normal' && (
          <div className="setting-card">
            <div className="setting-icon">🔒</div>
            <div className="setting-info">
              <h3>Password Security</h3>
              <p>Change your account password</p>
              <p>Last updated: Recently</p>
            </div>
            <div className="setting-actions">
              <button 
                className="edit-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* Google Account Card */}
        {adminInfo.provider === 'google' && (
          <div className="setting-card">
            <div className="setting-icon">🔒</div>
            <div className="setting-info">
              <h3>Google Account</h3>
              <p>Password managed by Google</p>
              <p>Secure authentication via Google</p>
            </div>
            <div className="setting-actions">
              <button 
                className="disabled-btn"
                disabled
              >
                Managed by Google
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Profile Information</h2>
              <button onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <form onSubmit={saveAdminInfo} className="modal-form">
              {message.text && (
                <div className={`message-display ${message.type}`} style={{ marginBottom: '15px' }}>
                  {message.text}
                </div>
              )}
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={adminInfo.name}
                  onChange={handleAdminInfoChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={adminInfo.email}
                  onChange={handleAdminInfoChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={adminInfo.phone}
                  onChange={handleAdminInfoChange}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={adminInfo.address}
                  onChange={handleAdminInfoChange}
                  placeholder="Enter your address"
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && adminInfo.provider === 'normal' && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={updateAdminPassword} className="modal-form">
              {passwordMessage.text && (
                <div className={`message-display ${passwordMessage.type}`} style={{ marginBottom: '15px' }}>
                  {passwordMessage.text}
                </div>
              )}
              
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Confirm new password"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettings