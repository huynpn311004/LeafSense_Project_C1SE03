import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import './AdminUsers.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, statusFilter])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status_filter', statusFilter)
      
      const response = await axios.get(`http://localhost:8000/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId)
    const action = user?.status === 'active' ? 'khóa' : 'mở khóa'
    
    if (user?.status === 'active' && !window.confirm(
      `Bạn có chắc chắn muốn khóa tài khoản của "${user?.name}"?\n\n` +
      `User sẽ không thể đăng nhập và sẽ nhận được thông báo liên hệ email hỗ trợ.`
    )) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`http://localhost:8000/api/admin/users/${userId}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(response.data.message || `Đã ${action} tài khoản thành công`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error(`${action === 'khóa' ? 'Khóa' : 'Mở khóa'} tài khoản thất bại`)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa user "${userName}"?`)) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Xóa user thành công')
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('Xóa user thất bại')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  if (loading) {
    return (
      <div className="admin-users">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="admin-users">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Quản lý Users</h1>
          <p>Quản lý tài khoản khách hàng</p>
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
          className="nav-btn active"
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
          className="nav-btn"
          onClick={() => navigate('/admin/categories')}
        >
          Quản lý Danh mục
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate('/admin/coupons')}
        >
          Quản lý Mã giảm giá
        </button>
      </div>

      <div className="users-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.address || '-'}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className={`action-btn ${user.status === 'active' ? 'lock' : 'unlock'}`}
                      onClick={() => handleToggleStatus(user.id)}
                    >
                      {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="no-data">
            <p>Không có user nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
