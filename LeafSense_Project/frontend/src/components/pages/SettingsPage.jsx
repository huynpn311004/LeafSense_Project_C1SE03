import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './SettingsPage.css'

const SettingsPage = () => {
  // ===== STATE MANAGEMENT =====
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: null,
    provider: 'normal'
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  // ===== LOAD USER DATA FROM API =====
  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please login first!' })
        return
      }

      const response = await fetch('http://localhost:8000/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load profile')
      }

      const data = await response.json()
      
      // Xử lý avatar URL
      let avatarUrl = null
      if (data.avatar_url) {
        if (data.avatar_url.startsWith('http')) {
          avatarUrl = data.avatar_url
        } else {
          avatarUrl = `http://localhost:8000${data.avatar_url}`
        }
      }
      
      // Cập nhật userInfo với dữ liệu từ API
      const updatedUserInfo = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        avatar: avatarUrl,
        provider: data.provider || 'normal'
      }
      
      setUserInfo(updatedUserInfo)
      
      // Cập nhật localStorage và thông báo cho Layout
      localStorage.setItem('user', JSON.stringify(updatedUserInfo))
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedUserInfo }))
      
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
      
      // Fallback: lấy từ localStorage nếu có
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUserInfo({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          avatar: userData.avatar || null,
          provider: userData.provider || 'normal'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

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
    
    // Load user profile data
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      if (userData.name && userData.email) {
        setUserInfo({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          avatar: userData.avatar || null,
          provider: userData.provider || 'normal'
        })
        return
      }
    }
    
    loadUserProfile()
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
    // Clear profile message when user starts typing
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
    // Clear password message when user starts typing
    if (passwordMessage.text) {
      setPasswordMessage({ type: '', text: '' })
    }
  }

  // ===== AVATAR FUNCTIONS =====
  const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validation
      const maxSize = 5 * 1024 * 1024 // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB!' })
        return
      }
      
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, GIF)!' })
        return
      }
      
      try {
        // Compress image if it's larger than 1MB
        let processedFile = file
        if (file.size > 1024 * 1024) {
          setMessage({ type: 'info', text: 'Compressing image...' })
          processedFile = await compressImage(file)
        }
        
        setAvatarFile(processedFile)
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target.result)
        }
        reader.readAsDataURL(processedFile)
        
        setMessage({ type: 'info', text: 'Avatar selected. Click "Save Changes" to update.' })
        // Auto clear message after 5 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 5000)
      } catch (error) {
        console.error('Error processing image:', error)
        setMessage({ type: 'error', text: 'Error processing image. Please try again.' })
      }
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    // Don't update userInfo.avatar here, just clear preview
    setMessage({ type: 'info', text: 'Avatar removed. Click "Save Changes" to update.' })
    // Auto clear message after 5 seconds
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 5000)
  }

  // ===== API INTEGRATION - THAY ĐỔI DỮ LIỆU THẬT TẠI ĐÂY =====
  const saveUserInfo = async () => {
    try {
      setIsLoading(true)
      setMessage({ type: 'info', text: avatarFile ? 'Uploading avatar...' : 'Updating profile...' })

      // Validation
      if (!userInfo.name.trim()) return setMessage({ type: 'error', text: 'Name is required!' })
      if (!userInfo.email.trim()) return setMessage({ type: 'error', text: 'Email is required!' })
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userInfo.email)) return setMessage({ type: 'error', text: 'Invalid email!' })
      if (userInfo.phone.trim()) {
        const phoneRegex = /^(0|\+84)[3-9][0-9]{8}$/
        if (!phoneRegex.test(userInfo.phone.replace(/\s/g, '')))
          return setMessage({ type: 'error', text: 'Invalid Vietnamese phone number!' })
      }
      // Address is optional, no validation needed

      // Gửi formData
      const formData = new FormData()
      formData.append('name', userInfo.name)
      formData.append('email', userInfo.email)
      formData.append('phone', userInfo.phone)
      formData.append('address', userInfo.address)
      
      // Handle avatar changes
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      } else if (avatarPreview === null && userInfo.avatar) {
        // Avatar was removed, send empty file or remove flag
        formData.append('remove_avatar', 'true')
      }

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/user/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to update profile')
      const data = await response.json()

      // ✅ Cập nhật localStorage và Layout
      let finalAvatarUrl = null
      if (data.avatar_url) {
        if (data.avatar_url.startsWith('http')) {
          finalAvatarUrl = data.avatar_url // Google avatar
        } else {
          finalAvatarUrl = `http://localhost:8000${data.avatar_url}` // Local avatar
        }
      } else if (avatarPreview === null) {
        finalAvatarUrl = null // Avatar removed
      } else {
        finalAvatarUrl = userInfo.avatar // Keep existing
      }
      

      
      const updatedUser = {
        name: data.name || userInfo.name,
        email: data.email || userInfo.email,
        phone: data.phone || userInfo.phone,
        address: data.address || userInfo.address,
        avatar: finalAvatarUrl,
        provider: userInfo.provider
      }

      // Cập nhật UI ngay trước để giảm độ trễ cảm nhận
      setUserInfo(updatedUser)
      setAvatarFile(null)
      setAvatarPreview(null)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      // Lưu lại thông tin user chuẩn (async)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedUser }))

      // Auto clear success message
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }


  const updatePassword = async () => {
    try {
      setIsPasswordLoading(true)
      setPasswordMessage({ type: '', text: '' })

      // Validation
      if (!passwordData.oldPassword.trim()) {
        setPasswordMessage({ type: 'error', text: 'Old password is required!' })
        setIsPasswordLoading(false)
        return
      }

      if (!passwordData.newPassword.trim()) {
        setPasswordMessage({ type: 'error', text: 'New password is required!' })
        setIsPasswordLoading(false)
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match!' })
        setIsPasswordLoading(false)
        return
      }

      // Removed password length validation as requested

      if (passwordData.oldPassword === passwordData.newPassword) {
        setPasswordMessage({ type: 'error', text: 'New password must be different from old password!' })
        setIsPasswordLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      
      if (!token) {
        setPasswordMessage({ type: 'error', text: 'Please login first!' })
        setIsPasswordLoading(false)
        return
      }
      
      const response = await fetch('http://localhost:8000/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
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
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordMessage({ 
        type: 'error', 
        text: error.message || 'Failed to change password. Please try again.' 
      })
    } finally {
      setIsPasswordLoading(false)
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
                
                {/* PROFILE MESSAGE DISPLAY */}
                {message.text && (
                  <div className={`message-display ${message.type}`} style={{ marginBottom: '15px' }}>
                    {message.text}
                  </div>
                )}
                
                {/* AVATAR SECTION */}
                <div className="avatar-section">
                  <div className="avatar-container">
                    <div className="avatar-preview">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar Preview" 
                          className="avatar-image"
                          loading="lazy"
                        />
                      ) : userInfo.avatar ? (
                        <img 
                          src={userInfo.avatar}
                          alt="Avatar" 
                          className="avatar-image"
                          loading="lazy"
                          onLoad={(e) => {
                            e.target.style.opacity = '1'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="avatar-actions">
                      {/* Avatar actions chỉ hiển thị cho normal users */}
                      {userInfo.provider === 'normal' && (
                        <>
                          <label htmlFor="avatar-upload" className="avatar-upload-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            {avatarPreview ? 'Change Avatar' : (userInfo.avatar ? 'Change Avatar' : 'Upload Avatar')}
                          </label>
                          <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                          {(avatarPreview || userInfo.avatar) && (
                            <button 
                              type="button" 
                              className="avatar-remove-btn"
                              onClick={removeAvatar}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                              </svg>
                              Remove
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
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
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userInfo.phone}
                    onChange={handleUserInfoChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={userInfo.address}
                    onChange={handleUserInfoChange}
                    className="form-input form-textarea"
                    placeholder="Enter your address"
                    rows="3"
                  />
                </div>
                <button 
                  className="save-btn"
                  onClick={saveUserInfo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner"></span>
                      Saving...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>

              {/* CHANGE PASSWORD SECTION - Chỉ hiển thị cho tài khoản thông thường */}
              {userInfo.provider === 'normal' && (
                <div className="account-section">
                  <h4>Change Password</h4>
                  
                  {/* PASSWORD CHANGE MESSAGE DISPLAY */}
                  {passwordMessage.text && (
                    <div className={`message-display ${passwordMessage.type}`} style={{ marginBottom: '15px' }}>
                      {passwordMessage.text}
                    </div>
                  )}
                  
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
                    onClick={updatePassword}
                    disabled={isPasswordLoading}
                  >
                    {isPasswordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

              {/* THÔNG BÁO CHO GOOGLE USERS */}
              {userInfo.provider === 'google' && (
                <div className="account-section">
                  <h4>Change Password</h4>
                  <div className="info-message" style={{ 
                    padding: '15px', 
                    backgroundColor: '#e3f2fd', 
                    border: '1px solid #2196f3', 
                    borderRadius: '8px', 
                    color: '#1565c0',
                    textAlign: 'center'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                    Bạn đã đăng nhập bằng Google. Không thể thay đổi mật khẩu cho tài khoản này.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
