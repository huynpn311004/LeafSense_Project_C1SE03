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
    if (!email) return 'Please enter your email.';
    // Simple RFC 5322-ish email check
    const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return emailRegex.test(email) ? '' : 'Invalid email address.';
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
      toast.success('Password reset email has been sent if the email address exists.');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div>
          <h2 className="auth-title">
            Forgot Password
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
                  placeholder="Enter your email address"
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
              {isLoading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </form>
        ) : (
          <div className="success-panel">
            <div className="success-icon" aria-hidden="true">✓</div>
            <h3 className="success-title">
              Email Sent!
            </h3>
            <p className="success-text">
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <Link
              to="/login"
              className="auth-link"
            >
              ← Back to login page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;