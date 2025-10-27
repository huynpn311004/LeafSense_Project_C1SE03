import React, { useState, useEffect, useRef } from 'react';
import Layout from '../layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotService } from '../../services/chatbotApi';
import './ChatbotPage.css';

// ===========================================
// ===== COMPONENT MỚI: RENDER NỘI DUNG BOT =====
// ===========================================
/**
 * Component render nội dung Bot với HTML formatting
 */
const BotMessageContent = ({ text }) => {
    return (
        <div 
            className="message-text bot-formatted" 
            dangerouslySetInnerHTML={{ __html: text }} 
        />
    );
};

// Hàm quản lý Session ID (Không đổi)
const getSessionId = () => {
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
}

const ChatbotPage = () => {
    // ===== AUTHENTICATION =====
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    
    // Fallback authentication check
    const [fallbackAuth, setFallbackAuth] = useState({
        isAuthenticated: false,
        user: null,
        isLoading: true
    });
    
    useEffect(() => {
        // Kiểm tra auth từ localStorage như fallback
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setFallbackAuth({
                    isAuthenticated: true,
                    user: userData,
                    isLoading: false
                });
            } catch (error) {
                console.error('Error parsing user data:', error);
                setFallbackAuth({
                    isAuthenticated: false,
                    user: null,
                    isLoading: false
                });
            }
        } else {
            setFallbackAuth({
                isAuthenticated: false,
                user: null,
                isLoading: false
            });
        }
    }, []);
    
    // Sử dụng AuthContext nếu có, không thì dùng fallback
    const finalAuth = {
        isAuthenticated: isAuthenticated || fallbackAuth.isAuthenticated,
        user: user || fallbackAuth.user,
        isLoading: authLoading && fallbackAuth.isLoading
    };
    
    // Debug console logs
    console.log('ChatbotPage auth:', { 
        authContext: { isAuthenticated, user, authLoading },
        fallback: fallbackAuth,
        final: finalAuth
    });
    
    // ===== STATE MANAGEMENT =====
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const quickQuestions = [
        "Cách nhận biết bệnh rỉ sắt cà phê?",
        "Phân bón nào tốt cho cây cà phê?",
        "Khi nào thu hoạch cà phê?",
        "Tưới nước cho cà phê thế nào?",
        "Cách phòng ngừa bệnh lá cà phê?"
    ];

    // ===== API INTEGRATION =====
    const sendMessage = async (message) => {
        if (!finalAuth.isAuthenticated) {
            const botResponse = {
                id: Date.now() + 1,
                text: 'Vui lòng đăng nhập để sử dụng chatbot.',
                sender: 'bot',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, botResponse]);
            return;
        }

        try {
            setIsLoading(true);
            setIsTyping(true);

            const sessionId = getSessionId();
            
            // Thử dùng chatbotService trước (cần auth)
            if (finalAuth.isAuthenticated) {
                try {
                    const data = await chatbotService.sendMessage(message, sessionId);
                    
                    const botResponse = {
                        id: Date.now() + 1,
                        text: data.response, 
                        sender: 'bot',
                        timestamp: new Date().toISOString(),
                    };

                    setMessages(prev => [...prev, botResponse]);
                    return;
                } catch (authError) {
                    console.log('Auth chatbot failed, trying fallback:', authError);
                    // Nếu lỗi auth, thử fallback method
                }
            }
            
            // Fallback: gọi API trực tiếp (cho trường hợp chưa có auth)
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    message: message,
                    session_id: sessionId, 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Lỗi không xác định' }));
                
                if (response.status === 401) {
                    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                }
                
                throw new Error(errorData.detail || `Lỗi API ${response.status}`);
            }

            const data = await response.json();
            
            const botResponse = {
                id: Date.now() + 1,
                text: data.response, 
                sender: 'bot',
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, botResponse]);
            
        } catch (error) {
            console.error('Error sending message:', error);
            let errorMessage = 'Không thể kết nối máy chủ.';
            
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }
            
            const botResponse = {
                id: Date.now() + 1,
                text: `Lỗi: ${errorMessage}`,
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botResponse]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    // ===== MESSAGE FUNCTIONS =====
    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        await sendMessage(inputMessage);
    };

    const handleQuickQuestion = (question) => {
        // Tự động gửi câu hỏi nhanh khi được nhấp
        const userMessage = {
            id: Date.now(),
            text: question,
            sender: 'user',
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        sendMessage(question);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // ===== AUTO SCROLL =====
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ===== Tải lịch sử chat khi khởi động =====
    useEffect(() => {
        // Chỉ load chat history khi user đã đăng nhập
        if (!finalAuth.isLoading && finalAuth.isAuthenticated) {
            const loadChatHistory = async () => {
                const sessionId = getSessionId();
                setIsLoading(true);
                
                try {
                    let history = null;
                    
                    // Thử dùng chatbotService trước (cần auth)
                    if (finalAuth.isAuthenticated) {
                        try {
                            history = await chatbotService.getSessionHistory(sessionId);
                        } catch (authError) {
                            console.log('Auth history failed, trying fallback:', authError);
                            // Nếu lỗi auth, thử fallback method
                        }
                    }
                    
                    // Fallback: gọi API trực tiếp
                    if (!history) {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`http://localhost:8000/api/chatbot/history/${sessionId}`, {
                            headers: {
                                ...(token && { 'Authorization': `Bearer ${token}` })
                            }
                        });

                        if (response.ok) {
                            history = await response.json();
                        } else if (response.status === 401) {
                            // Token expired, sẽ hiển thị welcome message
                            history = null;
                        }
                    }

                    if (history && history.length > 0) {
                        const formattedHistory = history.reverse().flatMap((item, index) => [
                            { id: `hist_user_${index}`, text: item.user_message, sender: 'user', timestamp: item.timestamp },
                            { id: `hist_bot_${index}`, text: item.bot_response, sender: 'bot', timestamp: item.timestamp },
                        ]);
                        setMessages(formattedHistory);
                    } else {
                        const welcomeMessage = {
                            id: 1,
                            text: `Xin chào <strong>${finalAuth.user?.name || 'bạn'}</strong>! Tôi là AI chuyên gia <strong>CÀ PHÊ</strong> của LeafSense.<br>• <strong>Chẩn đoán bệnh cà phê</strong><br>• Hướng dẫn điều trị và phòng ngừa<br>• Tư vấn chăm sóc cây cà phê<br>• Kỹ thuật trồng và thu hoạch<br><br>🌱 <em>Tôi chỉ trả lời các câu hỏi về cà phê!</em>`,
                            sender: 'bot',
                            timestamp: new Date().toISOString()
                        };
                        setMessages([welcomeMessage]);
                    }
                } catch (error) {
                    console.error("Lỗi tải lịch sử chat:", error);
                    
                    if (error.response?.status === 401) {
                        // Token expired, show login message
                        const loginMessage = {
                            id: 1,
                            text: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để sử dụng chatbot.",
                            sender: 'bot',
                            timestamp: new Date().toISOString()
                        };
                        setMessages([loginMessage]);
                    } else {
                        const welcomeMessage = {
                            id: 1,
                            text: `Xin chào <strong>${finalAuth.user?.name || 'bạn'}</strong>! Tôi là AI chuyên gia <strong>CÀ PHÊ</strong> của LeafSense.<br>Có lỗi xảy ra khi tải lịch sử, nhưng bạn vẫn có thể hỏi về cà phê!`,
                            sender: 'bot',
                            timestamp: new Date().toISOString()
                        };
                        setMessages([welcomeMessage]);
                    }
                } finally {
                    setIsLoading(false);
                }
            };

            loadChatHistory();
        } else if (!finalAuth.isLoading && !finalAuth.isAuthenticated) {
            // User not logged in, show login message
            const loginMessage = {
                id: 1,
                text: "Xin chào! Để sử dụng AI chuyên gia cà phê, vui lòng <a href='/login' style='color: #2E7D32; text-decoration: underline;'>đăng nhập</a> hoặc <a href='/signup' style='color: #2E7D32; text-decoration: underline;'>đăng ký</a> tài khoản.",
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            setMessages([loginMessage]);
        }
    }, [finalAuth.isLoading, finalAuth.isAuthenticated, finalAuth.user]); 

    // ===========================================
    // ===== CẬP NHẬT RENDER MESSAGE =====
    // ===========================================
    const renderMessage = (message) => {
        const isUser = message.sender === 'user';
        const time = new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return (
            <div key={message.id} className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
                {/* Bot Avatar */}
                {!isUser && (
                    <div className="bot-avatar">
                        🤖
                    </div>
                )}
                
                <div className="message-content">
                    {/* Sử dụng BotMessageContent cho tin nhắn Bot */}
                    {isUser ? (
                        <div className="message-text">{message.text}</div>
                    ) : (
                        <BotMessageContent text={message.text} /> 
                    )}
                    <div className="message-time">{time}</div>
                </div>
                
                {/* User Avatar */}
                {isUser && (
                    <div className="user-avatar">
                        👤
                    </div>
                )}
            </div>
        );
    };

    // ===== RENDER MAIN CONTENT =====
    // Hiển thị loading khi đang check auth
    if (finalAuth.isLoading) {
        return (
            <Layout>
                <div className="chatbot-page">
                    <div className="chatbot-header">
                        <h1>🌱 AI Chuyên Gia Cà Phê</h1>
                        <div className="status-indicator">
                            <div className="status-dot"></div>
                            <span>Đang tải...</span>
                        </div>
                    </div>
                    <div className="chat-container">
                        <div className="messages-area">
                            <div className="message bot-message">
                                <div className="bot-avatar">🤖</div>
                                <div className="message-content">
                                    <div className="message-text">Đang kiểm tra đăng nhập...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="chatbot-page">
                {/* HEADER */}
                <div className="chatbot-header">
                    <h1>🌱 AI Chuyên Gia Cà Phê</h1>
                    <div className="status-indicator">
                        <div className="status-dot"></div>
                        <span>{finalAuth.isAuthenticated ? `Xin chào ${finalAuth.user?.name || 'Farmer'}` : 'Vui lòng đăng nhập'}</span>
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
                                <div className="bot-avatar">🤖</div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* QUICK QUESTIONS */}
                    {messages.length <= 1 && finalAuth.isAuthenticated && (
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
                                    placeholder={finalAuth.isAuthenticated ? "Nhập câu hỏi của bạn..." : "Vui lòng đăng nhập để sử dụng chatbot"}
                                    className="message-input"
                                    rows="1"
                                    disabled={isLoading || !finalAuth.isAuthenticated}
                                />
                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={!inputMessage.trim() || isLoading || !finalAuth.isAuthenticated}
                                >
                                    {isLoading && !isTyping ? ( 
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
    );
};

export default ChatbotPage;