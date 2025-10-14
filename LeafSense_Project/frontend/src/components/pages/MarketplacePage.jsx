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

  // ===== API INTEGRATION =====
  const API_BASE_URL = 'http://localhost:8000/api'
  
  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/products`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()

      // Nếu API trả rỗng, fallback về dữ liệu mẫu để hiển thị UI
      if (!Array.isArray(data) || data.length === 0) {
        setProducts(sampleProducts)
        return
      }

      // Format products for display
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
    } catch (error) {
      console.error('Error fetching products:', error)
      // Fallback to sample data if API fails
      setProducts(sampleProducts)
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

      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id,
          quantity: 1
        })
      })

      if (response.ok) {
        // Update local cart state
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
        alert(`${product.name} đã được thêm vào giỏ hàng!`)
      } else {
        throw new Error('Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
    }
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

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          total_amount: getTotalPrice(),
          payment_method: 'COD',
          shipping_name: shippingName,
          shipping_phone: shippingPhone,
          shipping_address: shippingAddress,
          order_items: orderItems
        })
      })

      if (response.ok) {
        alert('Order placed successfully!')
        setCart([])
        setCartCount(0)
      } else {
        throw new Error('Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order')
    }
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
