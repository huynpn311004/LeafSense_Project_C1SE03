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
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    type: 'confirm'
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

  const deleteCategory = (categoryId, categoryName) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${categoryName}"?`,
      action: () => executeDeleteCategory(categoryId),
      type: 'danger'
    })
  }

  const executeDeleteCategory = async (categoryId) => {
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

  const closeConfirmModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  const onConfirm = () => {
    if (modalConfig.action) {
      modalConfig.action()
    }
    closeConfirmModal()
  }

  const editCategory = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name })
    setShowEditModal(true)
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
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteCategory(category.id, category.name)}
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

export default AdminCategories
