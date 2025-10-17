import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const email = params.get('email');
    const name = params.get('name');
    const avatar_url = params.get('avatar_url');
    const user_id = params.get('user_id');

    if (token && email) {
      const decodedToken = decodeURIComponent(token);
      localStorage.setItem('token', decodedToken);
      localStorage.setItem('user', JSON.stringify({ 
        id: user_id ? parseInt(user_id) : undefined,
        email, 
        name, 
        avatar: avatar_url 
      }));

      // Xóa query string khỏi URL cho gọn
      window.history.replaceState({}, document.title, '/');
    }
  }, [location]);
  
  // User info state
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    avatar: null
  });

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'grid', path: '/' },
    { id: 'Upload', label: 'Upload', icon: 'upload', path: '/upload' },
    { id: 'History', label: 'History', icon: 'history', path: '/history' },
    { id: 'Marketplace', label: 'Marketplace', icon: 'shopping', path: '/marketplace' },
    { id: 'Orders', label: 'Order History', icon: 'orders', path: '/orders' },
    { id: 'Community', label: 'Community', icon: 'community', path: '/community' },
    { id: 'Chatbot', label: 'Chatbot', icon: 'chat', path: '/chatbot' },
    { id: 'Setting', label: 'Setting', icon: 'settings', path: '/settings' }
  ];

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    switch (path) {
      case '/': return 'Dashboard';
      case '/upload': return 'Upload';
      case '/history': return 'History';
      case '/marketplace': return 'Marketplace';
      case '/cart': return 'Cart';
      case '/orders': return 'Orders';
      case '/checkout': return 'Checkout';
      case '/community': return 'Community';
      case '/chatbot': return 'Chatbot';
      case '/settings': return 'Setting';
      default: return 'Dashboard';
    }
  };

  const activeItem = getCurrentPage();

  const handleMenuClick = (itemId, path) => {
    navigate(path);
  };

  // Load user info from localStorage on component mount
  useEffect(() => {
    // Load dữ liệu từ localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserInfo(userData);
    }

    // Load fresh data từ API
    setTimeout(() => {
      loadUserProfileFromAPI();
    }, 100);

    // Khi localStorage thay đổi (ví dụ người dùng đăng xuất ở tab khác)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        const userData = JSON.parse(updatedUser);
        setUserInfo(userData);
      } else {
        setUserInfo({ name: '', email: '', avatar: null });
      }
    };

    const handleProfileUpdated = (e) => {
      if (e.detail) {
        setUserInfo(e.detail);
      }
    };

    // Đăng ký 2 listener
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profile-updated', handleProfileUpdated);

    // Gỡ khi component bị unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, []);

  // ===== AUTO LOAD PROFILE FROM API =====
  const loadUserProfileFromAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const response = await fetch('http://localhost:8000/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // Xử lý avatar URL
      let avatarUrl = null;
      if (data.avatar_url) {
        if (data.avatar_url.startsWith('http')) {
          avatarUrl = data.avatar_url;
        } else {
          avatarUrl = `http://localhost:8000${data.avatar_url}`;
        }
      }

      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      const updatedUserInfo = {
        id: data.id || currentUser.id, // Preserve user ID
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        avatar: avatarUrl,
        provider: data.provider || 'normal'
      };
      
      setUserInfo(updatedUserInfo);
      localStorage.setItem('user', JSON.stringify(updatedUserInfo));
      
    } catch (error) {
      // Handle error silently
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'grid':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
          </svg>
        );
      case 'upload':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            <path d="M12,12L9,15H11V19H13V15H15L12,12Z"/>
          </svg>
        );
      case 'history':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20Z"/>
          </svg>
        );
      case 'shopping':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,7H16V6A4,4 0 0,0 8,6V7H5A1,1 0 0,0 4,8V19A3,3 0 0,0 7,22H17A3,3 0 0,0 20,19V8A1,1 0 0,0 19,7M10,6A2,2 0 0,1 14,6V7H10V6M18,19A1,1 0 0,1 17,20H7A1,1 0 0,1 6,19V9H8V10A1,1 0 0,0 9,11A1,1 0 0,0 10,10V9H14V10A1,1 0 0,0 15,11A1,1 0 0,0 16,10V9H18V19Z"/>
          </svg>
        );
      case 'orders':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            <path d="M8,12H16V14H8V12M8,16H13V18H8V16Z"/>
          </svg>
        );
      case 'community':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"/>
          </svg>
        );
      case 'chat':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3C6.5,3 2,6.58 2,11C2,13.13 2.94,15.07 4.38,16.62L2,22L7.5,19.5C9.07,20.5 10.97,21 13,21C18.5,21 23,17.42 23,13C23,8.58 18.5,5 13,5C11.5,5 10.1,5.3 8.8,5.8L7.2,4.2C8.9,3.4 10.9,3 13,3M6.5,12C5.7,12 5,11.3 5,10.5S5.7,9 6.5,9S8,9.7 8,10.5S7.3,12 6.5,12M10.5,12C9.7,12 9,11.3 9,10.5S9.7,9 10.5,9S12,9.7 12,10.5S11.3,12 10.5,12M14.5,12C13.7,12 13,11.3 13,10.5S13.7,9 14.5,9S16,9.7 16,10.5S15.3,12 14.5,12Z"/>
          </svg>
        );
      case 'settings':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo-text">LeafSense</h1>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id, item.path)}
            >
              <div className="nav-icon">
                {renderIcon(item.icon)}
              </div>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          {/* User Info Section */}
          <div className="user-info">
            <div className="user-avatar">
              {userInfo.avatar ? (
                <img 
                  src={userInfo.avatar} 
                  alt="User Avatar" 
                  className="avatar-image"
                  onError={(e) => (e.target.src = '/images/default-avatar.png')}
                />
              ) : (
                <div className="avatar-placeholder">
                  {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{userInfo.name}</div>
              <div className="user-email">{userInfo.email}</div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h2 className="page-title">
            {menuItems.find(item => item.id === activeItem)?.label || activeItem}
          </h2>
        </div>
        <div className="content-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
