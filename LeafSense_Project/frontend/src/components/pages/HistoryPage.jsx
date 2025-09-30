import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './HistoryPage.css'

const HistoryPage = () => {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('month')
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)

  // Hàm để lấy dữ liệu từ API
  const fetchHistoryData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/history') // Thay đổi URL API của bạn
      const data = await response.json()
      
      // Chuyển đổi dữ liệu từ API thành format phù hợp
      const formattedData = data.map((item, index) => ({
        id: item.id || index + 1,
        image: item.image_url || '/api/placeholder/60/60',
        disease: item.disease_name || 'Unknown',
        confidence: item.confidence_score || 0,
        severity: item.severity_level || 'Unknown',
        date: new Date(item.created_at).toLocaleDateString('en-US'),
        time: new Date(item.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        month: new Date(item.created_at).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
      }))
      
      setHistoryData(formattedData)
    } catch (error) {
      console.error('Error fetching history data:', error)
      // Fallback về dữ liệu mẫu nếu API lỗi
      setHistoryData([
    {
      id: 1,
      image: '/api/placeholder/60/60',
      disease: 'Rust',
      confidence: 92,
      severity: 'Severe',
      date: '12/15/2023',
      time: '14:30',
      month: 'December 2023'
    },
    {
      id: 2,
      image: '/api/placeholder/60/60',
      disease: 'Phoma',
      confidence: 85,
      severity: 'Moderate',
      date: '11/28/2023',
      time: '12:15',
      month: 'November 2023'
    },
    {
      id: 3,
      image: '/api/placeholder/60/60',
      disease: 'Miner',
      confidence: 96,
      severity: 'Mild',
      date: '10/15/2023',
      time: '10:45',
      month: 'October 2023'
    },
    {
      id: 4,
      image: '/api/placeholder/60/60',
      disease: 'Healthy',
      confidence: 99,
      severity: 'None',
      date: '09/24/2023',
      time: '09:20',
      month: 'September 2023'
    },
    {
      id: 5,
      image: '/api/placeholder/60/60',
      disease: 'Rust',
      confidence: 87,
      severity: 'Moderate',
      date: '08/10/2023',
      time: '08:10',
      month: 'August 2023'
    },
    {
      id: 6,
      image: '/api/placeholder/60/60',
      disease: 'Phoma',
      confidence: 78,
      severity: 'Severe',
      date: '12/05/2023',
      time: '16:20',
      month: 'December 2023'
    },
    {
      id: 7,
      image: '/api/placeholder/60/60',
      disease: 'Healthy',
      confidence: 95,
      severity: 'None',
      date: '11/10/2023',
      time: '11:30',
      month: 'November 2023'
    }
  ])
    } finally {
      setLoading(false)
    }
  }

  // Gọi API khi component load
  useEffect(() => {
    fetchHistoryData()
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return '#ef4444'
      case 'moderate':
        return '#f59e0b'
      case 'mild':
        return '#10b981'
      case 'none':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981'
    if (confidence >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const handleViewDetails = (id) => {
    console.log('View details for analysis:', id)
    // Bạn sẽ implement logic xem chi tiết ở đây
  }

  const handleDownloadReport = (id) => {
    console.log('Download report for analysis:', id)
    // Bạn sẽ implement logic tải báo cáo ở đây
  }

  // Filter data based on selected filter
  const filteredData = historyData.filter(item => {
    if (filter === 'all') return true
    if (filter === 'nodisease') return item.disease.toLowerCase() === 'healthy'
    return item.disease.toLowerCase() === filter.toLowerCase()
  })

  // Sort data based on selected sort option
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        // Sort by date (newest first)
        return new Date(b.date) - new Date(a.date)
      case 'month':
        // Sort by month (newest first)
        return new Date(b.date) - new Date(a.date)
      case 'confidence':
        // Sort by confidence (highest first)
        return b.confidence - a.confidence
      case 'severity':
        // Sort by severity (Severe > Moderate > Mild > None)
        const severityOrder = { 'Severe': 4, 'Moderate': 3, 'Mild': 2, 'None': 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      case 'disease':
        // Sort by disease name (alphabetical)
        return a.disease.localeCompare(b.disease)
      default:
        return 0
    }
  })

  // Hiển thị loading nếu đang tải dữ liệu
  if (loading) {
    return (
      <Layout>
        <div className="history-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading history data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="history-page">
        <div className="history-header">
          <h1>History of Analysis</h1>
          <div className="history-controls">
            <div className="filter-group">
              <label htmlFor="filter">Filter by:</label>
              <select 
                id="filter" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Analysis</option>
                <option value="miner">Miner</option>
                <option value="nodisease">No Disease</option>
                <option value="phoma">Phoma</option>
                <option value="rust">Rust</option>
              </select>
            </div>
            <div className="sort-group">
              <label htmlFor="sort">Sort by:</label>
              <select 
                id="sort" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="month">Month (Newest)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="history-content">
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Disease</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item) => (
                  <tr key={item.id} className="history-row">
                    <td className="image-cell">
                      <div className="analysis-image">
                        <img 
                          src={item.image} 
                          alt={`Analysis ${item.id}`}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="image-placeholder">
                          <span className="image-icon">🌿</span>
                        </div>
                      </div>
                    </td>
                    <td className="disease-cell">
                      <span className="disease-name">{item.disease}</span>
                    </td>
                    <td className="confidence-cell">
                      <div className="confidence-container">
                        <span 
                          className="confidence-value"
                          style={{ color: getConfidenceColor(item.confidence) }}
                        >
                          {item.confidence}%
                        </span>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill"
                            style={{ 
                              width: `${item.confidence}%`,
                              backgroundColor: getConfidenceColor(item.confidence)
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="severity-cell">
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(item.severity) }}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="date-cell">
                      <div className="date-info">
                        <span className="date">{item.date}</span>
                        <span className="time">{item.time}</span>
                        {sortBy === 'month' && (
                          <span className="month-info">{item.month}</span>
                        )}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewDetails(item.id)}
                          title="View Details"
                        >
                          <span className="btn-icon">👁️</span>
                          View
                        </button>
                        <button 
                          className="download-btn"
                          onClick={() => handleDownloadReport(item.id)}
                          title="Download Report"
                        >
                          <span className="btn-icon">📥</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedData.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>
                {filter === 'all' 
                  ? 'No Analysis History' 
                  : `No ${filter === 'nodisease' ? 'Healthy' : filter.charAt(0).toUpperCase() + filter.slice(1)} Analysis Found`
                }
              </h3>
              <p>
                {filter === 'all' 
                  ? 'You haven\'t performed any plant analysis yet.' 
                  : `No analysis results found for ${filter === 'nodisease' ? 'healthy plants' : filter.toLowerCase()}.`
                }
              </p>
              <button className="start-analysis-btn">
                {filter === 'all' ? 'Start Your First Analysis' : 'View All Analysis'}
              </button>
            </div>
          )}
        </div>

        <div className="history-pagination">
          <div className="pagination-info">
            Showing 1-{sortedData.length} of {sortedData.length} results
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled>
              <span>←</span>
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn" disabled>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default HistoryPage
