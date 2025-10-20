import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import './AdminCategories.css'

const AdminCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading categories:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
      setLoading(false)
    }
  }

  const addCategory = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:8000/api/admin/categories', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Category added successfully!')
      setShowAddModal(false)
      setFormData({ name: '' })
      loadCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Could not add category')
    }
  }

  const updateCategory = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/admin/categories/${editingCategory.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Updated successfully!')
      setShowEditModal(false)
      setEditingCategory(null)
      setFormData({ name: '' })
      loadCategories()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Update failed')
    }
  }

  const deleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Delete category "${categoryName}"?`)) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/admin/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Category deleted')
        loadCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
        toast.error('Could not delete this category')
      }
    }
  }

  const editCategory = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name })
    setShowEditModal(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="admin-categories">
        <div className="loading">Loading data...</div>
      </div>
    )
  }

  return (
    <div className="admin-categories">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Category Management</h1>
          <p>Manage product categories</p>
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
          className="nav-btn active"
          onClick={() => navigate('/admin/categories')}
        >
          Category Management
        </button>
        <button 
          className="nav-btn"
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

      <div className="categories-controls">
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          Add Category
        </button>
      </div>

      <div className="categories-grid">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-icon">🏷️</div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>ID: {category.id}</p>
              </div>
              <div className="category-actions">
                <button 
                  className="edit-btn"
                  onClick={() => editCategory(category)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteCategory(category.id, category.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">
            <p>No categories yet</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Category</h2>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={addCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Enter category name"
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

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Category</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={updateCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Enter category name"
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

export default AdminCategories
