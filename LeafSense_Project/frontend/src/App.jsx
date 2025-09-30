import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/pages/Dashboard'
import UploadPage from './components/pages/UploadPage'
import HistoryPage from './components/pages/HistoryPage'
import MarketplacePage from './components/pages/MarketplacePage'
import ChatbotPage from './components/pages/ChatbotPage'
import SettingsPage from './components/pages/SettingsPage'
import CommunityPage from './components/pages/CommunityPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
