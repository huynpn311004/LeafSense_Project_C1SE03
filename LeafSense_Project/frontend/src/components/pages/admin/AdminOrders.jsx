import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import './AdminOrders.css'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (statusFilter) params.append('status_filter', statusFilter)
      
      const response = await axios.get(`http://localhost:8000/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/admin/orders/${orderId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Cập nhật trạng thái đơn hàng thành công')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Cập nhật trạng thái đơn hàng thất bại')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800'
      case 'processing': return '#2196f3'
      case 'shipped': return '#9c27b0'
      case 'delivered': return '#4caf50'
      case 'cancelled': return '#f44336'
      default: return '#666'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'processing': return 'Đang xử lý'
      case 'shipped': return 'Đã giao hàng'
      case 'delivered': return 'Đã nhận hàng'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Quản lý Đơn hàng</h1>
          <p>Duyệt và quản lý đơn hàng</p>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/dashboard')}
        >
          Dashboard
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/users')}
        >
          Quản lý Users
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/products')}
        >
          Quản lý Sản phẩm
        </button>
        <button 
          className="nav-btn active"
          onClick={() => navigate('/admin/orders')}
        >
          Quản lý Đơn hàng
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/categories')}
        >
          Quản lý Danh mục
        </button>
      </div>

      <div className="orders-controls">
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipped">Đã giao hàng</option>
            <option value="delivered">Đã nhận hàng</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Đơn hàng #{order.id}</h3>
                <p>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="order-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            <div className="order-details">
              <div className="customer-info">
                <h4>Thông tin khách hàng</h4>
                <p><strong>Tên:</strong> {order.shipping_name}</p>
                <p><strong>SĐT:</strong> {order.shipping_phone}</p>
                <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
              </div>

              <div className="order-summary">
                <h4>Chi tiết đơn hàng</h4>
                <div className="order-items">
                  {order.order_items && order.order_items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>Sản phẩm ID: {item.product_id}</span>
                      <span>Số lượng: {item.quantity}</span>
                      <span>Giá: {item.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <strong>Tổng tiền: {order.total_amount.toLocaleString('vi-VN')}₫</strong>
                </div>
              </div>
            </div>

            <div className="order-actions">
              {order.status === 'pending' && (
                <>
                  <button 
                    className="action-btn process"
                    onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                  >
                    Xử lý đơn hàng
                  </button>
                  <button 
                    className="action-btn cancel"
                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                  >
                    Hủy đơn hàng
                  </button>
                </>
              )}
              {order.status === 'processing' && (
                <button 
                  className="action-btn ship"
                  onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                >
                  Giao hàng
                </button>
              )}
              {order.status === 'shipped' && (
                <button 
                  className="action-btn deliver"
                  onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                >
                  Xác nhận đã nhận
                </button>
              )}
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="no-data">
            <p>Không có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders
