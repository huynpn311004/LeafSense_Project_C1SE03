import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CouponService from '../../../services/couponApi'
import './AdminCoupons.css'

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [stats, setStats] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    coupon_type: 'percentage',
    value: '',
    minimum_order_amount: '0',
    maximum_discount_amount: '',
    total_usage_limit: '',
    usage_limit_per_customer: '1',
    start_date: '',
    end_date: '',
    status: 'active',
    is_active: true
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchCoupons()
  }, [searchTerm, statusFilter])

  const fetchCoupons = async () => {
    try {
      const result = await CouponService.getAllCouponsAdmin(0, 100, statusFilter)
      
      if (result.success) {
        let filteredCoupons = result.data
        if (searchTerm) {
          filteredCoupons = result.data.filter(coupon => 
            coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coupon.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        setCoupons(filteredCoupons)
      } else {
        toast.error(result.error || 'Lỗi khi tải danh sách mã giảm giá')
        if (result.error.includes('đăng nhập')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        }
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Lỗi khi tải danh sách mã giảm giá')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await CouponService.getCouponStatsAdmin()
      if (result.success) {
        setStats(result.data)
      } else {
        toast.error(result.error || 'Không thể tải thống kê')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Không thể tải thống kê')
    }
  }

  const handleAddCoupon = async (e) => {
    e.preventDefault()
    try {
      const couponData = {
        ...formData,
        value: parseFloat(formData.value),
        minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
        maximum_discount_amount: formData.maximum_discount_amount ? parseFloat(formData.maximum_discount_amount) : null,
        total_usage_limit: formData.total_usage_limit ? parseInt(formData.total_usage_limit) : null,
        usage_limit_per_customer: parseInt(formData.usage_limit_per_customer) || 1,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      }
      
      const result = await CouponService.createCouponAdmin(couponData)
      
      if (result.success) {
        toast.success('Thêm mã giảm giá thành công')
        setShowAddModal(false)
        resetForm()
        fetchCoupons()
      } else {
        toast.error(result.error || 'Thêm mã giảm giá thất bại')
      }
    } catch (error) {
      console.error('Error adding coupon:', error)
      toast.error('Thêm mã giảm giá thất bại')
    }
  }

  const handleEditCoupon = async (e) => {
    e.preventDefault()
    try {
      const couponData = {
        name: formData.name,
        description: formData.description,
        coupon_type: formData.coupon_type,
        value: parseFloat(formData.value),
        minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
        maximum_discount_amount: formData.maximum_discount_amount ? parseFloat(formData.maximum_discount_amount) : null,
        total_usage_limit: formData.total_usage_limit ? parseInt(formData.total_usage_limit) : null,
        usage_limit_per_customer: parseInt(formData.usage_limit_per_customer) || 1,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        status: formData.status,
        is_active: formData.is_active
      }
      
      const result = await CouponService.updateCouponAdmin(editingCoupon.id, couponData)
      
      if (result.success) {
        toast.success('Cập nhật mã giảm giá thành công')
        setShowEditModal(false)
        setEditingCoupon(null)
        resetForm()
        fetchCoupons()
      } else {
        toast.error(result.error || 'Cập nhật mã giảm giá thất bại')
      }
    } catch (error) {
      console.error('Error updating coupon:', error)
      toast.error('Cập nhật mã giảm giá thất bại')
    }
  }

  const handleDeleteCoupon = async (couponId, couponCode) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${couponCode}"?`)) {
      try {
        const result = await CouponService.deleteCouponAdmin(couponId)
        
        if (result.success) {
          toast.success('Xóa mã giảm giá thành công')
          fetchCoupons()
        } else {
          toast.error(result.error || 'Xóa mã giảm giá thất bại')
        }
      } catch (error) {
        console.error('Error deleting coupon:', error)
        toast.error('Xóa mã giảm giá thất bại')
      }
    }
  }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      coupon_type: coupon.coupon_type,
      value: coupon.value.toString(),
      minimum_order_amount: coupon.minimum_order_amount.toString(),
      maximum_discount_amount: coupon.maximum_discount_amount ? coupon.maximum_discount_amount.toString() : '',
      total_usage_limit: coupon.total_usage_limit ? coupon.total_usage_limit.toString() : '',
      usage_limit_per_customer: coupon.usage_limit_per_customer.toString(),
      start_date: new Date(coupon.start_date).toISOString().slice(0, 16),
      end_date: new Date(coupon.end_date).toISOString().slice(0, 16),
      status: coupon.status,
      is_active: coupon.is_active
    })
    setShowEditModal(true)
  }

  const openStatsModal = async () => {
    await fetchStats()
    setShowStatsModal(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      coupon_type: 'percentage',
      value: '',
      minimum_order_amount: '0',
      maximum_discount_amount: '',
      total_usage_limit: '',
      usage_limit_per_customer: '1',
      start_date: '',
      end_date: '',
      status: 'active',
      is_active: true
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getCouponTypeText = (type) => {
    switch (type) {
      case 'percentage':
        return 'Phần trăm'
      case 'fixed':
        return 'Số tiền cố định'
      case 'free_shipping':
        return 'Miễn phí vận chuyển'
      default:
        return type
    }
  }

  const getCouponStatusColor = (coupon) => {
    const now = new Date()
    const endDate = new Date(coupon.end_date)
    
    if (!coupon.is_active || coupon.status === 'inactive') return '#f44336'
    if (now > endDate || coupon.status === 'expired') return '#ff9800'
    return '#4caf50'
  }

  const getCouponStatusText = (coupon) => {
    const now = new Date()
    const startDate = new Date(coupon.start_date)
    const endDate = new Date(coupon.end_date)
    
    if (!coupon.is_active || coupon.status === 'inactive') return 'Không hoạt động'
    if (now > endDate || coupon.status === 'expired') return 'Đã hết hạn'
    if (now < startDate) return 'Chưa bắt đầu'
    return 'Đang hoạt động'
  }

  if (loading) {
    return (
      <div className="admin-coupons">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="admin-coupons">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Quản lý Mã giảm giá</h1>
          <p>Quản lý các mã giảm giá và ưu đãi</p>
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
          className="nav-btn"
          onClick={() => navigate('/admin/categories')}
        >
          Quản lý Danh mục
        </button>
        <button 
          className="nav-btn active"
          onClick={() => navigate('/admin/coupons')}
        >
          Quản lý Mã giảm giá
        </button>
      </div>

      <div className="coupons-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
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
            <option value="inactive">Không hoạt động</option>
            <option value="expired">Đã hết hạn</option>
          </select>
        </div>
        <button 
          className="stats-btn"
          onClick={openStatsModal}
        >
          Thống kê
        </button>
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          Thêm mã giảm giá
        </button>
      </div>

      <div className="coupons-grid">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="coupon-card">
            <div className="coupon-header">
              <div className="coupon-code">{coupon.code}</div>
              <div 
                className="coupon-status"
                style={{ backgroundColor: getCouponStatusColor(coupon) }}
              >
                {getCouponStatusText(coupon)}
              </div>
            </div>
            <div className="coupon-info">
              <h3>{coupon.name}</h3>
              <p className="coupon-description">{coupon.description}</p>
              
              <div className="coupon-details">
                <div className="detail-row">
                  <span className="label">Loại:</span>
                  <span className="value">{getCouponTypeText(coupon.coupon_type)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Giá trị:</span>
                  <span className="value">
                    {coupon.coupon_type === 'percentage' 
                      ? `${coupon.value}%` 
                      : formatCurrency(coupon.value)
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Đơn tối thiểu:</span>
                  <span className="value">{formatCurrency(coupon.minimum_order_amount)}</span>
                </div>
                {coupon.maximum_discount_amount && (
                  <div className="detail-row">
                    <span className="label">Giảm tối đa:</span>
                    <span className="value">{formatCurrency(coupon.maximum_discount_amount)}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Đã sử dụng:</span>
                  <span className="value">
                    {coupon.current_usage_count}
                    {coupon.total_usage_limit ? `/${coupon.total_usage_limit}` : ''}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Thời hạn:</span>
                  <span className="value">{formatDate(coupon.end_date)}</span>
                </div>
              </div>
              
              <div className="coupon-actions">
                <button 
                  className="edit-btn"
                  onClick={() => openEditModal(coupon)}
                >
                  Sửa
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {coupons.length === 0 && (
          <div className="no-data">
            <p>Không có mã giảm giá nào</p>
          </div>
        )}
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thêm mã giảm giá mới</h2>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddCoupon} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Mã giảm giá *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER2024"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên mã giảm giá *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả về mã giảm giá..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại giảm giá *</label>
                  <select
                    value={formData.coupon_type}
                    onChange={(e) => setFormData({...formData, coupon_type: e.target.value})}
                    required
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định</option>
                    <option value="free_shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Giá trị *
                    {formData.coupon_type === 'percentage' && ' (%)'}
                    {formData.coupon_type === 'fixed' && ' (VND)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    max={formData.coupon_type === 'percentage' ? '100' : undefined}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Đơn hàng tối thiểu (VND)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({...formData, minimum_order_amount: e.target.value})}
                  />
                </div>
                {formData.coupon_type === 'percentage' && (
                  <div className="form-group">
                    <label>Giảm tối đa (VND)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maximum_discount_amount}
                      onChange={(e) => setFormData({...formData, maximum_discount_amount: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tổng số lần sử dụng</label>
                  <input
                    type="number"
                    value={formData.total_usage_limit}
                    onChange={(e) => setFormData({...formData, total_usage_limit: e.target.value})}
                    placeholder="Để trống = không giới hạn"
                  />
                </div>
                <div className="form-group">
                  <label>Số lần/khách hàng *</label>
                  <input
                    type="number"
                    value={formData.usage_limit_per_customer}
                    onChange={(e) => setFormData({...formData, usage_limit_per_customer: e.target.value})}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
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

      {/* Edit Coupon Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Sửa mã giảm giá</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditCoupon} className="modal-form">
              <div className="form-group">
                <label>Mã giảm giá</label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
                <small>Mã giảm giá không thể thay đổi</small>
              </div>

              <div className="form-group">
                <label>Tên mã giảm giá *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại giảm giá *</label>
                  <select
                    value={formData.coupon_type}
                    onChange={(e) => setFormData({...formData, coupon_type: e.target.value})}
                    required
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định</option>
                    <option value="free_shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Giá trị *
                    {formData.coupon_type === 'percentage' && ' (%)'}
                    {formData.coupon_type === 'fixed' && ' (VND)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    max={formData.coupon_type === 'percentage' ? '100' : undefined}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Đơn hàng tối thiểu (VND)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({...formData, minimum_order_amount: e.target.value})}
                  />
                </div>
                {formData.coupon_type === 'percentage' && (
                  <div className="form-group">
                    <label>Giảm tối đa (VND)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maximum_discount_amount}
                      onChange={(e) => setFormData({...formData, maximum_discount_amount: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tổng số lần sử dụng</label>
                  <input
                    type="number"
                    value={formData.total_usage_limit}
                    onChange={(e) => setFormData({...formData, total_usage_limit: e.target.value})}
                    placeholder="Để trống = không giới hạn"
                  />
                </div>
                <div className="form-group">
                  <label>Số lần/khách hàng *</label>
                  <input
                    type="number"
                    value={formData.usage_limit_per_customer}
                    onChange={(e) => setFormData({...formData, usage_limit_per_customer: e.target.value})}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Kích hoạt
                  </label>
                </div>
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

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thống kê mã giảm giá</h2>
              <button onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            <div className="stats-content">
              {stats ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Tổng mã giảm giá</h3>
                      <p className="stat-number">{stats.total_coupons}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Đang hoạt động</h3>
                      <p className="stat-number">{stats.active_coupons}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Tổng lượt sử dụng</h3>
                      <p className="stat-number">{stats.total_usage}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Tổng giảm giá</h3>
                      <p className="stat-number">{formatCurrency(stats.total_discount_given)}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Sử dụng gần đây (30 ngày)</h3>
                      <p className="stat-number">{stats.recent_usage}</p>
                    </div>
                  </div>
                  
                  {stats.top_coupons?.length > 0 && (
                    <div className="top-coupons">
                      <h3>Top 5 mã được sử dụng nhiều nhất</h3>
                      <div className="top-coupons-list">
                        {stats.top_coupons.map((coupon, index) => (
                          <div key={coupon.id} className="top-coupon-item">
                            <span className="rank">#{index + 1}</span>
                            <span className="coupon-code">{coupon.code}</span>
                            <span className="coupon-name">{coupon.name}</span>
                            <span className="usage-count">{coupon.usage_count} lượt</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="loading">Đang tải thống kê...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCoupons
