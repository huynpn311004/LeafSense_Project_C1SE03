import React, { useState, useEffect } from 'react'
import ShopService from '../../services/shopApi'
import './OrderHistory.css'

const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const ordersData = await ShopService.getUserOrders()
      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.')
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
    return ShopService.formatDate(dateString)
  }

  const formatCurrency = (amount) => {
    return ShopService.formatCurrency(amount)
  }

  if (loading) {
    return (
      <div className="order-history-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải lịch sử đơn hàng...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-history-empty">
        <p>{error}</p>
        <button onClick={fetchOrders} className="retry-btn">
          Thử lại
        </button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-empty">
        <p>Bạn chưa có đơn hàng nào.</p>
      </div>
    )
  }

  return (
    <div className="order-history">
      <h2>Lịch sử đơn hàng</h2>
      
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Đơn hàng #{order.id}</h3>
                <p className="order-date">{formatDate(order.created_at)}</p>
              </div>
              <div className="order-status">
                <span className={getStatusBadge(order.status)}>
                  {ShopService.getOrderStatusText(order.status)}
                </span>
              </div>
            </div>
            
            <div className="order-details">
              <div className="shipping-info">
                <h4>Thông tin giao hàng</h4>
                <p><strong>Người nhận:</strong> {order.shipping_name}</p>
                <p><strong>Số điện thoại:</strong> {order.shipping_phone}</p>
                <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                <p><strong>Thanh toán:</strong> {ShopService.getPaymentMethodText(order.payment_method)}</p>
              </div>
              
              {order.order_items && order.order_items.length > 0 && (
                <div className="order-items">
                  <h4>Sản phẩm ({order.order_items.length})</h4>
                  <div className="items-list">
                    {order.order_items.map(item => (
                      <div key={item.id} className="order-item">
                        <span className="item-name">{item.product.name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="order-total">
                <strong>Tổng cộng: {formatCurrency(order.total_amount)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderHistory