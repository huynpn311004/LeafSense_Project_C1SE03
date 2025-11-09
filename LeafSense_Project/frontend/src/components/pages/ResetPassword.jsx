import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ResetPassword.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      await axios.post(
        `http://localhost:8000/api/auth/reset-password/${token}`,
        `new_password=${encodeURIComponent(newPassword)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      toast.success('Mật khẩu đã được đặt lại thành công!');
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 400) {
        toast.error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!');
      } else {
        toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div>
          <h2 className="auth-title">
            Đặt Lại Mật Khẩu
          </h2>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-field">
              <label htmlFor="new-password" className="form-label">
                Mật khẩu mới
              </label>
              <div className="input-with-toggle">
                <input
                  id="new-password"
                  name="new-password"
                  type={showNew ? 'text' : 'password'}
                  required
                  className={`input`}
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowNew((v) => !v)}
                >
                  {showNew ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="confirm-password" className="form-label">
                Xác nhận mật khẩu
              </label>
              <div className="input-with-toggle">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  className={`input`}
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block"
          >
            {isLoading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;