import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Gọi API đăng nhập
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email,
        password,
      });

      if (response.status === 200) {
        const { access_token, user } = response.data;
        
        // Lưu thông tin vào localStorage
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url || '',
          role: user.role || 'user',
        }));

        setSuccess('Login successful!');
        setError('');

        // Chuyển trang dựa vào role
        setTimeout(() => {
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Kiểm tra nếu tài khoản bị khóa
      if (error.response && error.response.status === 403) {
        navigate('/account-locked');
        return;
      }
      
      setError('Incorrect email or password!');
      setSuccess('');
    }
  };

  return (
    <div className="login-container">
      {/* Phần bên trái - logo */}
      <div className="login-left">
        <div className="login-left-content">
          <h1 className="logo-text login-logo">LeafSense</h1>
          <div className="leaf-pattern">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`leaf leaf-${i + 1}`}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Phần bên phải - form đăng nhập */}
      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-title">Login</h2>

          {error && <p className="login-error-message">{error}</p>}
          {success && <p className="login-success-message">{success}</p>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  maxLength="72"
                  required
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
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

            <button type="submit" className="login-button">
              Log In
            </button>
          </form>

          <div className="login-links">
            <Link to="/signup" className="signup-link">
              Sign up for an account
            </Link>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <div className="login-divider"><span>or</span></div>

          <button className="google-button"
          onClick={() => { 
              window.location.href = "http://localhost:8000/api/auth/google/login";
            }}
          >
            <div className="google-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
