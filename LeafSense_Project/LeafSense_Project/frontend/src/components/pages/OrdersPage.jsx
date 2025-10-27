import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import ShopService from '../../services/shopApi';
import './OrdersPage.css';

const OrdersPage = () => {
  // State để lưu trữ dữ liệu đơn hàng
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'processing', 'shipping', 'completed', 'cancelled'

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập để xem lịch sử đơn hàng');
          return;
        }
        
        // Gọi API lấy đơn hàng
        const ordersData = await ShopService.getUserOrders();
        console.log('Orders data:', ordersData);
        
        setOrders(ordersData || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  // Function to refresh orders data
  const refreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await ShopService.getUserOrders();
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error refreshing orders:', error);
      setError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Lọc đơn hàng theo trạng thái
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return ShopService.formatCurrency(amount);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    return ShopService.formatDate(dateString);
  };

  // Lấy class cho trạng thái
  const getStatusClass = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'processing': 'status-processing', 
      'shipping': 'status-shipping',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
  };

  // Lấy text cho trạng thái
  const getStatusText = (status) => {
    return ShopService.getOrderStatusText(status);
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      try {
        await ShopService.updateOrderStatus(orderId, 'cancelled');
        await refreshOrders(); // Refresh the orders list
        alert('Đơn hàng đã được hủy thành công');
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
      }
    }
  };

  // Handle view order details
  const handleViewDetails = (order) => {
    // You can implement a modal or navigate to order details page
    console.log('View order details:', order);
    // For now, just show an alert with order details
    alert(`Chi tiết đơn hàng #${order.id}\nTrạng thái: ${getStatusText(order.status)}\nTổng tiền: ${formatCurrency(order.total_amount)}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="orders-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải lịch sử đơn hàng...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="orders-container">
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h3>Có lỗi xảy ra</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={refreshOrders}>
              Thử lại
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="orders-container">
        <div className="orders-header">
          <h1>Lịch sử đơn hàng</h1>
          <p>Xem lại các đơn hàng bạn đã đặt từ marketplace</p>
        </div>

        {/* Filter Options */}
        <div className="orders-filters">
        <div className="filter-group">
          <label>Lọc theo trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Đang chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7,4V2A1,1 0 0,1 8,1H16A1,1 0 0,1 17,2V4H20A1,1 0 0,1 21,5V7A1,1 0 0,1 20,8H19V19A3,3 0 0,1 16,22H8A3,3 0 0,1 5,19V8H4A1,1 0 0,1 3,7V5A1,1 0 0,1 4,4H7M9,3V4H15V3H9M7,6V8H17V6H7M7,10V19A1,1 0 0,0 8,20H16A1,1 0 0,0 17,19V10H7Z"/>
            </svg>
            <h3>Chưa có đơn hàng nào</h3>
            <p>Bạn chưa đặt đơn hàng nào từ marketplace</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header-section">
                <div className="order-id">
                  <h3>Đơn hàng #{order.id}</h3>
                  <span className={`order-status ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              
              <div className="order-details">
                <div className="shipping-info">
                  <h4>Thông tin giao hàng</h4>
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="info-label">Người nhận:</span>
                      <span className="info-value">{order.shipping_name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Số điện thoại:</span>
                      <span className="info-value">{order.shipping_phone}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Địa chỉ:</span>
                      <span className="info-value">{order.shipping_address}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Thanh toán:</span>
                      <span className="info-value">{ShopService.getPaymentMethodText(order.payment_method)}</span>
                    </div>
                  </div>
                </div>
                
                {order.order_items && order.order_items.length > 0 && (
                  <div className="order-items-section">
                    <h4>Sản phẩm ({order.order_items.length} mặt hàng)</h4>
                    <div className="items-list">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="item-image">
                            <img 
                              src={item.product.image_url || '/api/placeholder/80/80'} 
                              alt={item.product.name}
                            />
                          </div>
                          <div className="item-info">
                            <span className="item-name">{item.product.name}</span>
                            <span className="item-description">{item.product.description}</span>
                            <div className="item-details">
                              <span className="item-quantity">Số lượng: {item.quantity}</span>
                              <span className="item-price">Giá: {formatCurrency(item.price)}</span>
                              <span className="item-total">Tổng: {formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="order-summary">
                  <div className="summary-row">
                    <span className="summary-label">Tổng cộng:</span>
                    <span className="summary-value total-amount">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Ngày đặt:</span>
                    <span className="summary-value">{formatDate(order.created_at)}</span>
                  </div>
                  {order.shipped_at && (
                    <div className="summary-row">
                      <span className="summary-label">Ngày giao:</span>
                      <span className="summary-value">{formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="summary-row">
                      <span className="summary-label">Ngày nhận:</span>
                      <span className="summary-value">{formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                </div>
                
                <div className="order-actions">
                  <button 
                    className="action-button view-details"
                    onClick={() => handleViewDetails(order)}
                  >
                    Xem chi tiết
                  </button>
                  {order.status === 'pending' && (
                    <button 
                      className="action-button cancel-order"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                  {order.status === 'completed' && order.order_items && (
                    <button className="action-button rate-order">
                      Đánh giá sản phẩm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;