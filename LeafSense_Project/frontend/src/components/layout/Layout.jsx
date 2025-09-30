import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'grid', path: '/' },
    { id: 'Upload', label: 'Upload', icon: 'upload', path: '/upload' },
    { id: 'History', label: 'History', icon: 'history', path: '/history' },
    { id: 'Marketplace', label: 'Marketplace', icon: 'shopping', path: '/marketplace' },
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

  const handleLogout = () => {
    console.log('Logging out...');
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
            <path d="M7,4V2A1,1 0 0,1 8,1H16A1,1 0 0,1 17,2V4H20A1,1 0 0,1 21,5V7A1,1 0 0,1 20,8H19V19A3,3 0 0,1 16,22H8A3,3 0 0,1 5,19V8H4A1,1 0 0,1 3,7V5A1,1 0 0,1 4,4H7M9,3V4H15V3H9M7,6V8H17V6H7M7,10V19A1,1 0 0,0 8,20H16A1,1 0 0,0 17,19V10H7Z"/>
          </svg>
        );
      case 'community':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,4C18.21,4 20,5.79 20,8C20,10.21 18.21,12 16,12C15.71,12 15.44,11.97 15.18,11.92L12.5,14.6C12.5,14.6 12.5,14.6 12.5,14.6L12.5,16L16,16C18.21,16 20,17.79 20,20C20,22.21 18.21,24 16,24C13.79,24 12,22.21 12,20C12,19.71 12.03,19.44 12.08,19.18L9.4,16.5C9.4,16.5 9.4,16.5 9.4,16.5L8,16.5C5.79,16.5 4,15.21 4,13C4,10.79 5.79,9 8,9C8.29,9 8.56,9.03 8.82,9.08L11.5,6.4C11.5,6.4 11.5,6.4 11.5,6.4L11.5,5C11.5,2.79 13.29,1 15.5,1C17.71,1 19.5,2.79 19.5,5C19.5,7.21 17.71,9 15.5,9C15.21,9 14.94,8.97 14.68,8.92L12,11.6C12,11.6 12,11.6 12,11.6L12,13C12,15.21 10.21,17 8,17C5.79,17 4,15.21 4,13C4,10.79 5.79,9 8,9Z"/>
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
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h2 className="page-title">{activeItem}</h2>
        </div>
        <div className="content-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
