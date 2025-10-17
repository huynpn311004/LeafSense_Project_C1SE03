import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError = useMemo(() => {
    if (!touched) return '';
    if (!email) return 'Vui lòng nhập email.';
    // Simple RFC 5322-ish email check
    const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return emailRegex.test(email) ? '' : 'Email không hợp lệ.';
  }, [email, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (emailError) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);

      await axios.post(
        'http://localhost:8000/api/auth/forgot-password',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setIsEmailSent(true);
      toast.success('Email đặt lại mật khẩu đã được gửi nếu địa chỉ email tồn tại.');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div>
          <h2 className="auth-title">
            Quên Mật Khẩu
          </h2>
        </div>
        {!isEmailSent ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="form-field">
                <label htmlFor="email-address" className="form-label">
                  Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`input ${emailError ? 'input-error' : ''}`}
                  placeholder="Nhập địa chỉ email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                />
                {emailError && <p className="input-hint error">{emailError}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!emailError}
              className="btn btn-primary btn-block"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi Email Đặt Lại Mật Khẩu'}
            </button>
          </form>
        ) : (
          <div className="success-panel">
            <div className="success-icon" aria-hidden="true">✓</div>
            <h3 className="success-title">
              Email Đã Được Gửi!
            </h3>
            <p className="success-text">
              Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
            </p>
            <Link
              to="/login"
              className="auth-link"
            >
              ← Quay lại trang đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;