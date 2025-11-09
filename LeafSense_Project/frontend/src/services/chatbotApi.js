import api from './authApi';

const CHATBOT_API_BASE = '/chatbot';

export const chatbotService = {
  // Gửi tin nhắn đến chatbot
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post(CHATBOT_API_BASE, {
      message,
      session_id: sessionId
    });
    return response.data;
  },

  // Lấy tất cả lịch sử chat của user hiện tại
  getChatHistory: async () => {
    const response = await api.get(`${CHATBOT_API_BASE}/history`);
    return response.data;
  },

  // Lấy lịch sử chat của một session cụ thể
  getSessionHistory: async (sessionId) => {
    const response = await api.get(`${CHATBOT_API_BASE}/history/${sessionId}`);
    return response.data;
  },

  // Xóa tất cả lịch sử chat của user
  clearAllHistory: async () => {
    const response = await api.delete(`${CHATBOT_API_BASE}/history`);
    return response.data;
  },

  // Xóa lịch sử chat của một session cụ thể
  clearSessionHistory: async (sessionId) => {
    const response = await api.delete(`${CHATBOT_API_BASE}/history/${sessionId}`);
    return response.data;
  }
};

export default chatbotService;