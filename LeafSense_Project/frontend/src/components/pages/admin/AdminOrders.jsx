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
      
      toast.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800'
      case 'processing': return '#2196f3'
      case 'shipping': return '#9c27b0'
      case 'completed': return '#4caf50'
      case 'cancelled': return '#f44336'
      default: return '#666'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'processing': return 'Processing'
      case 'shipping': return 'Shipping'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-orders">

      <div className="orders-controls">
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipping">Shipping</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Order #{order.id}</h3>
                <p>Order Date: {new Date(order.created_at).toLocaleDateString('en-US')}</p>
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
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {order.shipping_name}</p>
                <p><strong>Phone:</strong> {order.shipping_phone}</p>
                <p><strong>Address:</strong> {order.shipping_address}</p>
              </div>

              <div className="order-summary">
                <h4>Order Details</h4>
                <div className="order-items">
                  {order.order_items && order.order_items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>Product ID: {item.product_id}</span>
                      <span>Quantity: {item.quantity}</span>
                      <span>Price: {item.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <strong>Total Amount: {order.total_amount.toLocaleString('vi-VN')}₫</strong>
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
                    Process Order
                  </button>
                  <button 
                    className="action-btn cancel"
                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === 'processing' && (
                <button 
                  className="action-btn ship"
                  onClick={() => handleUpdateOrderStatus(order.id, 'shipping')}
                >
                  Ship Order
                </button>
              )}
              {order.status === 'shipping' && (
                <button 
                  className="action-btn deliver"
                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="no-data">
            <p>No orders available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders
