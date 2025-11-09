import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import './CommunityPage.css'

const CommunityPage = () => {
  // ===== STATE MANAGEMENT =====
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState({
    content: '',
    image: null,
    imagePreview: null
  })
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // ===== SAMPLE DATA - THAY ĐỔI DỮ LIỆU THẬT TẠI ĐÂY =====
  useEffect(() => {
    // THAY ĐỔI API CALL CỦA BẠN TẠI ĐÂY
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        
        // API CALL - THAY ĐỔI URL CỦA BẠN
        const response = await fetch('/api/community/posts', { // <-- Thay URL API
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Thêm headers khác nếu cần:
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = await response.json()
        
        // MAPPING DỮ LIỆU API - ĐIỀU CHỈNH NẾU CẤU TRÚC KHÁC
        setPosts(data.posts || data) // <-- Điều chỉnh tên trường
        
      } catch (error) {
        console.error('Error fetching posts:', error)
        
        // FALLBACK DATA - XÓA KHI TÍCH HỢP API THẬT
        setPosts([
          {
            id: 1,
            author: {
              name: 'Nguyễn Văn A',
              avatar: 'https://via.placeholder.com/40',
              role: 'Nông dân'
            },
            content: 'Hôm nay thu hoạch được rất nhiều rau xanh tươi ngon! Cảm ơn hệ thống LeafSense đã giúp tôi chăm sóc cây trồng tốt hơn. 🌱',
            image: 'https://via.placeholder.com/400x300',
            timestamp: '2024-01-15T10:30:00Z',
            likes: {
              total: 24,
              reactions: {
                heart: 15,
                laugh: 5,
                like: 4
              }
            },
            comments: [
              {
                id: 1,
                author: {
                  name: 'Trần Thị B',
                  avatar: 'https://via.placeholder.com/30'
                },
                content: 'Chúc mừng bạn! Rau trông rất tươi ngon.',
                timestamp: '2024-01-15T11:00:00Z'
              },
              {
                id: 2,
                author: {
                  name: 'Lê Văn C',
                  avatar: 'https://via.placeholder.com/30'
                },
                content: 'Bạn có thể chia sẻ kinh nghiệm chăm sóc không?',
                timestamp: '2024-01-15T11:30:00Z'
              }
            ]
          },
          {
            id: 2,
            author: {
              name: 'Phạm Thị D',
              avatar: 'https://via.placeholder.com/40',
              role: 'Chuyên gia nông nghiệp'
            },
            content: 'Mẹo nhỏ: Sử dụng phân hữu cơ sẽ giúp cây trồng phát triển tốt hơn và an toàn cho sức khỏe. Hãy thử áp dụng nhé!',
            image: null,
            timestamp: '2024-01-14T15:45:00Z',
            likes: {
              total: 18,
              reactions: {
                heart: 8,
                laugh: 2,
                like: 8
              }
            },
            comments: [
              {
                id: 3,
                author: {
                  name: 'Hoàng Văn E',
                  avatar: 'https://via.placeholder.com/30'
                },
                content: 'Cảm ơn chị đã chia sẻ! Tôi sẽ thử áp dụng.',
                timestamp: '2024-01-14T16:00:00Z'
              }
            ]
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // ===== POST CREATION FUNCTIONS =====
  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return

    try {
      setIsLoading(true)
      
      // TẠO FORM DATA CHO UPLOAD HÌNH ẢNH
      const formData = new FormData()
      formData.append('content', newPost.content)
      if (newPost.image) {
        formData.append('image', newPost.image)
      }
      // Thêm các trường khác nếu cần:
      // formData.append('user_id', currentUser.id)
      // formData.append('category', 'general')

      // API CALL - THAY ĐỔI URL CỦA BẠN
      const response = await fetch('/api/community/posts', { // <-- Thay URL API
        method: 'POST',
        headers: {
          // Không cần Content-Type khi dùng FormData
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const data = await response.json()
      
      // MAPPING DỮ LIỆU API - ĐIỀU CHỈNH NẾU CẤU TRÚC KHÁC
      const newPostData = data.post || data // <-- Điều chỉnh tên trường
      
      // Thêm bài viết mới vào đầu danh sách
      setPosts(prev => [newPostData, ...prev])
      
      // Reset form
      setNewPost({ content: '', image: null, imagePreview: null })
      setShowCreatePost(false)
      
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Không thể tạo bài viết. Vui lòng thử lại!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewPost(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }))
    }
  }

  // ===== LIKE FUNCTIONS =====
  const handleLike = async (postId) => {
    try {
      // API CALL - THAY ĐỔI URL CỦA BẠN
      const response = await fetch(`/api/community/posts/${postId}/like`, { // <-- Thay URL API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          // user_id: currentUser.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to like post')
      }

      const data = await response.json()
      
      // Cập nhật state local
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              likes: data.likes || post.likes
            }
          : post
      ))
      
    } catch (error) {
      console.error('Error liking post:', error)
      // Fallback: Cập nhật local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              likes: {
                ...post.likes,
                total: post.likes.total + 1,
                reactions: {
                  ...post.likes.reactions,
                  like: (post.likes.reactions.like || 0) + 1
                }
              }
            }
          : post
      ))
    }
  }

  // ===== COMMENT FUNCTIONS =====
  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return

    try {
      // API CALL - THAY ĐỔI URL CỦA BẠN
      const response = await fetch(`/api/community/posts/${postId}/comments`, { // <-- Thay URL API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: newComment,
          // user_id: currentUser.id,
          // post_id: postId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const data = await response.json()
      
      // Cập nhật state local
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: [...post.comments, data.comment || data]
            }
          : post
      ))
      
      setNewComment('')
      
    } catch (error) {
      console.error('Error adding comment:', error)
      // Fallback: Thêm comment local
      const newCommentData = {
        id: Date.now(),
        author: {
          name: 'Bạn', // Thay bằng tên user thật
          avatar: 'https://via.placeholder.com/30'
        },
        content: newComment,
        timestamp: new Date().toISOString()
      }
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: [...post.comments, newCommentData]
            }
          : post
      ))
      
      setNewComment('')
    }
  }

  const openCommentsModal = (post) => {
    setSelectedPost(post)
    setShowComments(true)
  }

  // ===== UTILITY FUNCTIONS =====
  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`
  }

  // ===== RENDER MAIN CONTENT =====
  return (
    <Layout>
      <div className="community-page">
        {/* HEADER */}
        <div className="community-header">
          <h1>Cộng Đồng</h1>
          <p>Chia sẻ kinh nghiệm và kết nối với cộng đồng nông dân</p>
        </div>

        {/* CREATE POST BUTTON */}
        <div className="create-post-section">
          <button 
            className="create-post-btn"
            onClick={() => setShowCreatePost(true)}
            title="Tạo bài viết mới để chia sẻ với cộng đồng"
          >
            <span className="create-icon">✏️</span>
            Tạo bài viết mới
          </button>
        </div>

        {/* CREATE POST MODAL */}
        {showCreatePost && (
          <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
            <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Tạo bài viết mới</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreatePost(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-content">
                <textarea
                  className="post-textarea"
                  placeholder="Chia sẻ điều gì đó với cộng đồng..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
                
                {newPost.imagePreview && (
                  <div className="image-preview">
                    <img src={newPost.imagePreview} alt="Preview" />
                    <button 
                      className="remove-image-btn"
                      onClick={() => setNewPost(prev => ({ ...prev, image: null, imagePreview: null }))}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="post-actions">
                  <label className="image-upload-btn">
                    📷 Thêm hình ảnh
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  <div className="modal-buttons">
                    <button 
                      className="cancel-btn"
                      onClick={() => setShowCreatePost(false)}
                    >
                      Hủy
                    </button>
                    <button 
                      className="post-btn"
                      onClick={handleCreatePost}
                      disabled={!newPost.content.trim() || isLoading}
                    >
                      {isLoading ? 'Đang đăng...' : 'Đăng bài'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POSTS LIST */}
        <div className="posts-container">
          {isLoading && posts.length === 0 ? (
            <div className="loading">Đang tải bài viết...</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="post-card">
                {/* POST HEADER */}
                <div className="post-header">
                  <div className="author-info">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="author-avatar"
                    />
                    <div className="author-details">
                      <h4 className="author-name">{post.author.name}</h4>
                      <p className="author-role">{post.author.role}</p>
                      <span className="post-time">{formatTimeAgo(post.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* POST CONTENT */}
                <div className="post-content">
                  <p>{post.content}</p>
                  {post.image && (
                    <img src={post.image} alt="Post" className="post-image" />
                  )}
                </div>

                {/* POST ACTIONS */}
                <div className="post-actions">
                  <div className="reactions">
                    <button 
                      className={`reaction-btn like ${post.likes.reactions.like > 0 ? 'active' : ''}`}
                      onClick={() => handleLike(post.id)}
                      title="Thích"
                    >
                      👍 {post.likes.reactions.like || 0}
                    </button>
                  </div>
                  
                  <button 
                    className="comment-btn"
                    onClick={() => openCommentsModal(post)}
                    title="Xem bình luận"
                  >
                    💬 {post.comments.length} bình luận
                  </button>
                </div>

                {/* QUICK COMMENT */}
                <div className="quick-comment">
                  <input
                    type="text"
                    placeholder="Viết bình luận..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button 
                    className="send-comment-btn"
                    onClick={() => handleAddComment(post.id)}
                    disabled={!newComment.trim()}
                    title="Gửi bình luận"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* COMMENTS MODAL */}
        {showComments && selectedPost && (
          <div className="modal-overlay" onClick={() => setShowComments(false)}>
            <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Bình luận ({selectedPost.comments.length})</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowComments(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="comments-list">
                {selectedPost.comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <img 
                      src={comment.author.avatar} 
                      alt={comment.author.name}
                      className="comment-avatar"
                    />
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author.name}</span>
                        <span className="comment-time">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="add-comment">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedPost.id)}
                />
                <button 
                  className="send-comment-btn"
                  onClick={() => handleAddComment(selectedPost.id)}
                  disabled={!newComment.trim()}
                  title="Gửi bình luận"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CommunityPage
