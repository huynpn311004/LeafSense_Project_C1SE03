from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# Schema cho request gửi tin nhắn đến chatbot
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

# Schema cho response từ chatbot
class ChatResponse(BaseModel):
    response: str

# Schema cho một mục trong lịch sử chat
class ChatHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_message: str
    bot_response: str
    timestamp: datetime