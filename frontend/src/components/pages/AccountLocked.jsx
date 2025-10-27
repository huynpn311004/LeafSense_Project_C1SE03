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
            Account Locked
          </h1>
          
          {/* Subtitle */}
          <p className="subtitle">
            Your account has been locked by the administrator
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
                Important Notice
              </h2>
              <p className="message-text">
                Your account is currently temporarily locked. This may be due to a violation of the terms of use 
                or system policies of LeafSense.
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
              Contact to unlock your account
            </h3>
            <p className="contact-description">
              Please contact us via email for account unlock support:
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
              In your email, please provide your account information for quick support.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions-card">
          <h4 className="instructions-title">Note:</h4>
          <ul className="instructions-list">
            <li className="instructions-item">Please attach your account information (registered email)</li>
            <li className="instructions-item">Describe the situation in detail (if any)</li>
            <li className="instructions-item">Response time: 24-48 business hours</li>
          </ul>
        </div>

        {/* Back to login */}
        <div className="back-to-login">
          <Link to="/login" className="back-to-login-btn">
            <svg className="login-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Back to Login
          </Link>
        </div>

        {/* Footer note */}
        <div className="footer-note">
          <p className="footer-text">
            Thank you for using LeafSense services. We will support you as soon as possible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountLocked;