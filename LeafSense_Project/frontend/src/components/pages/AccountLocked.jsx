import React from 'react';
import { Link } from 'react-router-dom';
import './AccountLocked.css';

const AccountLocked = () => {
  return (
    <div className="account-locked-container">
      <div className="account-locked-content fade-in">
        <div className="header-section">
          {/* Icon */}
          <div className="lock-icon-container">
            <svg className="lock-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {/* Title */}
          <h1 className="main-title">
            Tài khoản bị khóa
          </h1>
          
          {/* Subtitle */}
          <p className="subtitle">
            Tài khoản của bạn đã bị khóa bởi quản trị viên
          </p>
        </div>

        {/* Main message card */}
        <div className="info-card message-card">
          <div className="message-content">
            <svg className="warning-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h2 className="message-title">
                Thông báo quan trọng
              </h2>
              <p className="message-text">
                Tài khoản của bạn hiện đang bị tạm khóa. Điều này có thể do vi phạm điều khoản sử dụng 
                hoặc các chính sách của hệ thống LeafSense.
              </p>
            </div>
          </div>
        </div>

        {/* Contact info card */}
        <div className="info-card contact-card">
          <div className="contact-content">
            <svg className="mail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="contact-title">
              Liên hệ để mở khóa tài khoản
            </h3>
            <p className="contact-description">
              Vui lòng liên hệ qua email để được hỗ trợ mở khóa tài khoản:
            </p>
            <div className="email-container">
              <a 
                href="mailto:leafsensehotro@gmail.com.vn" 
                className="email-link"
              >
                leafsensehotro@gmail.com
              </a>
            </div>
            <p className="contact-note">
              Trong email, vui lòng cung cấp thông tin tài khoản của bạn để được hỗ trợ nhanh chóng.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions-card">
          <h4 className="instructions-title">Lưu ý:</h4>
          <ul className="instructions-list">
            <li className="instructions-item">Vui lòng đính kèm thông tin tài khoản (email đăng ký)</li>
            <li className="instructions-item">Mô tả chi tiết tình huống (nếu có)</li>
            <li className="instructions-item">Thời gian phản hồi: 24-48 giờ làm việc</li>
          </ul>
        </div>

        {/* Back to login */}
        <div className="back-to-login">
          <Link to="/login" className="back-to-login-btn">
            <svg className="login-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Quay lại đăng nhập
          </Link>
        </div>

        {/* Footer note */}
        <div className="footer-note">
          <p className="footer-text">
            Cảm ơn bạn đã sử dụng dịch vụ LeafSense. Chúng tôi sẽ hỗ trợ bạn sớm nhất có thể.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountLocked;