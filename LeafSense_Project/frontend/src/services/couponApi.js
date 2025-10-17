const API_BASE_URL = 'http://localhost:8000/api'

// Test function để debug
export const testCouponAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/coupons/available`)
    console.log('API Response Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('API Data:', data)
      return { success: true, data }
    } else {
      console.log('API Error:', response.statusText)
      return { success: false, error: response.statusText }
    }
  } catch (error) {
    console.log('Network Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Coupon API Service
class CouponService {
  
  // Validate coupon code và tính discount (public - không cần auth)
  static async validateCoupon(couponCode, orderAmount) {
    try {
      const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupon_code: couponCode,
          order_amount: orderAmount
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Lỗi khi validate coupon')
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Validate coupon error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Lấy danh sách coupon có thể sử dụng (public)
  static async getAvailableCoupons(orderAmount = null) {
    try {
      const url = new URL(`${API_BASE_URL}/coupons/available`)
      if (orderAmount !== null) {
        url.searchParams.append('order_amount', orderAmount)
      }

      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
      }
      
      // Thêm auth header nếu user đã đăng nhập
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error('Lỗi khi lấy danh sách coupon')
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Get available coupons error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Áp dụng coupon (yêu cầu authentication)
  static async applyCoupon(couponId, orderAmount, orderId = null) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập để sử dụng coupon')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/apply/${couponId}?order_amount=${orderAmount}${orderId ? `&order_id=${orderId}` : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Lỗi khi áp dụng coupon')
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Apply coupon error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Lấy lịch sử sử dụng coupon của user
  static async getMyCouponUsage() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/my-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Lỗi khi lấy lịch sử coupon')
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Get coupon usage error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== ADMIN METHODS ====================

  // Lấy thống kê coupon (Admin only)
  static async getCouponStatsAdmin() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Lỗi khi lấy thống kê coupon')
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Get coupon stats error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Lấy chi tiết sử dụng coupon (Admin only)
  static async getCouponUsageAdmin(couponId) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/admin/${couponId}/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Lỗi khi lấy chi tiết sử dụng')
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Get coupon usage error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Lấy tất cả coupon (Admin only)
  static async getAllCouponsAdmin(skip = 0, limit = 100, status = null) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const url = new URL(`${API_BASE_URL}/coupons/admin/all`)
      url.searchParams.append('skip', skip)
      url.searchParams.append('limit', limit)
      if (status) {
        url.searchParams.append('status', status)
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Lỗi khi lấy danh sách coupon')
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Get all coupons error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Tạo coupon mới (Admin only)
  static async createCouponAdmin(couponData) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/admin/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Lỗi khi tạo coupon')
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Create coupon error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Cập nhật coupon (Admin only)
  static async updateCouponAdmin(couponId, updateData) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/admin/${couponId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Lỗi khi cập nhật coupon')
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Update coupon error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Xóa coupon (Admin only)
  static async deleteCouponAdmin(couponId) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Vui lòng đăng nhập')
      }

      const response = await fetch(`${API_BASE_URL}/coupons/admin/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Lỗi khi xóa coupon')
      }

      return {
        success: true,
        message: 'Xóa coupon thành công'
      }
    } catch (error) {
      console.error('Delete coupon error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default CouponService