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
    loadCoupons()
  }, [searchTerm, statusFilter])

  const loadCoupons = async () => {
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
        toast.error('Could not load coupon list')
        if (result.error && result.error.includes('login')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        }
      }
    } catch (error) {
      console.error('Error loading coupons:', error)
      toast.error('Error loading coupon list')
    }
    setLoading(false)
  }

  const getStats = async () => {
    try {
      const result = await CouponService.getCouponStatsAdmin()
      if (result.success) {
        setStats(result.data)
      } else {
        toast.error('Could not load statistics')
      }
    } catch (error) {
      console.error('Statistics error:', error)
      toast.error('Could not load statistics')
    }
  }

  const addCoupon = async (e) => {
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
        toast.success('Coupon added successfully!')
        setShowAddModal(false)
        resetForm()
        loadCoupons()
      } else {
        toast.error('Failed to add coupon')
      }
    } catch (error) {
      console.error('Error adding coupon:', error)
      toast.error('Failed to add coupon')
    }
  }

  const updateCoupon = async (e) => {
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
        toast.success('Updated successfully!')
        setShowEditModal(false)
        setEditingCoupon(null)
        resetForm()
        loadCoupons()
      } else {
        toast.error('Update failed')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Update failed')
    }
  }

  const deleteCoupon = async (couponId, couponCode) => {
    if (window.confirm(`Delete coupon "${couponCode}"?`)) {
      try {
        const result = await CouponService.deleteCouponAdmin(couponId)
        
        if (result.success) {
          toast.success('Coupon deleted')
          loadCoupons()
        } else {
          toast.error('Delete failed')
        }
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Delete failed')
      }
    }
  }

  const editCoupon = (coupon) => {
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

  const showStats = async () => {
    await getStats()
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
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getCouponType = (type) => {
    switch (type) {
      case 'percentage': return 'Percentage'
      case 'fixed': return 'Fixed Amount'
      case 'free_shipping': return 'Free Shipping'
      default: return type
    }
  }

  const getStatusColor = (coupon) => {
    const now = new Date()
    const endDate = new Date(coupon.end_date)
    
    if (!coupon.is_active || coupon.status === 'inactive') return '#dc3545'
    if (now > endDate || coupon.status === 'expired') return '#ffc107'
    return '#28a745'
  }

  const getStatusText = (coupon) => {
    const now = new Date()
    const startDate = new Date(coupon.start_date)
    const endDate = new Date(coupon.end_date)
    
    if (!coupon.is_active || coupon.status === 'inactive') return 'Inactive'
    if (now > endDate || coupon.status === 'expired') return 'Expired'
    if (now < startDate) return 'Not Started'
    return 'Active'
  }

  if (loading) {
    return (
      <div className="admin-coupons">
        <div className="loading">Loading data...</div>
      </div>
    )
  }

  return (
    <div className="admin-coupons">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Coupon Management</h1>
          <p>Manage coupons and promotions</p>
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
          className="nav-btn active"
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

      <div className="coupons-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button 
          className="stats-btn"
          onClick={showStats}
        >
          Statistics
        </button>
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          Add Coupon
        </button>
      </div>

      <div className="coupons-grid">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="coupon-card">
            <div className="coupon-header">
              <div className="coupon-code">{coupon.code}</div>
              <div 
                className="coupon-status"
                style={{ backgroundColor: getStatusColor(coupon) }}
              >
                {getStatusText(coupon)}
              </div>
            </div>
            <div className="coupon-info">
              <h3>{coupon.name}</h3>
              <p className="coupon-description">{coupon.description}</p>
              
              <div className="coupon-details">
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{getCouponType(coupon.coupon_type)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Value:</span>
                  <span className="value">
                    {coupon.coupon_type === 'percentage' 
                      ? `${coupon.value}%` 
                      : formatMoney(coupon.value)
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Min Order:</span>
                  <span className="value">{formatMoney(coupon.minimum_order_amount)}</span>
                </div>
                {coupon.maximum_discount_amount && (
                  <div className="detail-row">
                    <span className="label">Max Discount:</span>
                    <span className="value">{formatMoney(coupon.maximum_discount_amount)}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Used:</span>
                  <span className="value">
                    {coupon.current_usage_count}
                    {coupon.total_usage_limit ? `/${coupon.total_usage_limit}` : ''}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Expires:</span>
                  <span className="value">{formatDateTime(coupon.end_date)}</span>
                </div>
              </div>
              
              <div className="coupon-actions">
                <button 
                  className="edit-btn"
                  onClick={() => editCoupon(coupon)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteCoupon(coupon.id, coupon.code)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {coupons.length === 0 && (
          <div className="no-data">
            <p>No coupons available yet</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Coupon</h2>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={addCoupon} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="Example: SUMMER2024"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Coupon Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description about coupon..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={formData.coupon_type}
                    onChange={(e) => setFormData({...formData, coupon_type: e.target.value})}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Value *
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
                  <label>Minimum Order Amount (VND)</label>
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
                  <label>Total Usage Limit</label>
                  <input
                    type="number"
                    value={formData.total_usage_limit}
                    onChange={(e) => setFormData({...formData, total_usage_limit: e.target.value})}
                    placeholder="Leave blank = unlimited"
                  />
                </div>
                <div className="form-group">
                  <label>Uses per Customer *</label>
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
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
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
              <h2>Edit Coupon</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={updateCoupon} className="modal-form">
              <div className="form-group">
                <label>Mã giảm giá</label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
                <small>Code cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Coupon Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={formData.coupon_type}
                    onChange={(e) => setFormData({...formData, coupon_type: e.target.value})}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Value *
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
                  <label>Minimum Order Amount (VND)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({...formData, minimum_order_amount: e.target.value})}
                  />
                </div>
                {formData.coupon_type === 'percentage' && (
                  <div className="form-group">
                    <label>Maximum Discount (VND)</label>
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
                  <label>Total Usage Limit</label>
                  <input
                    type="number"
                    value={formData.total_usage_limit}
                    onChange={(e) => setFormData({...formData, total_usage_limit: e.target.value})}
                    placeholder="Leave blank = unlimited"
                  />
                </div>
                <div className="form-group">
                  <label>Uses per Customer *</label>
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
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
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
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Enable
                  </label>
                </div>
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

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Coupon Statistics</h2>
              <button onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            <div className="stats-content">
              {stats ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Total Coupons</h3>
                      <p className="stat-number">{stats.total_coupons}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Active</h3>
                      <p className="stat-number">{stats.active_coupons}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Usage</h3>
                      <p className="stat-number">{stats.total_usage}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Discount</h3>
                      <p className="stat-number">{formatMoney(stats.total_discount_given)}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Recent Usage (30 days)</h3>
                      <p className="stat-number">{stats.recent_usage}</p>
                    </div>
                  </div>
                  
                  {stats.top_coupons?.length > 0 && (
                    <div className="top-coupons">
                      <h3>Top 5 Most Used Coupons</h3>
                      <div className="top-coupons-list">
                        {stats.top_coupons.map((coupon, index) => (
                          <div key={coupon.id} className="top-coupon-item">
                            <span className="rank">#{index + 1}</span>
                            <span className="coupon-code">{coupon.code}</span>
                            <span className="coupon-name">{coupon.name}</span>
                            <span className="usage-count">{coupon.usage_count} times</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="loading">Loading statistics...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCoupons
