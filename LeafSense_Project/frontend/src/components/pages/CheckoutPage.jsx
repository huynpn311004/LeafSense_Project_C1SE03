import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../layout/Layout'
import CouponService from '../../services/couponApi'
import ShopService from '../../services/shopApi'
import './CheckoutPage.css'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
    note: ''
  })

  // Lấy dữ liệu giỏ hàng từ localStorage
  const [cartItems, setCartItems] = useState([])
  
  // State cho mã giảm giá
  const [couponData, setCouponData] = useState({
    code: '',
    discount: 0,
    isValid: false,
    isApplied: false,
    error: '',
    loading: false
  })
  


  // Load cart data khi component mount
  React.useEffect(() => {
    let cartData = null
    
    try {
      // Ưu tiên lấy từ checkoutCart (từ CartPage)
      const checkoutCart = localStorage.getItem('checkoutCart')
      if (checkoutCart) {
        cartData = JSON.parse(checkoutCart)
        console.log('Đã tải dữ liệu từ checkoutCart:', cartData)
      } else {
        // Backup: lấy từ marketplaceCart (trực tiếp từ marketplace)
        const marketplaceCart = localStorage.getItem('marketplaceCart')
        if (marketplaceCart) {
          cartData = JSON.parse(marketplaceCart)
          console.log('Đã tải dữ liệu từ marketplaceCart:', cartData)
          // Lưu vào checkoutCart để đồng nhất
          localStorage.setItem('checkoutCart', marketplaceCart)
        }
      }
      
      // Load coupon data từ CartPage
      const savedCoupon = localStorage.getItem('checkoutCoupon')
      if (savedCoupon) {
        try {
          const parsedCoupon = JSON.parse(savedCoupon)
          if (parsedCoupon) {
            setCouponData({
              code: parsedCoupon.coupon?.code || '',
              discount: parsedCoupon.discount_amount || 0,
              isValid: true,
              isApplied: true,
              error: '',
              loading: false
            })
            console.log('Đã tải mã giảm giá từ CartPage:', parsedCoupon)
          }
        } catch (error) {
          console.error('Lỗi khi đọc dữ liệu coupon:', error)
        }
      }
      
      if (cartData && Array.isArray(cartData) && cartData.length > 0) {
        setCartItems(cartData)
        console.log('Đã set cart items:', cartData)
      } else {
        // Không có dữ liệu hợp lệ, redirect về marketplace
        console.warn('Không có sản phẩm nào trong giỏ hàng!')
        alert('Không có sản phẩm nào trong giỏ hàng!')
        navigate('/marketplace')
      }
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu giỏ hàng:', error)
      alert('Có lỗi xảy ra khi tải dữ liệu giỏ hàng!')
      navigate('/marketplace')
    }
  }, [navigate])

  // Load danh sách mã giảm giá có sẵn
  const loadAvailableCoupons = async () => {
    try {
      const result = await CouponService.getAvailableCoupons(calculateSubtotal())
      if (result.success && result.data) {
        setAvailableCoupons(result.data)
      }
    } catch (error) {
      console.error('Error loading available coupons:', error)
    }
  }

  const shippingFee = 0 // Miễn phí vận chuyển

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateDiscount = () => {
    if (!couponData.isApplied) return 0
    return couponData.discount || 0
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    return subtotal + shippingFee - discount
  }

  // Xử lý nhập mã giảm giá
  const handleCouponCodeChange = (e) => {
    const code = e.target.value.toUpperCase()
    setCouponData(prev => ({
      ...prev,
      code: code,
      error: '',
      isValid: false,
      isApplied: false
    }))
  }

  // Validate và apply mã giảm giá
  const handleApplyCoupon = async () => {
    if (!couponData.code.trim()) {
      setCouponData(prev => ({ ...prev, error: 'Vui lòng nhập mã giảm giá' }))
      return
    }

    setCouponData(prev => ({ ...prev, loading: true, error: '' }))

    try {
      const orderAmount = calculateSubtotal()
      const result = await CouponService.validateCoupon(couponData.code, orderAmount)

      if (result.success) {
        setCouponData(prev => ({
          ...prev,
          isValid: true,
          isApplied: true,
          discount: result.data.discount_amount || 0,
          loading: false,
          error: ''
        }))
      } else {
        setCouponData(prev => ({
          ...prev,
          isValid: false,
          isApplied: false,
          discount: 0,
          loading: false,
          error: result.error || 'Mã giảm giá không hợp lệ'
        }))
      }
    } catch (error) {
      setCouponData(prev => ({
        ...prev,
        isValid: false,
        isApplied: false,
        discount: 0,
        loading: false,
        error: 'Có lỗi xảy ra khi kiểm tra mã giảm giá'
      }))
    }
  }

  // Hủy bỏ mã giảm giá
  const handleRemoveCoupon = () => {
    setCouponData({
      code: '',
      discount: 0,
      isValid: false,
      isApplied: false,
      error: '',
      loading: false
    })
  }

  // Áp dụng mã giảm giá từ danh sách gợi ý
  const handleSelectSuggestedCoupon = (coupon) => {
    setCouponData(prev => ({
      ...prev,
      code: coupon.code,
      error: ''
    }))
    setShowAvailableCoupons(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!orderData.fullName || !orderData.address || !orderData.phone || !orderData.email) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
      return
    }

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      alert('Không có sản phẩm nào trong giỏ hàng!')
      return
    }

    // Prepare order data
    const orderPayload = {
      customer: orderData,
      items: cartItems,
      summary: {
        subtotal: calculateSubtotal(),
        shippingFee: shippingFee,
        discount: calculateDiscount(),
        total: calculateTotal(),
        coupon: couponData.isApplied ? {
          code: couponData.code,
          discount: couponData.discount
        } : null
      },
      timestamp: new Date().toISOString()
    }

    console.log('Submitting Order:', orderPayload)
    
    try {
      // Chuẩn bị dữ liệu đơn hàng theo format API backend
      const orderApiData = {
        total_amount: calculateTotal(),
        payment_method: orderData.paymentMethod || 'COD',
        shipping_name: orderData.fullName,
        shipping_phone: orderData.phone,
        shipping_address: orderData.address,
        order_items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      }

      console.log('Creating order with data:', orderApiData)
      
      // Gọi API tạo đơn hàng
      const createdOrder = await ShopService.createOrder(orderApiData)
      console.log('Order created successfully:', createdOrder)
      
      // Xóa dữ liệu giỏ hàng và coupon sau khi đặt hàng thành công
      localStorage.removeItem('checkoutCart')
      localStorage.removeItem('checkoutCoupon')
      localStorage.removeItem('marketplaceCart')
      
      alert('Đặt hàng thành công!')
      navigate('/orders')
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error)
      alert(`Có lỗi xảy ra khi đặt hàng: ${error.message || 'Vui lòng thử lại!'}`)
    }
  }

  return (
    <Layout>
      <div className="checkout-page">
        <div className="checkout-container">
          {/* Thông tin đặt hàng */}
          <div className="checkout-form-section">
            <h2>Thông tin đặt hàng</h2>
            
            <form onSubmit={handleSubmitOrder} className="checkout-form">
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={orderData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Địa chỉ *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={orderData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Điện thoại *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={orderData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={orderData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="note">Ghi chú</label>
                <textarea
                  id="note"
                  name="note"
                  value={orderData.note}
                  onChange={handleInputChange}
                  placeholder="Ghi chú về đơn hàng"
                  rows="3"
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="back-button"
                  onClick={() => navigate('/marketplace')}
                >
                  ← Quay lại mua hàng
                </button>
                <button type="submit" className="order-button">
                  ĐẶT HÀNG
                </button>
              </div>
            </form>
          </div>

          {/* Đơn hàng */}
          <div className="order-summary-section">
            <h2>Đơn hàng</h2>
            <div className="order-summary-header">
              <span className="items-count">
                {cartItems.length} sản phẩm
              </span>
              {/* Debug info - có thể xóa sau khi fix */}
              {process.env.NODE_ENV === 'development' && (
                <details style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                  <summary>Debug Info</summary>
                  <pre>{JSON.stringify(cartItems, null, 2)}</pre>
                </details>
              )}
            </div>
            
            <div className="order-items">
              {cartItems.length > 0 ? (
                cartItems.map(item => (
                  <div key={item.id || item._id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name || item.title || 'Sản phẩm không xác định'}</span>
                      <span className="item-quantity">(x{item.quantity || 1})</span>
                    </div>
                    <div className="item-price">
                      {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-items">
                  <p>Không có sản phẩm nào trong giỏ hàng</p>
                </div>
              )}
            </div>

            {/* Mã giảm giá section */}
            {couponData.isApplied && (
              <div className="coupon-section">
                <h3>Mã giảm giá</h3>
                <div className="applied-coupon-display">
                  <div className="coupon-info">
                    <span className="coupon-code-display">{couponData.code}</span>
                    <span className="coupon-discount-display">
                      -{couponData.discount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="coupon-success">
                    ✅ Mã giảm giá đã được áp dụng
                  </div>
                </div>
              </div>
            )}

            <div className="order-calculations">
              <div className="calculation-row">
                <span>Tạm tính:</span>
                <span>{calculateSubtotal().toLocaleString('vi-VN')} ₫</span>
              </div>
              
              <div className="calculation-row">
                <span>Phí vận chuyển:</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} ₫`}</span>
              </div>

              {couponData.isApplied && (
                <div className="calculation-row discount">
                  <span>Giảm giá ({couponData.code}):</span>
                  <span>-{calculateDiscount().toLocaleString('vi-VN')} ₫</span>
                </div>
              )}

              <div className="total-row">
                <span>Tổng đơn:</span>
                <span className="total-price">{calculateTotal().toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CheckoutPage