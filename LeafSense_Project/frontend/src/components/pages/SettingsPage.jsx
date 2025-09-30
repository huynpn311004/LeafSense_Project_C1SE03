import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './SettingsPage.css'

const SettingsPage = () => {
  // ===== STATE MANAGEMENT =====
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: 'Pham Minh Trang',
    email: 'pmtrang04@gmail.com'
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // ===== DARK MODE FUNCTIONALITY =====
  useEffect(() => {
    // Lấy theme từ localStorage hoặc system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // ===== USER INFO FUNCTIONS =====
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ===== API INTEGRATION - THAY ĐỔI DỮ LIỆU THẬT TẠI ĐÂY =====
  const saveUserInfo = async () => {
    try {
      setIsLoading(true)
      setMessage({ type: '', text: '' })

      // THAY ĐỔI URL API CỦA BẠN TẠI ĐÂY
      const response = await fetch('/api/user/profile', { // <-- Thay đổi URL API
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Thêm headers khác nếu cần:
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // 'X-API-Version': 'v1'
        },
        body: JSON.stringify({
          name: userInfo.name,
          email: userInfo.email,
          // Thêm các trường khác nếu API yêu cầu:
          // user_id: currentUser.id,
          // avatar: userInfo.avatar,
          // phone: userInfo.phone,
          // address: userInfo.address
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      
      // MAPPING DỮ LIỆU API - ĐIỀU CHỈNH NẾU CẤU TRÚC KHÁC
      setMessage({ 
        type: 'success', 
        text: data.message || 'Profile updated successfully!' // <-- Điều chỉnh tên trường
      })

      // Cập nhật dữ liệu local nếu cần
      // setUserInfo(data.user || data.profile)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePassword = async () => {
    try {
      setIsLoading(true)
      setMessage({ type: '', text: '' })

      // Validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match!' })
        return
      }

      if (passwordData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters!' })
        return
      }

      // THAY ĐỔI URL API CỦA BẠN TẠI ĐÂY
      const response = await fetch('/api/user/change-password', { // <-- Thay đổi URL API
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Thêm headers khác nếu cần:
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
          // Thêm các trường khác nếu API yêu cầu:
          // user_id: currentUser.id,
          // confirm_password: passwordData.confirmPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to change password')
      }

      const data = await response.json()
      
      // MAPPING DỮ LIỆU API - ĐIỀU CHỈNH NẾU CẤU TRÚC KHÁC
      setMessage({ 
        type: 'success', 
        text: data.message || 'Password changed successfully!' // <-- Điều chỉnh tên trường
      })

      // Reset password form
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to change password. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ===== RENDER MAIN CONTENT =====
  return (
    <Layout>
      <div className="settings-page">
        {/* HEADER */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        {/* MESSAGE DISPLAY */}
        {message.text && (
          <div className={`message-display ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* SETTINGS CONTAINER */}
        <div className="settings-container">
          {/* THEME SETTINGS */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">
                🌙
              </div>
              <div className="settings-title">
                <h3>Theme</h3>
                <p>Choose your preferred theme appearance</p>
              </div>
            </div>
            <div className="theme-toggle">
              <div className="theme-option">
                <span className="theme-label">Light Mode</span>
                <div className={`theme-radio ${!isDarkMode ? 'active' : ''}`}>
                  <div className="theme-radio-inner"></div>
                </div>
              </div>
              <div className="theme-option">
                <span className="theme-label">Dark Mode</span>
                <div className={`theme-radio ${isDarkMode ? 'active' : ''}`}>
                  <div className="theme-radio-inner"></div>
                </div>
              </div>
              <button 
                className="theme-toggle-btn"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>

          {/* ACCOUNT SETTINGS */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">
                👤
              </div>
              <div className="settings-title">
                <h3>Account</h3>
                <p>Manage your personal information and password</p>
              </div>
            </div>

            <div className="account-sections">
              {/* PERSONAL INFO SECTION */}
              <div className="account-section">
                <h4>Personal Info</h4>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userInfo.name}
                    onChange={handleUserInfoChange}
                    className="form-input"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userInfo.email}
                    onChange={handleUserInfoChange}
                    className="form-input"
                    placeholder="Enter your email"
                  />
                </div>
                <button 
                  className="save-btn"
                  onClick={saveUserInfo}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* CHANGE PASSWORD SECTION */}
              <div className="account-section">
                <h4>Change Password</h4>
                <div className="form-group">
                  <label htmlFor="oldPassword">Old Password</label>
                  <input
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter old password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
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
                  onClick={updatePassword}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
