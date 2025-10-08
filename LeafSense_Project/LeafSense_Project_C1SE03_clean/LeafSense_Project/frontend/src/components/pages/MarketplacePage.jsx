import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './MarketplacePage.css'

const MarketplacePage = () => {
  // ===== STATE MANAGEMENT =====
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  // ===== SAMPLE DATA - THAY ĐỔI DỮ LIỆU THẬT TẠI ĐÂY =====
  // Để thay đổi dữ liệu thật, chỉ cần:
  // 1. Thay đổi URL API ở dòng 25
  // 2. Cập nhật cấu trúc dữ liệu trong hàm fetchProducts() nếu cần
  // 3. Dữ liệu mẫu hiện tại sẽ được thay thế bằng dữ liệu từ API
  const sampleProducts = [
    {
      id: 1,
      name: 'Cuprous Fungicide',
      price: 15,
      image: '/api/placeholder/200/200',
      category: 'fungicide',
      description: 'Thuốc diệt nấm gốc đồng hiệu quả cao'
    },
    {
      id: 2,
      name: 'Arabica Coffee Seedlings',
      price: 30,
      image: '/api/placeholder/200/200',
      category: 'seedlings',
      description: 'Cây cà phê Arabica giống chất lượng cao'
    },
    {
      id: 3,
      name: 'Potassium Fertilizer 40',
      price: 32,
      image: '/api/placeholder/200/200',
      category: 'fertilizer',
      description: 'Phân bón Kali 40% cho cây trồng'
    },
    {
      id: 4,
      name: 'Red Fertilizer Pellets',
      price: 26,
      image: '/api/placeholder/200/200',
      category: 'fertilizer',
      description: 'Phân bón dạng viên màu đỏ giàu dinh dưỡng'
    },
    {
      id: 5,
      name: 'Cioc Protect Insecticide',
      price: 18,
      image: '/api/placeholder/200/200',
      category: 'insecticide',
      description: 'Thuốc trừ sâu Cioc Protect an toàn'
    },
    {
      id: 6,
      name: 'Coffee Seedling Bag',
      price: 8,
      image: '/api/placeholder/200/200',
      category: 'accessories',
      description: 'Túi cây cà phê giống chuyên dụng'
    }
  ]

  // ===== API INTEGRATION - THAY ĐỔI URL API TẠI ĐÂY =====
  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // THAY ĐỔI URL API CỦA BẠN TẠI ĐÂY
      const response = await fetch('/api/products') // <-- Thay đổi URL API
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      // MAPPING DỮ LIỆU API - ĐIỀU CHỈNH NẾU CẤU TRÚC KHÁC
      const formattedProducts = data.map(product => ({
        id: product.id,
        name: product.name || product.product_name,
        price: product.price || product.price_value,
        image: product.image || product.image_url || product.thumbnail,
        category: product.category || product.product_category,
        description: product.description || product.product_description
      }))
      
      setProducts(formattedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      // FALLBACK VỀ DỮ LIỆU MẪU NẾU API LỖI
      setProducts(sampleProducts)
    } finally {
      setLoading(false)
    }
  }

  // ===== CART FUNCTIONS =====
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    
    setCartCount(cartCount + 1)
    
    // Hiển thị thông báo (có thể thay bằng toast notification)
    alert(`${product.name} đã được thêm vào giỏ hàng!`)
  }

  const removeFromCart = (productId) => {
    const item = cart.find(item => item.id === productId)
    if (item) {
      if (item.quantity > 1) {
        setCart(cart.map(cartItem =>
          cartItem.id === productId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        ))
      } else {
        setCart(cart.filter(cartItem => cartItem.id !== productId))
      }
      setCartCount(cartCount - 1)
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // ===== LIFECYCLE =====
  useEffect(() => {
    fetchProducts()
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
          <div className="cart-icon" onClick={() => alert(`Giỏ hàng: ${cartCount} sản phẩm - Tổng: $${getTotalPrice()}`)}>
            <span className="cart-count">{cartCount}</span>
            🛒
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="products-grid">
          {products.map(product => (
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
                
                <button 
                  className="add-to-cart-btn"
                  onClick={() => addToCart(product)}
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CART SUMMARY - CÓ THỂ ẨN/HIỆN TÙY THEO THIẾT KẾ */}
        {cart.length > 0 && (
          <div className="cart-summary">
            <h3>Cart Summary</h3>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>${item.price * item.quantity}</span>
                  <button onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <strong>Total: ${getTotalPrice()}</strong>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MarketplacePage
