import React, { useState, useEffect, useRef } from 'react'
import Layout from '../layout/Layout'
import './ChatbotPage.css'

const ChatbotPage = () => {
  // ===== STATE MANAGEMENT =====
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // ===== SAMPLE DATA & MOCK RESPONSES - THAY ĐỔI DỮ LIỆU THẬT TẠI ĐÂY =====
  // Để thay đổi dữ liệu thật, chỉ cần:
  // 1. Thay đổi URL API ở dòng 25 trong hàm sendMessage()
  // 2. Cập nhật cấu trúc dữ liệu request/response nếu cần
  // 3. Dữ liệu mẫu hiện tại sẽ được thay thế bằng dữ liệu từ API thật

  const sampleResponses = [
    "Xin chào! Tôi là AI assistant của LeafSense. Tôi có thể giúp bạn phân tích bệnh cây trồng, tư vấn chăm sóc cây, và trả lời các câu hỏi về nông nghiệp. Bạn cần hỗ trợ gì?",
    "Để phân tích bệnh cây trồng, bạn có thể upload hình ảnh lá cây bị bệnh lên hệ thống. Tôi sẽ giúp bạn xác định loại bệnh và đưa ra phương pháp điều trị phù hợp.",
    "Các loại bệnh phổ biến ở cây cà phê bao gồm: bệnh gỉ sắt, bệnh khô cành, bệnh thối rễ. Mỗi loại bệnh có triệu chứng và cách điều trị khác nhau.",
    "Để chăm sóc cây cà phê tốt, bạn cần: tưới nước đều đặn, bón phân cân đối, cắt tỉa cành thường xuyên, và phòng trừ sâu bệnh kịp thời.",
    "Tôi có thể giúp bạn xác định các loại sâu bệnh hại cây trồng thông qua hình ảnh. Bạn có muốn upload ảnh để tôi phân tích không?",
    "Cảm ơn bạn đã sử dụng LeafSense! Nếu có thêm câu hỏi gì, đừng ngần ngại hỏi tôi nhé."
  ]

  const quickQuestions = [
    "Cách phân tích bệnh cây trồng?",
    "Bệnh phổ biến ở cây cà phê?",
    "Cách chăm sóc cây cà phê?",
    "Phòng trừ sâu bệnh như thế nào?",
    "Tư vấn phân bón cho cây trồng"
  ]

  // ===== API INTEGRATION - THAY ĐỔI URL API TẠI ĐÂY =====
  const sendMessage = async (message) => {
    try {
      setIsLoading(true)
      setIsTyping(true)

      // THAY ĐỔI URL API CỦA BẠN TẠI ĐÂY
      const response = await fetch('/api/chatbot', { // <-- Thay đổi URL API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Thêm headers khác nếu cần (Authorization, API Key, etc.)
        },
        body: JSON.stringify({
          message: message,
          // Thêm các trường khác nếu API yêu cầu:
          // user_id: currentUser.id,
          // session_id: sessionId,
          // context: previousMessages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // MAPPING DỮ LIỆU API - ĐIỀU CHỈNH NẾU CẤU TRÚC KHÁC
      const botResponse = {
        id: Date.now() + 1,
        text: data.response || data.message || data.answer, // <-- Điều chỉnh tên trường
        sender: 'bot',
        timestamp: new Date().toISOString(),
        // Thêm các trường khác nếu API trả về:
        // confidence: data.confidence,
        // suggestions: data.suggestions,
        // related_topics: data.related_topics
      }

      setMessages(prev => [...prev, botResponse])
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // FALLBACK VỀ DỮ LIỆU MẪU NẾU API LỖI
      const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)]
      const botResponse = {
        id: Date.now() + 1,
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, botResponse])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // ===== MESSAGE FUNCTIONS =====
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Gửi tin nhắn đến API
    await sendMessage(inputMessage)
  }

  const handleQuickQuestion = (question) => {
    setInputMessage(question)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // ===== AUTO SCROLL =====
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // ===== INITIAL MESSAGE =====
  useEffect(() => {
    const welcomeMessage = {
      id: 1,
      text: "Xin chào! Tôi là AI assistant của LeafSense. Tôi có thể giúp bạn phân tích bệnh cây trồng, tư vấn chăm sóc cây, và trả lời các câu hỏi về nông nghiệp. Bạn cần hỗ trợ gì?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
  }, [])

  // ===== RENDER MESSAGE =====
  const renderMessage = (message) => {
    const isUser = message.sender === 'user'
    const time = new Date(message.timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })

    return (
      <div key={message.id} className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
        <div className="message-content">
          <div className="message-text">{message.text}</div>
          <div className="message-time">{time}</div>
        </div>
        {!isUser && (
          <div className="bot-avatar">
            🤖
          </div>
        )}
      </div>
    )
  }

  // ===== RENDER MAIN CONTENT =====
  return (
    <Layout>
      <div className="chatbot-page">
        {/* HEADER */}
        <div className="chatbot-header">
          <h1>AI Assistant</h1>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Online</span>
          </div>
        </div>

        {/* CHAT CONTAINER */}
        <div className="chat-container">
          {/* MESSAGES AREA */}
          <div className="messages-area">
            {messages.map(renderMessage)}
            
            {/* TYPING INDICATOR */}
            {isTyping && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="bot-avatar">🤖</div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK QUESTIONS */}
          {messages.length <= 1 && (
            <div className="quick-questions">
              <h3>Câu hỏi thường gặp:</h3>
              <div className="quick-questions-grid">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="quick-question-btn"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <div className="input-area">
            <form onSubmit={handleSendMessage} className="message-form">
              <div className="input-container">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="message-input"
                  rows="1"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    '📤'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ChatbotPage
