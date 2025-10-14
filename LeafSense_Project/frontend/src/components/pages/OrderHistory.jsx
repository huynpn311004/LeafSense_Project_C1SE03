import React, { useState, useEffect } from 'react'
import './OrderHistory.css'

const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = 'http://localhost:8000/api'

  useEffect(() => {
    if (userId) {
      fetchOrders()
    }
  }, [userId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/orders?user_id=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipping': 'status-shipping',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    }
    
    return `status-badge ${statusColors[status] || ''}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="order-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-empty">
        <p>You haven't placed any orders yet.</p>
      </div>
    )
  }

  return (
    <div className="order-history">
      <h2>Order History</h2>
      
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Order #{order.id}</h3>
                <p className="order-date">{formatDate(order.created_at)}</p>
              </div>
              <div className="order-status">
                <span className={getStatusBadge(order.status)}>
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="order-details">
              <div className="shipping-info">
                <h4>Shipping Information</h4>
                <p><strong>Name:</strong> {order.shipping_name}</p>
                <p><strong>Phone:</strong> {order.shipping_phone}</p>
                <p><strong>Address:</strong> {order.shipping_address}</p>
                <p><strong>Payment:</strong> {order.payment_method}</p>
              </div>
              
              {order.order_items && order.order_items.length > 0 && (
                <div className="order-items">
                  <h4>Items ({order.order_items.length})</h4>
                  <div className="items-list">
                    {order.order_items.map(item => (
                      <div key={item.id} className="order-item">
                        <span className="item-name">{item.product.name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="order-total">
                <strong>Total: ${parseFloat(order.total_amount).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderHistory