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
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    type: 'confirm'
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

  const handleImageUpload = async (file) => {
    try {
      setImageUploading(true)
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('image', file)

      const response = await axios.post(
        'http://localhost:8000/api/admin/upload-product-image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      return response.data.image_url
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Lỗi khi upload ảnh')
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      // Tạo preview URL
      const previewUrl = URL.createObjectURL(file)
      setFormData({ ...formData, image_url: previewUrl })
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = formData.image_url
      
      // Nếu có ảnh mới được chọn, upload lên Firebase
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage)
        if (!imageUrl) return // Nếu upload thất bại, dừng lại
      }
      
      const token = localStorage.getItem('token')
      const productData = {
        ...formData,
        image_url: imageUrl,
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
      let imageUrl = formData.image_url
      
      // Nếu có ảnh mới được chọn, upload lên Firebase
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage)
        if (!imageUrl) return // Nếu upload thất bại, dừng lại
      }
      
      const token = localStorage.getItem('token')
      const productData = {
        ...formData,
        image_url: imageUrl,
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

  const handleDeleteProduct = (productId, productName) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete product "${productName}"?`,
      action: () => executeDeleteProduct(productId),
      type: 'danger'
    })
  }

  const executeDeleteProduct = async (productId) => {
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

  const closeConfirmModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  const onConfirm = () => {
    if (modalConfig.action) {
      modalConfig.action()
    }
    closeConfirmModal()
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
    setSelectedImage(null)
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
    setSelectedImage(null)
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
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
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
                <label>Hình ảnh sản phẩm</label>
                
                {!formData.image_url ? (
                  <div className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden-input"
                      id="add-product-image"
                    />
                    <label htmlFor="add-product-image" className="upload-label">
                      <div className="upload-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="L21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                      <span className="upload-text">
                        {imageUploading ? 'Đang tải lên...' : 'Click để chọn ảnh'}
                      </span>
                      <span className="upload-hint">JPG, PNG, GIF (Max 5MB)</span>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <img src={formData.image_url} alt="Preview" className="preview-image" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData({...formData, image_url: ''})
                        setSelectedImage(null)
                      }}
                      className="remove-image-btn"
                      title="Xóa ảnh"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="url-input-wrapper">
                  <div className="divider">
                    <span>Hoặc nhập URL</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={selectedImage ? '' : formData.image_url}
                    onChange={(e) => {
                      if (!selectedImage) {
                        setFormData({...formData, image_url: e.target.value})
                      }
                    }}
                    disabled={selectedImage !== null}
                    className="url-input"
                  />
                </div>
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
                <label>Hình ảnh sản phẩm</label>
                
                {!formData.image_url ? (
                  <div className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden-input"
                      id="edit-product-image"
                    />
                    <label htmlFor="edit-product-image" className="upload-label">
                      <div className="upload-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="L21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                      <span className="upload-text">
                        {imageUploading ? 'Đang tải lên...' : 'Click để chọn ảnh mới'}
                      </span>
                      <span className="upload-hint">JPG, PNG, GIF (Max 5MB)</span>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <img src={formData.image_url} alt="Preview" className="preview-image" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData({...formData, image_url: ''})
                        setSelectedImage(null)
                      }}
                      className="remove-image-btn"
                      title="Xóa ảnh"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="url-input-wrapper">
                  <div className="divider">
                    <span>Hoặc nhập URL</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={selectedImage ? '' : formData.image_url}
                    onChange={(e) => {
                      if (!selectedImage) {
                        setFormData({...formData, image_url: e.target.value})
                      }
                    }}
                    disabled={selectedImage !== null}
                    className="url-input"
                  />
                </div>
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

      {modalConfig.isOpen && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', padding: '0 0 16px 0' }}>
              <h3 className="modal-title">{modalConfig.title}</h3>
            </div>
            <div className="modal-body">
              {modalConfig.message.split('\n').map((line, i) => (
                <p key={i} style={{ margin: '0 0 8px 0' }}>{line}</p>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button className="modal-btn cancel" onClick={closeConfirmModal}>
                Cancel
              </button>
              <button 
                className={`modal-btn confirm ${modalConfig.type === 'danger' ? 'danger' : ''}`}
                onClick={onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts
