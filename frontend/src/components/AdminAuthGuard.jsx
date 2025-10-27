import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AdminAuthGuard = ({ children }) => {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      navigate('/login')
      return
    }
    
    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'admin') {
        navigate('/')
        return
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  if (!token || !user) {
    return null
  }

  try {
    const userData = JSON.parse(user)
    if (userData.role !== 'admin') {
      return null
    }
  } catch (error) {
    return null
  }

  return children
}

export default AdminAuthGuard
