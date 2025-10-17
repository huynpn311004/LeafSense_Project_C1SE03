import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './HistoryPage.css'

const HistoryPage = () => {
  const [filter, setFilter] = useState('all')
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Hàm để lấy dữ liệu từ API
  const fetchHistoryData = async (diseaseFilter = null) => {
    try {
      setLoading(true)
      setError(null)
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('token')
      console.log('🔍 Debug - Token check:', token ? `Found: ${token.substring(0, 20)}...` : 'Not found')
      
      if (!token) {
        console.log('No authentication token found')
        setHistoryData([])
        return
      }

      // Tạo URL với query parameters
      let url = 'http://localhost:8000/api/history?limit=50'
      if (diseaseFilter && diseaseFilter !== 'all') {
        url += `&disease_filter=${diseaseFilter}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired')
          localStorage.removeItem('token')
          setError('Authentication failed. Please login again.')
          setHistoryData([])
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      // Chuyển đổi dữ liệu từ API backend thành format phù hợp
      const formattedData = data.history ? data.history.map((item) => ({
        id: item.id,
        image: item.image || '/api/placeholder/60/60',
        highlight_image: item.highlight_image || null,
        disease: item.disease || 'Unknown',
        confidence: Math.round(item.confidence || 0),
        date: item.date || '',
        time: item.time || '',
        month: item.month || '',
        treatment_recommendation: item.treatment_recommendation || '',
        created_at: item.created_at
      })) : []
      
      setHistoryData(formattedData)
      
      // Hiển thị thông báo nếu không có dữ liệu
      if (formattedData.length === 0 && !diseaseFilter) {
        console.log('No analysis history found for this user')
      }
      
    } catch (error) {
      console.error('Error fetching history data:', error)
      setError(`Failed to load history: ${error.message}`)
      setHistoryData([])
    } finally {
      setLoading(false)
    }
  }

  // Hàm refresh data
  const refreshData = () => {
    fetchHistoryData(filter === 'all' ? null : filter)
  }

  // Gọi API khi component load và khi filter thay đổi
  useEffect(() => {
    fetchHistoryData(filter === 'all' ? null : filter)
  }, [filter])

  // Load initial data
  useEffect(() => {
    fetchHistoryData()
  }, [])



  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981'
    if (confidence >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const handleViewDetails = async (id) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch(`http://localhost:8000/api/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const details = await response.json()
        console.log('Prediction details:', details)
        
        // Tạo modal hoặc navigate để hiển thị chi tiết
        alert(`
Disease: ${details.disease_type}
Confidence: ${details.confidence}%
Date: ${details.created_at}
Treatment: ${details.treatment_recommendation || 'No treatment info available'}
        `)
      } else {
        console.error('Failed to fetch prediction details')
      }
    } catch (error) {
      console.error('Error fetching prediction details:', error)
    }
  }

  const handleDownloadReport = (id) => {
    // Tạo báo cáo đơn giản từ dữ liệu có sẵn
    const item = historyData.find(h => h.id === id)
    if (!item) return

    const reportContent = `
LeafSense Analysis Report
========================

Analysis ID: ${item.id}
Disease Detected: ${item.disease}
Confidence Level: ${item.confidence}%
Analysis Date: ${item.date} ${item.time}

Treatment Recommendation:
${item.treatment_recommendation || 'No specific treatment recommendation available.'}

Generated on: ${new Date().toLocaleString()}
    `

    // Tạo và download file
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leafsense-report-${item.id}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteRecord = async (id) => {
    const item = historyData.find(h => h.id === id)
    if (!item) return

    // Xác nhận xóa
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this analysis record?\n\n` +
      `Disease: ${item.disease}\n` +
      `Confidence: ${item.confidence}%\n` +
      `Date: ${item.date} ${item.time}\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmDelete) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        alert('Please login to delete records')
        return
      }

      const response = await fetch(`http://localhost:8000/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Xóa thành công, cập nhật state
        setHistoryData(prevData => prevData.filter(record => record.id !== id))
        alert('Analysis record deleted successfully!')
        
        // Refresh data để đảm bảo đồng bộ
        refreshData()
      } else if (response.status === 401) {
        console.error('Authentication failed')
        alert('Authentication failed. Please login again.')
        localStorage.removeItem('token')
      } else if (response.status === 404) {
        alert('Record not found. It may have been already deleted.')
        // Refresh data để cập nhật state
        refreshData()
      } else {
        const errorData = await response.json()
        console.error('Delete failed:', errorData)
        alert(`Failed to delete record: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Network error occurred while deleting. Please try again.')
    }
  }

  // Filter data based on selected filter
  const filteredData = historyData.filter(item => {
    if (filter === 'all') return true
    if (filter === 'nodisease') return item.disease.toLowerCase() === 'nodisease' || item.disease.toLowerCase() === 'healthy'
    return item.disease.toLowerCase() === filter.toLowerCase()
  })

  // Sort by date (newest first) by default
  const sortedData = [...filteredData].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
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

  // Kiểm tra nếu người dùng chưa đăng nhập
  const token = localStorage.getItem('token')
  if (!token) {
    return (
      <Layout>
        <div className="history-page">
          <div className="auth-required-container">
            <div className="auth-required-icon">🔐</div>
            <h2>Authentication Required</h2>
            <p>Please login to view your analysis history.</p>
            <button 
              className="login-btn"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Hiển thị error nếu có
  if (error) {
    return (
      <Layout>
        <div className="history-page">
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h2>Error Loading History</h2>
            <p>{error}</p>
            <button 
              className="retry-btn"
              onClick={refreshData}
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="history-page">
        <div className="history-summary">
          <div className="summary-card">
            <div className="summary-value">{historyData.length}</div>
            <div className="summary-label">Total Analysis</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              {filteredData.length}
            </div>
            <div className="summary-label">
              {filter === 'all' ? 'All Results' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Results`}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              {filteredData.length > 0 ? Math.round(filteredData.reduce((acc, item) => acc + item.confidence, 0) / filteredData.length) : 0}%
            </div>
            <div className="summary-label">Avg. Confidence</div>
          </div>
        </div>

        <div className="history-header">
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
                <option value="nodisease">Nodisease</option>
                <option value="phoma">Phoma</option>
                <option value="rust">Rust</option>
                <option value="unknown">Unknown</option>
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
                    <td className="date-cell">
                      <div className="date-info">
                        <span className="date">{item.date}</span>
                        <span className="time">{item.time}</span>
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
                        <button className="download-btn" onClick={() => handleDownloadReport(item.id)} title="Download Report">
                          <span className="btn-icon">📥</span>
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteRecord(item.id)}
                          title="Delete Record"
                        >
                          <span className="btn-icon">🗑️</span>
                          Delete
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
              <h3>
                {filter === 'all' 
                  ? 'No Analysis History' 
                  : `No ${filter === 'nodisease' ? 'Healthy' : filter.charAt(0).toUpperCase() + filter.slice(1)} Analysis Found`
                }
              </h3>
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
