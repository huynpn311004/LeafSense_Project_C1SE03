import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../layout/Layout'
import CouponService from '../../services/couponApi'
import ShopService from '../../services/shopApi'
import './CheckoutPage.css'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [orderData, setOrderData] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
    note: ''
  })

  // Get cart data from navigation state or database
  const [cartItems, setCartItems] = useState([])
  
  // State for coupon code
  const [couponData, setCouponData] = useState({
    code: '',
    discount: 0,
    isValid: false,
    isApplied: false,
    error: '',
    loading: false
  })

  // Load cart data when component mounts
  useEffect(() => {
    // Get data from navigation state (from CartPage)
    if (location.state?.cartItems) {
      setCartItems(location.state.cartItems)
      console.log('Loaded data from navigation state:', location.state.cartItems)
      
      // If there's an applied coupon, set it
      if (location.state.appliedCoupon) {
        setCouponData({
          ...couponData,
          code: location.state.appliedCoupon.code,
          discount: location.state.appliedCoupon.discount_percentage,
          isValid: true,
          isApplied: true
        })
      }
    } else {
      // Fallback: get from database if no navigation state
      loadCartFromDatabase()
    }
  }, [])

  const loadCartFromDatabase = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        navigate('/cart') // Redirect về cart nếu chưa login
        return
      }

      const cartData = await ShopService.getCart()
      const cartItems = cartData.cart_items?.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url,
        description: item.product.description,
        stock: item.product.stock,
        quantity: item.quantity,
        cart_item_id: item.id
      })) || []

      setCartItems(cartItems)
    } catch (error) {
      console.error('Error loading cart from database:', error)
      navigate('/cart') // Redirect to cart if error
    }
  }

  // Load list of available coupon codes
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

  const shippingFee = 0 // Free shipping

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

  // Handle coupon code input
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

  // Validate and apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponData.code.trim()) {
      setCouponData(prev => ({ ...prev, error: 'Please enter a coupon code' }))
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
          error: result.error || 'Invalid coupon code'
        }))
      }
    } catch (error) {
      setCouponData(prev => ({
        ...prev,
        isValid: false,
        isApplied: false,
        discount: 0,
        loading: false,
        error: 'An error occurred while checking the coupon code'
      }))
    }
  }

  // Remove coupon code
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

  // Apply coupon code from suggested list
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
      alert('Please fill in all required information!')
      return
    }

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      alert('There are no items in your cart!')
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
      // Prepare order data according to backend API format
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
      
      // Call API to create order
      const createdOrder = await ShopService.createOrder(orderApiData)
      console.log('Order created successfully:', createdOrder)
      
      // Just alert success, cart has been cleared from database
      alert('Order placed successfully!')
      navigate('/orders')
    } catch (error) {
      console.error('Error placing order:', error)
      alert(`An error occurred while placing the order: ${error.message || 'Please try again!'}`)
    }
  }

  return (
    <Layout>
      <div className="checkout-page">
        <div className="checkout-container">
          {/* Order Information */}
          <div className="checkout-form-section">
            <h2>Order Information</h2>
            
            <form onSubmit={handleSubmitOrder} className="checkout-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={orderData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={orderData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={orderData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
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
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="note">Note</label>
                <textarea
                  id="note"
                  name="note"
                  value={orderData.note}
                  onChange={handleInputChange}
                  placeholder="Order notes"
                  rows="3"
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="back-button"
                  onClick={() => navigate('/marketplace')}
                >
                  ← Back to Shopping
                </button>
                <button type="submit" className="order-button">
                  PLACE ORDER
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <h2>Order Summary</h2>
            <div className="order-summary-header">
              <span className="items-count">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="order-items">
              {cartItems.length > 0 ? (
                cartItems.map(item => (
                  <div key={item.id || item._id} className="order-item">
                    <div className="item-details">
                      <div className="item-name">{item.name || item.title || 'Unknown product'}</div>
                      <div className="item-meta">
                        <span className="item-quantity">Quantity: {item.quantity || 1}</span>
                      </div>
                    </div>
                    <div className="item-price">
                      {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-items">
                  <p>No items in cart</p>
                </div>
              )}
            </div>

            {/* Coupon section */}
            {couponData.isApplied && (
              <div className="coupon-section">
                <h3>Coupon Code</h3>
                <div className="applied-coupon-display">
                  <div className="coupon-info">
                    <span className="coupon-code-display">{couponData.code}</span>
                    <span className="coupon-discount-display">
                      -{couponData.discount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="coupon-success">
                    ✅ Coupon code applied
                  </div>
                </div>
              </div>
            )}

            <div className="order-calculations">
              <div className="calculation-row">
                <span>Subtotal:</span>
                <span>{calculateSubtotal().toLocaleString('vi-VN')} ₫</span>
              </div>
              
              <div className="calculation-row">
                <span>Shipping:</span>
                <span>{shippingFee === 0 ? 'Free' : `${shippingFee.toLocaleString('vi-VN')} ₫`}</span>
              </div>

              {couponData.isApplied && (
                <div className="calculation-row discount">
                  <span>Discount ({couponData.code}):</span>
                  <span>-{calculateDiscount().toLocaleString('vi-VN')} ₫</span>
                </div>
              )}

              <div className="total-row">
                <span>Total:</span>
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