import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../layout/Layout'
import ShopService from '../../services/shopApi'
import './MarketplacePage.css'

const MarketplacePage = () => {
  const navigate = useNavigate()
  
  // ===== STATE MANAGEMENT =====
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [notification, setNotification] = useState(null)

  // ===== API INTEGRATION =====
  const API_BASE_URL = 'http://localhost:8000/api'

  // ===== NOTIFICATION SYSTEM =====
  const showNotification = (message, type = 'success') => {
    // Clear any existing notification first
    setNotification(null)
    
    // Small delay to ensure clean state
    setTimeout(() => {
      setNotification({ message, type })
      // Auto-hide after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    }, 50)
  }

  // ===== CART SYNC FUNCTIONS =====
  const syncCartFromDatabase = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        setCart([])
        return
      }

      // Lấy giỏ hàng từ database
      const cartData = await ShopService.getCart()
      
      // Convert cart data từ database format sang frontend format
      const cartItems = cartData.cart_items?.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url,
        description: item.product.description,
        stock: item.product.stock,
        quantity: item.quantity
      })) || []

      // Chỉ cập nhật state, không dùng localStorage
      setCart(cartItems)
      
    } catch (error) {
      console.error('Lỗi khi đồng bộ giỏ hàng từ database:', error)
      setCart([])
    }
  }

  useEffect(() => {
    // Chỉ đồng bộ từ database
    syncCartFromDatabase()
  }, [])

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
        showNotification('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'warning')
        return
      }

      // Gọi API để thêm vào database
      await ShopService.addToCart(product.id, 1)
      
      // Đồng bộ lại giỏ hàng từ database
      await syncCartFromDatabase()
      
      showNotification(`${product.name} đã được thêm vào giỏ hàng!`, 'success')
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      showNotification('❌ Không thể thêm sản phẩm vào giỏ hàng', 'error')
    }
  }



  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
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
  }, [])

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
        {/* NOTIFICATION */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-message">{notification.message}</span>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="marketplace-header">
          <div className="header-actions">
            <div 
              className={`cart-icon ${cart.length > 0 ? 'has-items' : ''}`}
              onClick={() => navigate('/cart')}
              title={`Cart: ${cart.length} items - Total: ${getTotalPrice().toLocaleString('vi-VN')}₫`}
            >
              <span className="cart-count">{cart.length}</span>
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

            {/* PRODUCTS SECTION */}
            <div className="products-section">
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
                    <div className="product-price">{product.price.toLocaleString('vi-VN')}₫</div>
                    
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

            </div> {/* End products-section */}
      </div> {/* End marketplace-page */}
    </Layout>
  )
}

export default MarketplacePage
