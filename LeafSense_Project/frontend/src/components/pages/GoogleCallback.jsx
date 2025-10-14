import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Lấy thông tin từ URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const email = urlParams.get('email');
      const name = urlParams.get('name');
      const avatar_url = urlParams.get('avatar_url');

      if (token && email) {
        // 🔒 Giải mã URI để tránh lỗi token có ký tự đặc biệt
        const decodedToken = decodeURIComponent(token);

        // Lưu vào localStorage
        localStorage.setItem('token', decodedToken);
        localStorage.setItem('user', JSON.stringify({ email, name, avatar_url }));

        // Hiển thị thông báo
        alert(`🎉 Đăng nhập Google thành công!\nChào mừng ${name || email}!`);

        // Chuyển hướng về dashboard sau 1 giây
        setTimeout(() => navigate('/'), 1000);
      } else {
        alert('❌ Đăng nhập Google thất bại hoặc không có token!');
        navigate('/login');
      }
    } catch (error) {
      console.error('Lỗi xử lý Google callback:', error);
      alert('⚠️ Đã xảy ra lỗi khi xử lý đăng nhập Google!');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Đang xử lý đăng nhập Google...</h2>
      <p>Vui lòng chờ trong giây lát ⏳</p>
    </div>
  );
};

export default GoogleCallback;
