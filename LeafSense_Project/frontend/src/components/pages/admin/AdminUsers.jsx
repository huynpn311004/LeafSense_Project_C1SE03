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
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    type: 'confirm'
  })
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

  const handleToggleStatus = (userId) => {
    const user = users.find(u => u.id === userId)
    const action = user?.status === 'active' ? 'lock' : 'unlock'
    
    if (user?.status === 'active') {
      setModalConfig({
        isOpen: true,
        title: 'Lock Account',
        message: `Are you sure you want to lock account of "${user?.name}"?\n\nUser will not be able to login and will receive notification to contact support email.`,
        action: () => executeToggleStatus(userId, action),
        type: 'danger'
      })
    } else {
      executeToggleStatus(userId, action)
    }
  }

  const executeToggleStatus = async (userId, action) => {
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

  const handleDeleteUser = (userId, userName) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${userName}"?`,
      action: () => executeDeleteUser(userId),
      type: 'danger'
    })
  }

  const executeDeleteUser = async (userId) => {
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

  const closeConfirmModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  const onConfirm = () => {
    if (modalConfig.action) {
      modalConfig.action()
    }
    closeConfirmModal()
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
                      className="edit-btn"
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.status === 'active' ? 'Lock Account' : 'Unlock Account'}
                    >
                      {user.status === 'active' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                        </svg>
                      )}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      title="Delete User"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
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

      {modalConfig.isOpen && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modalConfig.title}</h3>
            </div>
            <div className="modal-body">
              {modalConfig.message.split('\n').map((line, i) => (
                <p key={i} style={{ margin: '0 0 8px 0' }}>{line}</p>
              ))}
            </div>
            <div className="modal-actions">
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

export default AdminUsers
