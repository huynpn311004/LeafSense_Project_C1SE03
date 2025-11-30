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

  // Lấy lịch sử chat của một session (trong vòng 1 giờ)
  getSessionHistory: async (sessionId) => {
    const response = await api.get(`${CHATBOT_API_BASE}/history/${sessionId}`);
    return response.data;
  },
};

export default chatbotService;