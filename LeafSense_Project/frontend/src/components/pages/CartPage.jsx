import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../layout/Layout'
import CouponService from '../../services/couponApi'
import ShopService from '../../services/shopApi'
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
  const [showCoupons, setShowCoupons] = useState(false)

  // ===== CART SYNC FUNCTIONS =====
  const syncCartFromDatabase = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        setCartItems([])
        setLoading(false)
        return
      }

      // Get cart from database
      const cartData = await ShopService.getCart()
      
      // Convert cart data from database format to frontend format
      const cartItems = cartData.cart_items?.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url,
        description: item.product.description,
        stock: item.product.stock,
        quantity: item.quantity,
        cart_item_id: item.id // Save cart item ID for update/delete
      })) || []

      setCartItems(cartItems)
      
    } catch (error) {
      console.error('Error syncing cart from database:', error)
      // Set empty cart if database sync fails
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  // Load cart data when component mounts
  useEffect(() => {
    // Only sync from database
    syncCartFromDatabase()
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
    
    // Use discount_amount from API if available
    if (appliedCoupon.discount_amount !== undefined) {
      return appliedCoupon.discount_amount
    }
    
    // Fallback for compatibility with old data
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
        console.error('Error loading coupons:', result.error)
      }
    } catch (error) {
      console.error('Error loading coupons:', error)
    } finally {
      setLoadingCoupons(false)
    }
  }

  // Apply coupon using API
  const handleApplyCoupon = async () => {
    setCouponError('')
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    try {
      const orderAmount = getSelectedItemsTotal()
      const result = await CouponService.validateCoupon(couponCode, orderAmount)
      
      if (result.success && result.data.valid) {
        // Check if same coupon is already applied
        if (appliedCoupon && appliedCoupon.coupon?.code === couponCode.toUpperCase()) {
          setCouponError('This coupon has already been applied')
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
        setCouponError(result.data?.message || result.error || 'Invalid coupon code')
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      setCouponError('An error occurred while applying the coupon')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleIncreaseQuantity = async (itemId) => {
    try {
      const currentItem = cartItems.find(item => item.id === itemId)
      if (!currentItem) return

      // Call API to update in database
      if (currentItem.cart_item_id) {
        await ShopService.updateCartItem(currentItem.cart_item_id, currentItem.quantity + 1)
      }

      // Update local state
      const newCartItems = cartItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      setCartItems(newCartItems)
      
    } catch (error) {
      console.error('Error increasing quantity:', error)
      // If API fails, still update local state
      const newCartItems = cartItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      setCartItems(newCartItems)
    }
  }

  const handleDecreaseQuantity = async (itemId) => {
    try {
      const currentItem = cartItems.find(item => item.id === itemId)
      if (!currentItem) return
      
      if (currentItem.quantity === 1) {
        // Show confirmation popup when quantity reaches 0
        const confirmRemove = window.confirm(`Do you want to remove "${currentItem.name}" from your cart?`)
        
        if (confirmRemove) {
          // Call API to remove from database
          if (currentItem.cart_item_id) {
            await ShopService.removeFromCart(currentItem.cart_item_id)
          }

          // Remove product from cart
          const newCartItems = cartItems.filter(item => item.id !== itemId)
          setCartItems(newCartItems)
        }
        // If not confirmed, do nothing (keep quantity = 1)
      } else {
        // Call API to update in database
        if (currentItem.cart_item_id) {
          await ShopService.updateCartItem(currentItem.cart_item_id, currentItem.quantity - 1)
        }

        // Decrease quantity normally
        const newCartItems = cartItems.map(item => 
          item.id === itemId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        setCartItems(newCartItems)
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error)
      // If API fails, still update local state as before
      const currentItem = cartItems.find(item => item.id === itemId)
      
      if (currentItem && currentItem.quantity === 1) {
        const confirmRemove = window.confirm(`Do you want to remove "${currentItem.name}" from your cart?`)
        
        if (confirmRemove) {
          const newCartItems = cartItems.filter(item => item.id !== itemId)
          setCartItems(newCartItems)
        }
      } else {
        const newCartItems = cartItems.map(item => 
          item.id === itemId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        setCartItems(newCartItems)
      }
    }
  }



  const handleContinueShopping = () => {
    navigate('/marketplace')
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!')
      return
    }
    
    // Pass data via navigation state instead of localStorage
    navigate('/checkout', {
      state: {
        cartItems: cartItems,
        appliedCoupon: appliedCoupon
      }
    })
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to remove all products from your cart?')) {
      try {
        // Call API to clear cart from database
        await ShopService.clearCart()
      } catch (error) {
        console.error('Error clearing cart from database:', error)
      }

      // Clear local state
      setCartItems([])
      setAppliedCoupon(null)
      setCouponCode('')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="cart-page-loading">
          <div className="loading-spinner"></div>
          <p>Loading cart...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="cart-page">
        <div className="cart-page-header">
          <div className="cart-header-info">
          </div>
          {cartItems.length > 0 && (
            <div className="cart-header-controls">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                  onChange={handleSelectAll}
                />
                <span>Select all</span>
              </label>
              <button className="clear-cart-btn" onClick={handleClearCart}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to start shopping!</p>
            <button className="continue-shopping-btn" onClick={handleContinueShopping}>
              Continue shopping
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
                    <p className="cart-item-price">{item.price.toLocaleString('vi-VN')}₫</p>
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
                        {(item.price * item.quantity).toLocaleString('vi-VN')}₫
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
              <h3>Checkout</h3>
              
              {/* Coupon Section */}
              <div className="coupon-section">
                <h4>Coupon Code</h4>
                {!appliedCoupon ? (
                  <div className="coupon-input-section">
                    <div className="coupon-input-group">
                      <div className="coupon-combobox-wrapper">
                        <input
                          type="text"
                          placeholder="Select or enter coupon code..."
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value)
                            setShowCoupons(true)
                          }}
                          onClick={() => setShowCoupons(!showCoupons)}
                          className="coupon-input"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <button 
                          className="coupon-dropdown-toggle"
                          onClick={() => setShowCoupons(!showCoupons)}
                        >
                          ▼
                        </button>
                        
                        {/* Dropdown List */}
                        {showCoupons && availableCoupons.length > 0 && (
                          <div className="coupon-dropdown-list">
                            {availableCoupons.map((coupon) => (
                              <div 
                                key={coupon.id} 
                                className={`coupon-dropdown-item ${coupon.can_use ? 'usable' : 'disabled'}`}
                                onClick={() => {
                                  if (coupon.can_use) {
                                    setCouponCode(coupon.code)
                                    setShowCoupons(false)
                                  }
                                }}
                              >
                                <div className="coupon-code-badge">{coupon.code}</div>
                                <div className="coupon-info-text">
                                  <span className="coupon-name">{coupon.name}</span>
                                  {coupon.description && <span className="coupon-desc">{coupon.description}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        className="apply-coupon-btn"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <div className="coupon-error">{couponError}</div>
                    )}
                    
                    {loadingCoupons && (
                      <div className="loading-coupons">Loading coupons...</div>
                    )}
                  </div>
                ) : (
                  <div className="applied-coupon">
                    <span className="coupon-code">{appliedCoupon.code}</span>
                    <div className="coupon-info">
                      <span className="coupon-desc">{appliedCoupon.description}</span>
                    </div>
                    <button 
                      className="remove-coupon-btn"
                      onClick={handleRemoveCoupon}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal ({selectedItems.size} items):</span>
                  <span>{getSelectedItemsTotal().toLocaleString('vi-VN')}₫</span>
                </div>
                {appliedCoupon && (
                  <div className="summary-row discount-row">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span className="discount-amount">-{getSelectedItemsDiscount().toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span className="free-shipping">Free</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span className="total-price">{getSelectedItemsFinalPrice().toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              <div className="cart-actions">
                <button 
                  className="continue-shopping-btn"
                  onClick={handleContinueShopping}
                >
                  ← Continue shopping
                </button>
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={selectedItems.size === 0}
                >
                  Checkout now →
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