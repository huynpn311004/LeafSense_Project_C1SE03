import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/pages/Dashboard'
import UploadPage from './components/pages/UploadPage'
import HistoryPage from './components/pages/HistoryPage'
import MarketplacePage from './components/pages/MarketplacePage'
import OrdersPage from './components/pages/OrdersPage'
import ChatbotPage from './components/pages/ChatbotPage'
import SettingsPage from './components/pages/SettingsPage'
import CommunityPage from './components/pages/CommunityPage'
import Login from './components/pages/Login'
import Signup from './components/pages/Signup'
import ForgotPassword from './components/pages/ForgotPassword'
import ResetPassword from './components/pages/ResetPassword'
// Admin components
import AdminDashboard from './components/pages/admin/AdminDashboard'
import AdminUsers from './components/pages/admin/AdminUsers'
import AdminProducts from './components/pages/admin/AdminProducts'
import AdminOrders from './components/pages/admin/AdminOrders'
import AdminCategories from './components/pages/admin/AdminCategories'
import AdminAuthGuard from './components/AdminAuthGuard'
import './App.css'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Authentication pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Admin pages - redirect to main login */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={
            <AdminAuthGuard>
              <AdminDashboard />
            </AdminAuthGuard>
          } />
          <Route path="/admin/users" element={
            <AdminAuthGuard>
              <AdminUsers />
            </AdminAuthGuard>
          } />
          <Route path="/admin/products" element={
            <AdminAuthGuard>
              <AdminProducts />
            </AdminAuthGuard>
          } />
          <Route path="/admin/orders" element={
            <AdminAuthGuard>
              <AdminOrders />
            </AdminAuthGuard>
          } />
          <Route path="/admin/categories" element={
            <AdminAuthGuard>
              <AdminCategories />
            </AdminAuthGuard>
          } />
          
          {/* Main pages */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
