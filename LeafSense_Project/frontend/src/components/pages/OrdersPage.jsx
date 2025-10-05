import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import './OrdersPage.css';

const OrdersPage = () => {
  // State để lưu trữ dữ liệu đơn hàng
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed', 'cancelled'

  // Mock data - SẼ THAY THẰNG BẰNG API CALLS
  const mockOrders = [
    {
      id: 'ORD-001',
      productName: 'Cây Trầu Bà Vàng',
      sellerName: 'Nguyễn Văn A',
      price: 150000,
      quantity: 2,
      totalAmount: 300000,
      status: 'completed',
      orderDate: '2024-01-15',
      deliveryDate: '2024-01-18',
      image: '/api/placeholder/150/150',
      description: 'Cây trầu bà vàng khỏe mạnh, phù hợp trang trí văn phòng'
    },
    {
      id: 'ORD-002',
      productName: 'Cây Lưỡi Hổ',
      sellerName: 'Trần Thị B',
      price: 200000,
      quantity: 1,
      totalAmount: 200000,
      status: 'pending',
      orderDate: '2024-01-20',
      deliveryDate: null,
      image: '/api/placeholder/150/150',
      description: 'Cây lưỡi hổ mini, dễ chăm sóc'
    },
    {
      id: 'ORD-003',
      productName: 'Cây Kim Tiền',
      sellerName: 'Lê Văn C',
      price: 180000,
      quantity: 3,
      totalAmount: 540000,
      status: 'cancelled',
      orderDate: '2024-01-10',
      deliveryDate: null,
      image: '/api/placeholder/150/150',
      description: 'Cây kim tiền phong thủy'
    },
    {
      id: 'ORD-004',
      productName: 'Cây Monstera Deliciosa',
      sellerName: 'Phạm Thị D',
      price: 350000,
      quantity: 1,
      totalAmount: 350000,
      status: 'completed',
      orderDate: '2024-01-12',
      deliveryDate: '2024-01-15',
      image: '/api/placeholder/150/150',
      description: 'Cây Monstera đẹp, lá to'
    },
    {
      id: 'ORD-005',
      productName: 'Cây Fiddle Leaf Fig',
      sellerName: 'Hoàng Văn E',
      price: 500000,
      quantity: 1,
      totalAmount: 500000,
      status: 'pending',
      orderDate: '2024-01-22',
      deliveryDate: null,
      image: '/api/placeholder/150/150',
      description: 'Cây Fiddle Leaf Fig cao cấp'
    }
  ];

  // TODO: THAY THẰNG BẰNG API CALLS
  // useEffect(() => {
  //   const fetchOrders = async () => {
  //     try {
  //       setLoading(true);
  //       
  //       // API call để lấy đơn hàng đã mua
  //       const response = await fetch('/api/orders/purchased', {
  //         headers: {
  //           'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //           'Content-Type': 'application/json'
  //         }
  //       });
  //       const data = await response.json();
  //       
  //       setOrders(data.orders || []);
  //     } catch (error) {
  //       console.error('Error fetching orders:', error);
  //       // Fallback to mock data
  //       setOrders(mockOrders);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   
  //   fetchOrders();
  // }, []);

  // Tạm thời sử dụng mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  // Lọc đơn hàng theo trạng thái
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Lấy class cho trạng thái
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  // Lấy text cho trạng thái
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="orders-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải lịch sử mua hàng...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="orders-container">
        <div className="orders-header">
          <h1>Lịch sử mua hàng</h1>
          <p>Xem lại các sản phẩm bạn đã mua từ marketplace</p>
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
            <option value="pending">Đang xử lý</option>
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
            <p>Bạn chưa mua sản phẩm nào từ marketplace</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-image">
                <img src={order.image} alt={order.productName} />
              </div>
              
              <div className="order-details">
                <div className="order-header">
                  <h3 className="product-name">{order.productName}</h3>
                  <span className={`order-status ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <p className="product-description">{order.description}</p>
                
                <div className="order-info">
                  <div className="info-row">
                    <span className="info-label">Người bán:</span>
                    <span className="info-value">{order.sellerName}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Số lượng:</span>
                    <span className="info-value">{order.quantity}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Giá:</span>
                    <span className="info-value">{formatCurrency(order.price)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Tổng tiền:</span>
                    <span className="info-value total-amount">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Ngày đặt:</span>
                    <span className="info-value">{formatDate(order.orderDate)}</span>
                  </div>
                  
                  {order.deliveryDate && (
                    <div className="info-row">
                      <span className="info-label">Ngày giao:</span>
                      <span className="info-value">{formatDate(order.deliveryDate)}</span>
                    </div>
                  )}
                </div>
                
                <div className="order-actions">
                  <button className="action-button view-details">
                    Xem chi tiết
                  </button>
                  {order.status === 'pending' && (
                    <button className="action-button cancel-order">
                      Hủy đơn hàng
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button className="action-button rate-order">
                      Đánh giá
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