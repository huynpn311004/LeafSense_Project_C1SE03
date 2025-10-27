import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../layout/Layout'
import CouponService from '../../services/couponApi'
import './CartPage.css'

const CartPage = () => {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)

  // Load cart data khi component mount
  useEffect(() => {
    const loadCartData = () => {
      try {
        // Lấy dữ liệu từ localStorage hoặc sessionStorage
        const savedCart = localStorage.getItem('marketplaceCart') || localStorage.getItem('checkoutCart')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          setCartItems(parsedCart)
        } else {
          // Nếu không có dữ liệu, có thể lấy từ API
          setCartItems([])
        }
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu giỏ hàng:', error)
        setCartItems([])
      } finally {
        setLoading(false)
      }
    }

    loadCartData()

    // Lắng nghe sự thay đổi localStorage để đồng bộ real-time
    const handleStorageChange = (e) => {
      if (e.key === 'marketplaceCart') {
        try {
          const newCartData = e.newValue ? JSON.parse(e.newValue) : []
          setCartItems(newCartData)
        } catch (error) {
          console.error('Lỗi khi đồng bộ giỏ hàng:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Cleanup listener khi component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Load available coupons when cart changes
  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.size > 0) {
      loadAvailableCoupons()
    }
  }, [selectedItems, cartItems])

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0
    const subtotal = getTotalPrice()
    if (appliedCoupon.type === 'percentage') {
      return subtotal * (appliedCoupon.value / 100)
    } else {
      return Math.min(appliedCoupon.value, subtotal)
    }
  }

  const getFinalPrice = () => {
    return getTotalPrice() - getDiscountAmount()
  }

  // Checkbox handling functions
  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set()) // Unselect all
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id))) // Select all
    }
  }

  // Calculate totals for selected items only
  const getSelectedItemsTotal = () => {
    return cartItems
      .filter(item => selectedItems.has(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getSelectedItemsDiscount = () => {
    if (!appliedCoupon) return 0
    
    // Sử dụng discount_amount từ API nếu có
    if (appliedCoupon.discount_amount !== undefined) {
      return appliedCoupon.discount_amount
    }
    
    // Fallback để tương thích với dữ liệu cũ
    const subtotal = getSelectedItemsTotal()
    if (appliedCoupon.type === 'percentage') {
      return subtotal * (appliedCoupon.value / 100)
    } else {
      return Math.min(appliedCoupon.value, subtotal)
    }
  }

  const getSelectedItemsFinalPrice = () => {
    return getSelectedItemsTotal() - getSelectedItemsDiscount()
  }

  // Load available coupons
  const loadAvailableCoupons = async () => {
    setLoadingCoupons(true)
    try {
      const orderAmount = getSelectedItemsTotal()
      const result = await CouponService.getAvailableCoupons(orderAmount)
      
      if (result.success) {
        setAvailableCoupons(result.data)
      } else {
        console.error('Lỗi khi tải coupon:', result.error)
      }
    } catch (error) {
      console.error('Lỗi khi tải coupon:', error)
    } finally {
      setLoadingCoupons(false)
    }
  }

  // Apply coupon using API
  const handleApplyCoupon = async () => {
    setCouponError('')
    
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá')
      return
    }

    try {
      const orderAmount = getSelectedItemsTotal()
      const result = await CouponService.validateCoupon(couponCode, orderAmount)
      
      if (result.success && result.data.valid) {
        // Check if same coupon is already applied
        if (appliedCoupon && appliedCoupon.coupon?.code === couponCode.toUpperCase()) {
          setCouponError('Mã giảm giá này đã được áp dụng')
          return
        }

        setAppliedCoupon({
          code: result.data.coupon.code,
          type: result.data.coupon.coupon_type,
          value: result.data.coupon.value,
          description: result.data.coupon.description,
          discount_amount: result.data.discount_amount,
          coupon: result.data.coupon
        })
        setCouponCode('')
        setCouponError('')
      } else {
        setCouponError(result.data?.message || result.error || 'Mã giảm giá không hợp lệ')
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng coupon:', error)
      setCouponError('Có lỗi xảy ra khi áp dụng mã giảm giá')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
    // Xóa coupon data khỏi localStorage
    localStorage.removeItem('checkoutCoupon')
  }

  const handleIncreaseQuantity = (itemId) => {
    const newCartItems = cartItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
    setCartItems(newCartItems)
    // Cập nhật localStorage
    updateLocalStorage(newCartItems)
  }

  const handleDecreaseQuantity = (itemId) => {
    const currentItem = cartItems.find(item => item.id === itemId)
    
    if (currentItem && currentItem.quantity === 1) {
      // Hiện popup xác nhận khi số lượng về 0
      const confirmRemove = window.confirm(`Bạn có muốn xóa "${currentItem.name}" khỏi giỏ hàng không?`)
      
      if (confirmRemove) {
        // Xóa sản phẩm khỏi giỏ hàng
        const newCartItems = cartItems.filter(item => item.id !== itemId)
        setCartItems(newCartItems)
        updateLocalStorage(newCartItems)
      }
      // Nếu không xác nhận, không làm gì cả (giữ nguyên quantity = 1)
    } else {
      // Giảm số lượng bình thường
      const newCartItems = cartItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      setCartItems(newCartItems)
      updateLocalStorage(newCartItems)
    }
  }



  const updateLocalStorage = (newCartItems) => {
    setTimeout(() => {
      localStorage.setItem('marketplaceCart', JSON.stringify(newCartItems))
    }, 100)
  }

  const handleContinueShopping = () => {
    navigate('/marketplace')
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Giỏ hàng trống!')
      return
    }
    
    // Lưu thông tin giỏ hàng và mã giảm giá vào localStorage để truyền sang trang checkout
    const checkoutData = {
      items: cartItems,
      appliedCoupon: appliedCoupon
    }
    
    localStorage.setItem('checkoutCart', JSON.stringify(cartItems))
    localStorage.setItem('checkoutCoupon', JSON.stringify(appliedCoupon))
    navigate('/checkout')
  }

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      setCartItems([])
      setAppliedCoupon(null)
      setCouponCode('')
      localStorage.removeItem('marketplaceCart')
      localStorage.removeItem('checkoutCart')
      localStorage.removeItem('checkoutCoupon')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="cart-page-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="cart-page">
        <div className="cart-page-header">
          <h1>🛒 Giỏ hàng của bạn</h1>
          <div className="cart-header-info">
            <span className="cart-count">{cartItems.length} sản phẩm</span>
            {cartItems.length > 0 && (
              <>
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span>Chọn tất cả</span>
                </label>
                <button className="clear-cart-btn" onClick={handleClearCart}>
                  Xóa tất cả
                </button>
              </>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy thêm một số sản phẩm vào giỏ hàng để bắt đầu mua sắm!</p>
            <button className="continue-shopping-btn" onClick={handleContinueShopping}>
              Tiếp tục mua hàng
            </button>
          </div>
        ) : (
          <div className="cart-content">
            {/* Cart Items */}
            <div className="cart-items-section">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item-card">
                  {/* Checkbox */}
                  <div className="cart-item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </div>

                  {/* Product Image */}
                  <div className="cart-item-image">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/80/80'
                      }}
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="cart-item-info">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <p className="cart-item-price">${item.price}</p>
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn decrease"
                          onClick={() => handleDecreaseQuantity(item.id)}
                        >
                          -
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-btn increase"
                          onClick={() => handleIncreaseQuantity(item.id)}
                          disabled={item.quantity >= (item.stock || 999)}
                        >
                          +
                        </button>
                      </div>
                      <div className="item-total">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        )}

        {/* Fixed Cart Summary at bottom */}
        {selectedItems.size > 0 && (
          <div className="cart-summary-fixed">
            <div className="summary-card">
              <h3>Thanh toán ({selectedItems.size} sản phẩm)</h3>
              
              {/* Coupon Section */}
              <div className="coupon-section">
                <h4>Mã giảm giá</h4>
                {!appliedCoupon ? (
                  <div className="coupon-input-section">
                    <div className="coupon-input-group">
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá..."
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="coupon-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button 
                        className="apply-coupon-btn"
                        onClick={handleApplyCoupon}
                      >
                        Áp dụng
                      </button>
                    </div>
                    {couponError && (
                      <div className="coupon-error">{couponError}</div>
                    )}
                    
                    {/* Available Coupons List */}
                    {availableCoupons.length > 0 && (
                      <div className="available-coupons">
                        <h5>Mã giảm giá có thể sử dụng:</h5>
                        <div className="coupons-list">
                          {availableCoupons.map((coupon) => (
                            <div 
                              key={coupon.id} 
                              className={`coupon-item ${coupon.can_use ? 'usable' : 'disabled'}`}
                              onClick={() => coupon.can_use && setCouponCode(coupon.code)}
                            >
                              <div className="coupon-details">
                                <span className="coupon-item-code">{coupon.code}</span>
                                <span className="coupon-item-desc">{coupon.description}</span>
                                {!coupon.can_use && coupon.reason && (
                                  <span className="coupon-item-reason">{coupon.reason}</span>
                                )}
                              </div>
                              {coupon.can_use && (
                                <button 
                                  className="use-coupon-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCouponCode(coupon.code)
                                    handleApplyCoupon()
                                  }}
                                >
                                  Sử dụng
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {loadingCoupons && (
                      <div className="loading-coupons">Đang tải mã giảm giá...</div>
                    )}
                  </div>
                ) : (
                  <div className="applied-coupon">
                    <div className="coupon-info">
                      <span className="coupon-code">🎟️ {appliedCoupon.code}</span>
                      <span className="coupon-desc">{appliedCoupon.description}</span>
                    </div>
                    <button 
                      className="remove-coupon-btn"
                      onClick={handleRemoveCoupon}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Tạm tính ({selectedItems.size} sản phẩm):</span>
                  <span>${getSelectedItemsTotal().toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="summary-row discount-row">
                    <span>Giảm giá ({appliedCoupon.code}):</span>
                    <span className="discount-amount">-${getSelectedItemsDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Phí vận chuyển:</span>
                  <span className="free-shipping">Miễn phí</span>
                </div>
                <div className="summary-row total-row">
                  <span>Tổng cộng:</span>
                  <span className="total-price">${getSelectedItemsFinalPrice().toFixed(2)}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button 
                  className="continue-shopping-btn"
                  onClick={handleContinueShopping}
                >
                  ← Tiếp tục mua hàng
                </button>
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={selectedItems.size === 0}
                >
                  Thanh toán ngay →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CartPage