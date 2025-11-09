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

  const handleApprovePost = async (postId) => {
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

  const handleRejectPost = async (postId) => {
    try {
      const rejectionReason = prompt('Enter rejection reason (optional):')
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason || 'Post does not meet community guidelines'
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

  const handleDeletePost = async (postId, postTitle) => {
    if (window.confirm(`Are you sure you want to delete post "${postTitle}"?`)) {
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
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
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Community Management</h1>
          <p>Manage community posts and activities</p>
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
          className="nav-btn active"
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
                      className="action-btn view"
                      onClick={() => handleViewDetail(post)}
                    >
                      View
                    </button>
                    {post.status === 'pending' && (
                      <>
                        <button 
                          className="action-btn approve"
                          onClick={() => handleApprovePost(post.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="action-btn reject"
                          onClick={() => handleRejectPost(post.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeletePost(post.id, post.title)}
                    >
                      Delete
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
                
                <div className="detail-row">
                  <div className="detail-section">
                    <label>Author:</label>
                    <p>{selectedPost.author}</p>
                  </div>
                  <div className="detail-section">
                    <label>Email:</label>
                    <p>{selectedPost.author_email}</p>
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-section">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedPost.status}`}>
                      {selectedPost.status === 'approved' ? 'Approved' : 
                       selectedPost.status === 'pending' ? 'Pending' : 'Rejected'}
                    </span>
                  </div>
                  <div className="detail-section">
                    <label>ID:</label>
                    <p>#{selectedPost.id}</p>
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-section">
                    <label>Likes:</label>
                    <p>👍 {selectedPost.likes}</p>
                  </div>
                  <div className="detail-section">
                    <label>Comments:</label>
                    <p>💬 {selectedPost.comments}</p>
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-section">
                    <label>Created Date:</label>
                    <p>{formatDate(selectedPost.created_at)}</p>
                  </div>
                  <div className="detail-section">
                    <label>Updated:</label>
                    <p>{formatDate(selectedPost.updated_at)}</p>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                {selectedPost.status === 'pending' && (
                  <>
                    <button 
                      className="action-btn approve"
                      onClick={() => {
                        handleApprovePost(selectedPost.id)
                        setShowDetailModal(false)
                      }}
                    >
                      Approve Post
                    </button>
                    <button 
                      className="action-btn reject"
                      onClick={() => {
                        handleRejectPost(selectedPost.id)
                        setShowDetailModal(false)
                      }}
                    >
                      Reject Post
                    </button>
                  </>
                )}
                <button 
                  className="action-btn delete"
                  onClick={() => {
                    handleDeletePost(selectedPost.id, selectedPost.title)
                    setShowDetailModal(false)
                  }}
                >
                  Delete Post
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCommunity