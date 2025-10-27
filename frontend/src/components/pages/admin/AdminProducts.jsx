import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import './AdminProducts.css'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category_id: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [searchTerm, categoryFilter])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter) params.append('category_id', categoryFilter)
      
      const response = await axios.get(`http://localhost:8000/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      }
      
      await axios.post('http://localhost:8000/api/admin/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Product added successfully')
      setShowAddModal(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      }
      
      await axios.put(`http://localhost:8000/api/admin/products/${editingProduct.id}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Product updated successfully')
      setShowEditModal(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete product "${productName}"?`)) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/admin/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Product deleted successfully')
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
        toast.error('Failed to delete product')
      }
    }
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      category_id: product.category_id ? product.category_id.toString() : ''
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      image_url: '',
      category_id: ''
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="admin-products">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-products">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Product Management</h1>
          <p>Manage products and categories</p>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/dashboard')}
        >
          Dashboard
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/users')}
        >
          User Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/categories')}
        >
          Category Management
        </button>
        <button 
          className="nav-btn active"
          onClick={() => navigate('/admin/products')}
        >
          Product Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/orders')}
        >
          Order Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/coupons')}
        >
          Coupon Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/community')}
        >
          Community Management
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/settings')}
        >
          Settings
        </button>
      </div>

      <div className="products-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          Add Product
        </button>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="no-image">📦</div>
              )}
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-details">
                <span className="price">{product.price.toLocaleString('vi-VN')}₫</span>
                <span className="stock">Stock: {product.stock}</span>
              </div>
              <div className="product-actions">
                <button 
                  className="edit-btn"
                  onClick={() => openEditModal(product)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="no-data">
            <p>No products available</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddProduct} className="modal-form">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditProduct} className="modal-form">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts
