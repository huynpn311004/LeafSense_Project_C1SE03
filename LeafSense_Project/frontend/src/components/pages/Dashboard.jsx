import React, { useState } from 'react';
import Layout from '../layout/Layout';
import './Dashboard.css';

const Dashboard = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Upload form handlers
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Chat handlers
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, { type: 'user', message: newMessage }]);
      setNewMessage('');
      // Simulate AI response
      setTimeout(() => {
        setChatMessages(prev => [...prev, { type: 'ai', message: 'Cảm ơn bạn đã hỏi! Tôi có thể giúp bạn phân tích ảnh lá cây hoặc trả lời các câu hỏi về thực vật.' }]);
      }, 1000);
    }
  };

  return (
    <Layout>
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Total Analysis</h3>
              <p className="stat-number">1,234</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌿</div>
            <div className="stat-info">
              <h3>Plant Species</h3>
              <p className="stat-number">567</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Accuracy Rate</h3>
              <p className="stat-number">94.2%</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>This Month</h3>
              <p className="stat-number">89</p>
            </div>
          </div>
        </div>
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🌱</div>
              <div className="activity-content">
                <p><strong>New analysis completed</strong></p>
                <p>Rose - 95% confidence</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📷</div>
              <div className="activity-content">
                <p><strong>Image uploaded</strong></p>
                <p>leaf_sample_001.jpg</p>
                <span className="activity-time">4 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
