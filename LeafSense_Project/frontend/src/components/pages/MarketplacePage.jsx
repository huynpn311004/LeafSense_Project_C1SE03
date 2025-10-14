import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './MarketplacePage.css'

const MarketplacePage = () => {
  // ===== STATE MANAGEMENT =====
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // ===== API INTEGRATION =====
  const API_BASE_URL = 'http://localhost:8000/api'
  
  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }
  
  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) return

      const response = await fetch(`${API_BASE_URL}/cart?user_id=${user.id}`)
      if (response.ok) {
        const cartData = await response.json()
        // Convert backend cart format to frontend format
        if (cartData.cart_items && cartData.cart_items.length > 0) {
          const formattedCart = cartData.cart_items.map(item => ({
            id: item.product.id,
            cartItemId: item.id, // Store cart item ID for updates/deletes
            name: item.product.name,
            price: parseFloat(item.product.price),
            image: item.product.image_url || '/api/placeholder/200/200',
            description: item.product.description,
            quantity: item.quantity,
            stock: item.product.stock
          }))
          setCart(formattedCart)
        } else {
          setCart([]) // Clear cart if no items
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }
  
  const fetchProducts = async (search = '', categoryId = '') => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryId) params.append('category_id', categoryId)
      
      const url = `${API_BASE_URL}/products${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()

      // Format products for display
      if (Array.isArray(data) && data.length > 0) {
        const formattedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image_url || '/api/placeholder/200/200',
          category: product.category?.name || 'uncategorized',
          description: product.description,
          stock: product.stock,
          disease_type: product.disease_type
        }))
        
        setProducts(formattedProducts)
      } else {
        setProducts([]) // Set empty array if no products
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // ===== CART FUNCTIONS =====
  const addToCart = async (product) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        alert('Please login to add items to cart')
        return
      }

      // Fix: user_id should be query parameter, not in body
      const response = await fetch(`${API_BASE_URL}/cart/items?user_id=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        })
      })

      if (response.ok) {
        const cartItem = await response.json()
        
        // Update local cart state with backend response
        const existingItem = cart.find(item => item.id === product.id)
        
        if (existingItem) {
          // Update existing item
          setCart(cart.map(item =>
            item.id === product.id
              ? { ...item, quantity: cartItem.quantity, cartItemId: cartItem.id }
              : item
          ))
        } else {
          // Add new item
          setCart([...cart, { 
            ...product, 
            quantity: cartItem.quantity,
            cartItemId: cartItem.id
          }])
        }
        
        alert(`${product.name} đã được thêm vào giỏ hàng!`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
    }
  }

  const removeFromCart = async (productId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) return

      const item = cart.find(item => item.id === productId)
      if (!item || !item.cartItemId) return

      // If quantity > 1, update quantity; otherwise remove item
      if (item.quantity > 1) {
        // Update quantity
        const updateResponse = await fetch(`${API_BASE_URL}/cart/items/${item.cartItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: item.quantity - 1 })
        })
        
        if (updateResponse.ok) {
          setCart(cart.map(cartItem =>
            cartItem.id === productId
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          ))
        } else {
          throw new Error('Failed to update cart item')
        }
      } else {
        // Remove item completely
        const deleteResponse = await fetch(`${API_BASE_URL}/cart/items/${item.cartItemId}`, {
          method: 'DELETE'
        })
        
        if (deleteResponse.ok) {
          setCart(cart.filter(cartItem => cartItem.id !== productId))
        } else {
          throw new Error('Failed to remove cart item')
        }
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      alert('Failed to remove item from cart')
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const checkout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        alert('Please login to checkout')
        return
      }

      if (cart.length === 0) {
        alert('Your cart is empty')
        return
      }

      // Get shipping information
      const shippingName = prompt('Enter your name:')
      const shippingPhone = prompt('Enter your phone:')
      const shippingAddress = prompt('Enter your address:')

      if (!shippingName || !shippingPhone || !shippingAddress) {
        alert('Please provide all shipping information')
        return
      }

      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))

      // Fix: user_id should be query parameter, remove total_amount from body
      const response = await fetch(`${API_BASE_URL}/orders?user_id=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: 'COD',
          shipping_name: shippingName,
          shipping_phone: shippingPhone,
          shipping_address: shippingAddress,
          order_items: orderItems
        })
      })

      if (response.ok) {
        const orderData = await response.json()
        alert(`Order #${orderData.id} placed successfully! Total: $${orderData.total_amount}`)
        // Clear local cart and reload from server
        setCart([])
        await fetchCart()
        await fetchProducts() // Reload products to update stock
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order')
    }
  }

  // ===== SEARCH & FILTER HANDLERS =====
  const handleSearch = async (e) => {
    e.preventDefault()
    await fetchProducts(searchQuery, selectedCategory)
  }

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId)
    await fetchProducts(searchQuery, categoryId)
  }

  // ===== LIFECYCLE =====
  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchCart() // Load cart on page load
  }, [])

  useEffect(() => {
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0))
  }, [cart])

  // ===== RENDER LOADING =====
  if (loading) {
    return (
      <Layout>
        <div className="marketplace-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // ===== RENDER MAIN CONTENT =====
  return (
    <Layout>
      <div className="marketplace-page">
        {/* HEADER */}
        <div className="marketplace-header">
          <h1>Marketplace</h1>
          <div className="header-actions">
            <div className="cart-icon" onClick={() => alert(`Giỏ hàng: ${cartCount} sản phẩm - Tổng: $${getTotalPrice().toFixed(2)}`)}>
              <span className="cart-count">{cartCount}</span>
              🛒
            </div>
          </div>
        </div>
            {/* SEARCH & FILTERS */}
            <div className="marketplace-filters">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">Search</button>
              </form>
              
              <div className="category-filter">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="category-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRODUCTS GRID */}
            <div className="products-grid">
              {products.length === 0 ? (
                <div className="no-products">
                  <p>Không có sản phẩm nào được tìm thấy.</p>
                  <p>Vui lòng kiểm tra kết nối API hoặc thử lại sau.</p>
                </div>
              ) : (
                products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/200/200'
                      }}
                    />
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-price">${product.price}</div>
                    
                    {/* Show stock information */}
                    <div className="product-stock">
                      {product.stock > 0 ? (
                        <span className="in-stock">In Stock ({product.stock})</span>
                      ) : (
                        <span className="out-of-stock">Out of Stock</span>
                      )}
                    </div>
                    
                    {/* Show category if available */}
                    {product.category && (
                      <div className="product-category">
                        Category: {product.category}
                      </div>
                    )}
                    
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to cart'}
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>

            {/* CART SUMMARY */}
            {cart.length > 0 && (
              <div className="cart-summary">
                <h3>Cart Summary</h3>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
                </div>
                <button className="checkout-btn" onClick={checkout}>
                  Checkout
                </button>
              </div>
            )}
      </div>
    </Layout>
  )
}

export default MarketplacePage
