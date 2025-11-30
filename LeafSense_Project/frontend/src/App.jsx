import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Dashboard from './components/pages/Dashboard'
import UploadPage from './components/pages/UploadPage'
import HistoryPage from './components/pages/HistoryPage'
import MarketplacePage from './components/pages/MarketplacePage'
import OrdersPage from './components/pages/OrdersPage'
import ChatbotPage from './components/pages/ChatbotPage'
import SettingsPage from './components/pages/SettingsPage'
import CommunityPage from './components/pages/CommunityPage'
import CheckoutPage from './components/pages/CheckoutPage'
import CartPage from './components/pages/CartPage'
import LandingPage from './components/pages/LandingPage'
import Login from './components/pages/Login'
import Signup from './components/pages/Signup'
import ForgotPassword from './components/pages/ForgotPassword'
import ResetPassword from './components/pages/ResetPassword'
import AccountLocked from './components/pages/AccountLocked'
// Admin components
import AdminDashboard from './components/pages/admin/AdminDashboard'
import AdminUsers from './components/pages/admin/AdminUsers'
import AdminProducts from './components/pages/admin/AdminProducts'
import AdminOrders from './components/pages/admin/AdminOrders'
import AdminCategories from './components/pages/admin/AdminCategories'
import AdminCoupons from './components/pages/admin/AdminCoupons'
import AdminCommunity from './components/pages/admin/AdminCommunity'
import AdminStatistics from './components/pages/admin/AdminStatistics'
import AdminSettings from './components/pages/admin/AdminSettings'
import AdminAuthGuard from './components/AdminAuthGuard'
import AdminLayout from './components/layout/AdminLayout'
import './App.css'
import 'react-toastify/dist/ReactToastify.css'

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
          <Route path="/account-locked" element={<AccountLocked />} />
          
          {/* Admin pages - redirect to main login */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={
            <AdminAuthGuard>
              <AdminLayout />
            </AdminAuthGuard>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="community" element={<AdminCommunity />} />
            <Route path="statistics" element={<AdminStatistics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Main pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}

export default App
