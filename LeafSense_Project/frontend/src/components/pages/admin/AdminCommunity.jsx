import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './AdminCommunity.css'

const API_BASE_URL = 'http://localhost:8000'

const AdminCommunity = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [modalInput, setModalInput] = useState('')
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    type: 'confirm',
    showInput: false,
    inputPlaceholder: ''
  })
  const navigate = useNavigate()

  // API helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Fetch posts from backend API
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/posts`, {
        headers: getAuthHeaders()
      })
      
      if (response.status === 401) {
        // Token expired or invalid
        toast.error('Session expired. Please login again.')
        handleLogout()
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        // Transform backend data to match frontend format
        const transformedPosts = data.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          images: post.image_url ? [
            post.image_url.startsWith('http') 
              ? post.image_url 
              : `${API_BASE_URL}${post.image_url}`
          ] : [],
          author: post.user.name,
          author_email: post.user.email,
          status: post.status === 'published' ? 'approved' : post.status,
          likes: 0, // Backend doesn't have this data yet
          comments: 0, // Backend doesn't have this data yet  
          created_at: post.created_at,
          updated_at: post.updated_at
        }))
        setPosts(transformedPosts)
      } else {
        toast.error('Failed to fetch posts')
        console.error('Failed to fetch posts:', response.statusText)
      }
    } catch (error) {
      toast.error('Error connecting to server')
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to access admin panel')
      navigate('/login')
      return
    }
    fetchPosts()
  }, [])

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Map frontend status filter to backend format
    let backendStatusFilter = statusFilter
    if (statusFilter === 'approved') {
      backendStatusFilter = 'approved' // Keep as approved for display
    }
    
    const matchesStatus = statusFilter === '' || post.status === backendStatusFilter
    return matchesSearch && matchesStatus
  })

  const handleApprovePost = (postId) => {
    setModalConfig({
      isOpen: true,
      title: 'Approve Post',
      message: 'Are you sure you want to approve this post?',
      action: () => executeApprovePost(postId),
      type: 'confirm'
    })
  }

  const executeApprovePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        handleLogout()
        return
      }
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, status: 'approved' } : post
        ))
        toast.success('Post approved successfully')
      } else {
        toast.error('Failed to approve post')
      }
    } catch (error) {
      toast.error('Error approving post')
      console.error('Error approving post:', error)
    }
  }

  const handleRejectPost = (postId) => {
    setModalInput('')
    setModalConfig({
      isOpen: true,
      title: 'Reject Post',
      message: 'Please enter the reason for rejection:',
      showInput: true,
      inputPlaceholder: 'Reason for rejection...',
      action: (reason) => executeRejectPost(postId, reason),
      type: 'danger'
    })
  }

  const executeRejectPost = async (postId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: reason || 'Post does not meet community guidelines'
        })
      })
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        handleLogout()
        return
      }
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, status: 'rejected' } : post
        ))
        toast.success('Post rejected successfully')
      } else {
        toast.error('Failed to reject post')
      }
    } catch (error) {
      toast.error('Error rejecting post')
      console.error('Error rejecting post:', error)
    }
  }

  const handleDeletePost = (postId, postTitle) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Post',
      message: `Are you sure you want to delete post "${postTitle}"?`,
      action: () => executeDeletePost(postId),
      type: 'danger'
    })
  }

  const executeDeletePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        handleLogout()
        return
      }
      
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId))
        toast.success('Post deleted successfully')
      } else {
        toast.error('Failed to delete post')
      }
    } catch (error) {
      toast.error('Error deleting post')
      console.error('Error deleting post:', error)
    }
  }

  const closeConfirmModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  const onConfirm = () => {
    if (modalConfig.action) {
      modalConfig.action(modalInput)
    }
    closeConfirmModal()
  }

  const handleViewDetail = (post) => {
    setSelectedPost(post)
    setShowDetailModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="admin-community">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-community">

      <div className="community-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by title or author..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="community-table-container">
        <table className="community-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Email</th>
              <th>Status</th>
              <th>Interactions</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>
                  <div className="post-title">
                    <strong 
                      className="clickable-title"
                      onClick={() => handleViewDetail(post)}
                    >
                      {post.title}
                    </strong>
                    <p className="post-preview">
                      {post.content.substring(0, 50)}...
                      {post.images && post.images.length > 0 && (
                        <span className="image-indicator"> 📷 {post.images.length}</span>
                      )}
                    </p>
                  </div>
                </td>
                <td>{post.author}</td>
                <td>{post.author_email}</td>
                <td>
                  <span className={`status-badge ${post.status}`}>
                    {post.status === 'approved' ? 'Approved' : 
                     post.status === 'pending' ? 'Pending' : 'Rejected'}
                  </span>
                </td>
                <td>
                  <div className="interaction-stats">
                    <span>👍 {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </td>
                <td>{new Date(post.created_at).toLocaleDateString('en-US')}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="icon-btn view"
                      onClick={() => handleViewDetail(post)}
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    {post.status === 'pending' && (
                      <>
                        <button 
                          className="icon-btn approve"
                          onClick={() => handleApprovePost(post.id)}
                          title="Approve"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                        <button 
                          className="icon-btn reject"
                          onClick={() => handleRejectPost(post.id)}
                          title="Reject"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </>
                    )}
                    <button 
                      className="icon-btn delete"
                      onClick={() => handleDeletePost(post.id, post.title)}
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        
        {filteredPosts.length === 0 && (
          <div className="no-data">
            <p>No posts available</p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="modal-overlay">
          <div className="modal post-detail-modal">
            <div className="modal-header">
              <h2>Post Details</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="post-detail-content">
                <div className="detail-section">
                  <label>Title:</label>
                  <h3>{selectedPost.title}</h3>
                </div>
                
                <div className="detail-section">
                  <label>Content:</label>
                  <div className="post-content">
                    {selectedPost.content}
                  </div>
                </div>
                
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="detail-section">
                    <label>Attached Images:</label>
                    <div className="post-images">
                      {selectedPost.images.map((image, index) => (
                        <div key={index} className="image-container">
                          <img 
                            src={image} 
                            alt={`Post image ${index + 1}`}
                            className="post-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="meta-grid">
                  <div className="detail-item">
                    <label>Author</label>
                    <p>{selectedPost.author}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedPost.author_email}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Status</label>
                    <div>
                      <span className={`status-badge ${selectedPost.status}`}>
                        {selectedPost.status === 'approved' ? 'Approved' : 
                         selectedPost.status === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>ID</label>
                    <p>#{selectedPost.id}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Likes</label>
                    <p>👍 {selectedPost.likes}</p>
                  </div>
                  <div className="detail-item">
                    <label>Comments</label>
                    <p>💬 {selectedPost.comments}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Created Date</label>
                    <p>{formatDate(selectedPost.created_at)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Updated</label>
                    <p>{formatDate(selectedPost.updated_at)}</p>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                {selectedPost.status === 'pending' && (
                  <>
                    <button 
                      className="icon-btn approve"
                      onClick={() => {
                        handleApprovePost(selectedPost.id)
                        setShowDetailModal(false)
                      }}
                      title="Approve"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                    <button 
                      className="icon-btn reject"
                      onClick={() => {
                        handleRejectPost(selectedPost.id)
                        setShowDetailModal(false)
                      }}
                      title="Reject"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </>
                )}
                <button 
                  className="icon-btn delete"
                  onClick={() => {
                    handleDeletePost(selectedPost.id, selectedPost.title)
                    setShowDetailModal(false)
                  }}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setShowDetailModal(false)}
                  style={{ height: '32px', display: 'flex', alignItems: 'center' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalConfig.isOpen && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', padding: '0 0 16px 0' }}>
              <h3 className="modal-title">{modalConfig.title}</h3>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {modalConfig.message.split('\n').map((line, i) => (
                <p key={i} style={{ margin: '0 0 8px 0' }}>{line}</p>
              ))}
              {modalConfig.showInput && (
                <textarea
                  className="modal-input"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder={modalConfig.inputPlaceholder}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              )}
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

export default AdminCommunity