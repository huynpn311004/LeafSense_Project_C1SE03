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
    const action = user?.status === 'active' ? 'lock' : 'unlock'
    
    if (user?.status === 'active' && !window.confirm(
      `Are you sure you want to lock account of "${user?.name}"?\n\n` +
      `User will not be able to login and will receive notification to contact support email.`
    )) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`http://localhost:8000/api/admin/users/${userId}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(response.data.message || `Account ${action}ed successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error(`${action === 'lock' ? 'Lock' : 'Unlock'} account failed`)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="admin-users">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-users">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>User Management</h1>
          <p>Manage customer accounts</p>
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
          className="nav-btn active"
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

      <div className="users-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Locked</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
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
                    {user.status === 'active' ? 'Active' : 'Locked'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('en-US')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className={`action-btn ${user.status === 'active' ? 'lock' : 'unlock'}`}
                      onClick={() => handleToggleStatus(user.id)}
                    >
                      {user.status === 'active' ? 'Lock' : 'Unlock'}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="no-data">
            <p>No users available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
