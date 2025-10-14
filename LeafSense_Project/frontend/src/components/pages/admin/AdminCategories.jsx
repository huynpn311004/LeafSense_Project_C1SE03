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
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:8000/api/admin/categories', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Thêm danh mục thành công')
      setShowAddModal(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Thêm danh mục thất bại')
    }
  }

  const handleEditCategory = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/admin/categories/${editingCategory.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Cập nhật danh mục thành công')
      setShowEditModal(false)
      setEditingCategory(null)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Cập nhật danh mục thất bại')
    }
  }

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`)) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/admin/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Xóa danh mục thành công')
        fetchCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
        toast.error(error.response?.data?.detail || 'Xóa danh mục thất bại')
      }
    }
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: ''
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  if (loading) {
    return (
      <div className="admin-categories">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="admin-categories">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Quản lý Danh mục</h1>
          <p>Quản lý danh mục sản phẩm</p>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
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
          Quản lý Users
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/products')}
        >
          Quản lý Sản phẩm
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/orders')}
        >
          Quản lý Đơn hàng
        </button>
        <button 
          className="nav-btn active"
          onClick={() => navigate('/admin/categories')}
        >
          Quản lý Danh mục
        </button>
      </div>

      <div className="categories-controls">
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          Thêm danh mục
        </button>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <div className="category-icon">🏷️</div>
            <div className="category-info">
              <h3>{category.name}</h3>
              <p>ID: {category.id}</p>
            </div>
            <div className="category-actions">
              <button 
                className="edit-btn"
                onClick={() => openEditModal(category)}
              >
                Sửa
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteCategory(category.id, category.name)}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
        
        {categories.length === 0 && (
          <div className="no-data">
            <p>Không có danh mục nào</p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thêm danh mục mới</h2>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddCategory} className="modal-form">
              <div className="form-group">
                <label>Tên danh mục</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Sửa danh mục</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditCategory} className="modal-form">
              <div className="form-group">
                <label>Tên danh mục</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Hủy
                </button>
                <button type="submit">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCategories
