import React, { useState, useEffect } from 'react'
import Layout from '../layout/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { communityApi, commentsApi, reactionsApi, communityUtils } from '../../services/communityApi'
import './CommunityPage.css'

const CommunityPage = () => {
  // ===== CONTEXT =====
  const { user, isAuthenticated } = useAuth()

  // ===== STATE MANAGEMENT =====
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: null,
    imagePreview: null
  })
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [postComments, setPostComments] = useState({}) // Object để lưu comment cho từng post
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 10,
    total: 0,
    hasMore: false
  })

  // ===== FETCH POSTS =====
  useEffect(() => {
    fetchPosts()
  }, [])

  // ===== RELOAD REACTIONS WHEN AUTH CHANGES =====
  useEffect(() => {
    // Reload reaction data when authentication status changes
    if (posts.length > 0) {
      posts.forEach(post => {
        reloadPostReactions(post.id)
      })
    }
  }, [isAuthenticated])

  const fetchPosts = async (loadMore = false) => {
    try {
      setIsLoading(true)
      setError('')
      
      const skip = loadMore ? pagination.skip + pagination.limit : 0
      
      const response = await communityApi.getPosts({
        skip,
        limit: pagination.limit,
        status: 'published'
      })
      
      // Load reaction data for each post (comments sẽ load on demand)
      let postsWithReactions = response.posts
      if (response.posts.length > 0) {
        postsWithReactions = await Promise.all(response.posts.map(async (post) => {
          try {
            // Always get reaction counts (public data)
            const reactionsResponse = await reactionsApi.getPostReactions(post.id)
            
            // Get user's reaction only if authenticated
            let userReaction = { liked: false }
            if (isAuthenticated) {
              userReaction = await reactionsApi.getMyReaction(post.id)
            }

            // Initialize comments with count from backend or empty array
            const comments = post.comments || []
            
            return {
              ...post,
              like_count: reactionsResponse.reactions.like || 0,
              liked: userReaction.liked || false,
              comments: comments,
              comment_count: post.comment_count || comments.length || 0
            }
          } catch (error) {
            // If loading fails, just return post without additional data
            console.error('Error loading data for post', post.id, error)
            return {
              ...post,
              like_count: 0,
              liked: false,
              comments: post.comments || [],
              comment_count: post.comment_count || 0
            }
          }
        }))
      }
      
      setPosts(prev => loadMore ? [...prev, ...postsWithReactions] : postsWithReactions)
      setPagination({
        skip,
        limit: pagination.limit,
        total: response.total,
        hasMore: response.has_more
      })
      
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Không thể tải bài viết. Vui lòng thử lại!')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== POST CREATION FUNCTIONS =====
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung bài viết')
      return
    }

    // Kiểm tra authentication trước
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')
    if (!token) {
      setError('Bạn cần đăng nhập để tạo bài viết. Token không tồn tại.')
      return
    }

    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để tạo bài viết. Authentication state: false')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      // Validate image nếu có
      if (newPost.image) {
        communityUtils.validateImage(newPost.image)
      }
      
      console.log('🔄 Creating post with token:', token ? 'EXISTS' : 'NOT FOUND')
      
      const response = await communityApi.createPost({
        title: newPost.title,
        content: newPost.content,
        image: newPost.image,
        status: 'published'
      })
      
      console.log('✅ Post created successfully:', response)
      
      // Thêm bài viết mới vào đầu danh sách
      setPosts(prev => [response, ...prev])
      setPagination(prev => ({ ...prev, total: prev.total + 1 }))
      
      // Reset form
      setNewPost({ title: '', content: '', image: null, imagePreview: null })
      setShowCreatePost(false)
      
    } catch (error) {
      console.error('❌ Error creating post:', error)
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        // Có thể thêm logic logout ở đây
      } else {
        setError(error.message || 'Không thể tạo bài viết. Vui lòng thử lại!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        communityUtils.validateImage(file)
        setNewPost(prev => ({
          ...prev,
          image: file,
          imagePreview: URL.createObjectURL(file)
        }))
        setError('')
      } catch (error) {
        setError(error.message)
      }
    }
  }

  // ===== COMMENT FUNCTIONS =====
  const handleAddComment = async (postId) => {
    const commentText = postComments[postId] || ''
    if (!commentText.trim()) return

    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để bình luận')
      return
    }

    try {
      const response = await commentsApi.createComment(postId, {
        content: commentText
      })
      
      // Cập nhật state local
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: [...(post.comments || []), response],
              comment_count: (post.comment_count || post.comments?.length || 0) + 1
            }
          : post
      ))

      // Cập nhật selectedPost nếu đang xem chi tiết post này
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          comments: [...(prev.comments || []), response]
        }))
      }
      
      // Clear comment cho post này
      setPostComments(prev => ({ ...prev, [postId]: '' }))
      setError('')
      
    } catch (error) {
      console.error('Error adding comment:', error)
      setError(error.message || 'Không thể thêm bình luận')
    }
  }

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return
    }

    try {
      await commentsApi.deleteComment(commentId)
      
      // Cập nhật posts
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: (post.comments || []).filter(comment => comment.id !== commentId),
              comment_count: Math.max(0, (post.comment_count || post.comments?.length || 0) - 1)
            }
          : post
      ))

      // Cập nhật selectedPost nếu đang xem chi tiết
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          comments: (prev.comments || []).filter(comment => comment.id !== commentId)
        }))
      }
      
      setError('') // Clear any errors
      
    } catch (error) {
      console.error('Error deleting comment:', error)
      setError(error.message || 'Không thể xóa bình luận')
    }
  }

  const loadPostComments = async (post) => {
    try {
      const comments = await commentsApi.getComments(post.id)
      setSelectedPost({
        ...post,
        comments: comments || []
      })
      setShowComments(true)
    } catch (error) {
      console.error('Error loading comments:', error)
      setSelectedPost({
        ...post,
        comments: post.comments || []
      })
      setShowComments(true)
    }
  }

  // ===== HELPER FUNCTIONS =====
  const closeCommentsModal = () => {
    setShowComments(false)
    // Clear comment input cho modal này nếu có selectedPost
    if (selectedPost) {
      setPostComments(prev => ({ ...prev, [selectedPost.id]: '' }))
    }
  }

  // ===== REACTION FUNCTIONS =====
  const reloadPostReactions = async (postId) => {
    try {
      const reactionsResponse = await reactionsApi.getPostReactions(postId)
      let userReaction = { liked: false }
      
      if (isAuthenticated) {
        userReaction = await reactionsApi.getMyReaction(postId)
      }
      
      // Cập nhật posts với reaction data mới
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              liked: userReaction.liked || false,
              like_count: reactionsResponse.reactions.like || 0
            }
          : post
      ))

      // Cập nhật selectedPost nếu đang xem chi tiết
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          liked: userReaction.liked || false,
          like_count: reactionsResponse.reactions.like || 0
        }))
      }
    } catch (error) {
      console.error('Error reloading reactions:', error)
    }
  }

  const handleReaction = async (postId) => {
    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập để thích bài viết')
      return
    }

    try {
      const response = await reactionsApi.toggleReaction(postId, 'like')
      
      // Reload actual reaction data from server để đảm bảo tính chính xác
      await reloadPostReactions(postId)

      setError('') // Clear any previous errors

    } catch (error) {
      console.error('Error toggling reaction:', error)
      setError('Không thể thích bài viết. Vui lòng thử lại!')
    }
  }

  // ===== UTILITY FUNCTIONS =====
  const formatTimeAgo = (timestamp) => {
    return communityUtils.formatTimeAgo(timestamp)
  }

  const getImageUrl = (imagePath) => {
    return communityUtils.getImageUrl(imagePath)
  }

  const getUserAvatar = (user) => {
    return user?.avatar_url || communityUtils.getImageUrl(user?.avatar_url) || 'https://via.placeholder.com/40'
  }

  // ===== RENDER MAIN CONTENT =====
  return (
    <Layout>
      <div className="community-page">
        {/* CREATE POST BUTTON */}
        {isAuthenticated ? (
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
        ) : (
          <div className="auth-info">
            <p>Đăng nhập để tạo bài viết và tham gia cộng đồng</p>
            <small>
              Debug: Auth={isAuthenticated ? 'true' : 'false'}, 
              User={user?.name || 'null'}, 
              Token={localStorage.getItem('token') ? 'exists' : 'missing'}
            </small>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button 
              className="close-error"
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        )}

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
                {/* TITLE INPUT */}
                <input
                  className="post-title-input"
                  placeholder="Tiêu đề bài viết..."
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                />
                
                {/* CONTENT TEXTAREA */}
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
                      disabled={!newPost.title.trim() || !newPost.content.trim() || isLoading}
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
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <p>Chưa có bài viết nào.</p>
              {isAuthenticated && (
                <button 
                  className="create-first-post-btn"
                  onClick={() => setShowCreatePost(true)}
                >
                  Tạo bài viết đầu tiên
                </button>
              )}
            </div>
          ) : (
            <>
              {posts.map(post => (
                <div key={post.id} className="post-card">
                  {/* POST HEADER */}
                  <div className="post-header">
                    <div className="author-info">
                      <img 
                        src={getUserAvatar(post.user)} 
                        alt={post.user?.name || 'User'}
                        className="author-avatar"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/40'
                        }}
                      />
                      <div className="author-details">
                        <h4 className="author-name">{post.user?.name || 'Anonymous'}</h4>
                        <p className="author-role">{post.user?.role || 'Thành viên'}</p>
                        <span className="post-time">{formatTimeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* POST CONTENT */}
                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-text">{post.content}</p>
                    {post.image_url && (
                      <img 
                        src={getImageUrl(post.image_url)} 
                        alt="Post" 
                        className="post-image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                  </div>

                  {/* POST ACTIONS */}
                  <div className="post-actions">
                    <div className="reactions">
                      <button 
                        className={`reaction-btn ${post.liked ? 'liked' : ''}`}
                        onClick={() => handleReaction(post.id)}
                        title={post.liked ? "Bỏ thích" : "Thích"}
                      >
                        ❤️ {post.like_count || 0}
                      </button>
                    </div>
                    <button 
                      className="comment-btn"
                      onClick={() => loadPostComments(post)}
                      title="Xem bình luận"
                    >
                      💬 {post.comment_count || post.comments?.length || 0} bình luận
                    </button>
                  </div>

                  {/* QUICK COMMENT */}
                  {isAuthenticated && (
                    <div className="quick-comment">
                      <input
                        type="text"
                        placeholder="Viết bình luận..."
                        value={postComments[post.id] || ''}
                        onChange={(e) => setPostComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button 
                        className="send-comment-btn"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!(postComments[post.id] || '').trim()}
                        title="Gửi bình luận"
                      >
                        Gửi
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* LOAD MORE */}
              {pagination.hasMore && (
                <div className="load-more-section">
                  <button 
                    className="load-more-btn"
                    onClick={() => fetchPosts(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang tải...' : 'Xem thêm bài viết'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* COMMENTS MODAL */}
        {showComments && selectedPost && (
          <div className="modal-overlay" onClick={closeCommentsModal}>
            <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Bình luận ({selectedPost.comments.length})</h3>
                <div className="modal-actions">
                  <button 
                    className={`reaction-btn ${selectedPost.liked ? 'liked' : ''}`}
                    onClick={() => handleReaction(selectedPost.id)}
                    title={selectedPost.liked ? "Bỏ thích" : "Thích"}
                  >
                    ❤️ {selectedPost.like_count || 0}
                  </button>
                  <button 
                    className="close-btn"
                    onClick={closeCommentsModal}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="comments-list">
                {selectedPost.comments?.length === 0 ? (
                  <div className="no-comments">
                    <p>Chưa có bình luận nào.</p>
                  </div>
                ) : (
                  selectedPost.comments?.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <img 
                        src={getUserAvatar(comment.user)} 
                        alt={comment.user?.name || 'User'}
                        className="comment-avatar"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/36'
                        }}
                      />
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
                          <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
                        </div>
                        <p className="comment-text">{comment.content}</p>
                      </div>
                      {/* DELETE BUTTON - Chỉ hiện nếu là chủ comment hoặc admin */}
                      {isAuthenticated && user && (
                        comment.user?.id === user.id || user.role === 'admin'
                      ) && (
                        <div className="comment-actions">
                          <button 
                            className="delete-comment-btn"
                            onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                            title="Xóa bình luận"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* ADD COMMENT */}
              {isAuthenticated ? (
                <div className="add-comment">
                  <input
                    type="text"
                    placeholder="Viết bình luận..."
                    value={postComments[selectedPost.id] || ''}
                    onChange={(e) => setPostComments(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedPost.id)}
                  />
                  <button 
                    className="send-comment-btn"
                    onClick={() => handleAddComment(selectedPost.id)}
                    disabled={!(postComments[selectedPost.id] || '').trim()}
                    title="Gửi bình luận"
                  >
                    Gửi
                  </button>
                </div>
              ) : (
                <div className="login-to-comment">
                  <p>Đăng nhập để bình luận</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CommunityPage
