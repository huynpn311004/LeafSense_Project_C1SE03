import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './AdminStatistics.css'

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [chartType, setChartType] = useState('line') // 'line' or 'bar'
  const [filterType, setFilterType] = useState('month') // 'day', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  })

  useEffect(() => {
    fetchRevenueData()
  }, [filterType, selectedDate])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Build query params based on filter type
      const params = new URLSearchParams()
      if (filterType === 'year') {
        params.append('year', selectedDate.year)
      } else if (filterType === 'month') {
        params.append('year', selectedDate.year)
        params.append('month', selectedDate.month)
      } else if (filterType === 'day') {
        params.append('year', selectedDate.year)
        params.append('month', selectedDate.month)
        params.append('day', selectedDate.day)
      }

      const response = await axios.get(
        `http://localhost:8000/api/admin/revenue/statistics?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data) {
        setRevenueData(response.data.data || [])
        setTotalRevenue(response.data.total_revenue || 0)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      // Use mock data for development
      const mockData = generateMockData()
      setRevenueData(mockData.data)
      setTotalRevenue(mockData.total)
      toast.error('Không thể tải dữ liệu thống kê. Đang hiển thị dữ liệu mẫu.')
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const data = []
    let total = 0
    
    if (filterType === 'year') {
      for (let i = 1; i <= 12; i++) {
        const revenue = Math.floor(Math.random() * 5000000) + 1000000
        total += revenue
        data.push({
          period: `Tháng ${i}`,
          revenue: revenue,
          orders: Math.floor(Math.random() * 50) + 10
        })
      }
    } else if (filterType === 'month') {
      const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        const revenue = Math.floor(Math.random() * 500000) + 50000
        total += revenue
        data.push({
          period: `Ngày ${i}`,
          revenue: revenue,
          orders: Math.floor(Math.random() * 10) + 1
        })
      }
    } else {
      for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, '0')
        const revenue = Math.floor(Math.random() * 50000) + 5000
        total += revenue
        data.push({
          period: `${hour}:00`,
          revenue: revenue,
          orders: Math.floor(Math.random() * 5) + 1
        })
      }
    }
    
    return { data, total }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getMaxRevenue = () => {
    if (revenueData.length === 0) return 1000000
    return Math.max(...revenueData.map(d => d.revenue)) * 1.2
  }

  const renderChart = () => {
    if (revenueData.length === 0) {
      return <div className="no-chart-data">Không có dữ liệu để hiển thị</div>
    }

    const maxRevenue = getMaxRevenue()
    const chartHeight = 300
    const barWidth = chartType === 'bar' ? Math.max(20, 400 / revenueData.length) : 0

    return (
      <div className="chart-container">
        <div className="chart" style={{ height: `${chartHeight}px` }}>
          {chartType === 'line' ? (
            <svg width="100%" height={chartHeight} className="line-chart">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                points={revenueData.map((d, i) => {
                  const x = (i / (revenueData.length - 1 || 1)) * 90 + 5
                  const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 40) - 20
                  return `${x}%,${y}`
                }).join(' ')}
                fill="none"
                stroke="#2E7D32"
                strokeWidth="3"
              />
              <polygon
                points={`5%,${chartHeight - 20} ${revenueData.map((d, i) => {
                  const x = (i / (revenueData.length - 1 || 1)) * 90 + 5
                  const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 40) - 20
                  return `${x}%,${y}`
                }).join(' ')} 95%,${chartHeight - 20}`}
                fill="url(#lineGradient)"
              />
              {revenueData.map((d, i) => {
                const x = (i / (revenueData.length - 1 || 1)) * 90 + 5
                const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 40) - 20
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={y}
                    r="5"
                    fill="#2E7D32"
                    className="chart-point"
                  />
                )
              })}
            </svg>
          ) : (
            <div className="bar-chart">
              {revenueData.map((d, i) => {
                const height = (d.revenue / maxRevenue) * (chartHeight - 40)
                return (
                  <div key={i} className="bar-item">
                    <div
                      className="bar"
                      style={{
                        height: `${height}px`,
                        width: `${barWidth}px`
                      }}
                      title={formatMoney(d.revenue)}
                    />
                    <span className="bar-label">{d.period}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="chart-labels">
          {revenueData.map((d, i) => (
            <span key={i} className="chart-label">
              {d.period}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-statistics">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    )
  }

  return (
    <div className="admin-statistics">
      <div className="total-revenue-card">
        <div className="revenue-label">Tổng Doanh Thu</div>
        <div className="revenue-amount">{formatMoney(totalRevenue)}</div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Loại biểu đồ:</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="filter-select"
          >
            <option value="line">Biểu đồ đường</option>
            <option value="bar">Biểu đồ cột</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Bộ lọc:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Năm:</label>
          <input
            type="number"
            value={selectedDate.year}
            onChange={(e) => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}
            className="filter-input"
            min="2020"
            max={new Date().getFullYear()}
          />
        </div>

        {filterType !== 'year' && (
          <div className="filter-group">
            <label>Tháng:</label>
            <input
              type="number"
              value={selectedDate.month}
              onChange={(e) => setSelectedDate({ ...selectedDate, month: parseInt(e.target.value) })}
              className="filter-input"
              min="1"
              max="12"
            />
          </div>
        )}

        {filterType === 'day' && (
          <div className="filter-group">
            <label>Ngày:</label>
            <input
              type="number"
              value={selectedDate.day}
              onChange={(e) => setSelectedDate({ ...selectedDate, day: parseInt(e.target.value) })}
              className="filter-input"
              min="1"
              max="31"
            />
          </div>
        )}
      </div>

      <div className="chart-section">
        <div className="chart-card">
          <h3>Biểu đồ doanh thu</h3>
          {renderChart()}
        </div>
      </div>

      <div className="revenue-table-section">
        <div className="table-card">
          <h3>Bảng doanh thu chi tiết</h3>
          <div className="table-container">
            <table className="revenue-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Doanh thu</th>
                  <th>Số đơn hàng</th>
                  <th>Trung bình/đơn</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.length > 0 ? (
                  revenueData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.period}</td>
                      <td className="revenue-cell">{formatMoney(item.revenue)}</td>
                      <td>{item.orders || 0}</td>
                      <td>{formatMoney(item.revenue / (item.orders || 1))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">Không có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStatistics

