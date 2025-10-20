from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import re
from dotenv import load_dotenv
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import and_

# Import các thành phần cần thiết từ app
from core.database import get_db
from core.security import get_current_user
from app.schemas.chatbot_schema import ChatRequest, ChatResponse, ChatHistoryItem
from app.models.chat_history import ChatHistory  # Import ChatHistory model
from app.models.users import User

router = APIRouter()

# --- Load biến môi trường ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-pro")

if not API_KEY:
    raise ValueError(" Không tìm thấy GEMINI_API_KEY trong file .env")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL_NAME)

# Cấu hình thời gian lưu trữ chat history (3 giờ)
CHAT_HISTORY_RETENTION_HOURS = 3


def cleanup_old_chat_history(db: Session):
    """
    Xóa tất cả lịch sử chat cũ hơn 3 giờ
    """
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=CHAT_HISTORY_RETENTION_HOURS)
        deleted_count = db.query(ChatHistory)\
                          .filter(ChatHistory.timestamp < cutoff_time)\
                          .delete()
        db.commit()
        return deleted_count
    except Exception as e:
        db.rollback()
        return 0


def get_valid_chat_time_filter():
    """
    Trả về filter để chỉ lấy chat trong 3 giờ gần đây
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=CHAT_HISTORY_RETENTION_HOURS)
    return ChatHistory.timestamp >= cutoff_time


def clean_response_text(text: str) -> str:
    """
    Chuẩn hóa kết quả trả về từ Gemini để hiển thị đẹp hơn:
    - Chuyển đổi markdown sang HTML đơn giản
    - Giữ lại cấu trúc bullet points
    - Loại bỏ dòng trống dư thừa
    """
    if not text:
        return ""

    # Loại bỏ khoảng trắng đầu cuối
    text = text.strip()

    # Chuyển ** thành <strong> cho bold
    text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
    
    # Chuyển * thành <em> cho italic
    text = re.sub(r"\*(.*?)\*", r"<em>\1</em>", text)
    
    # Chuyển bullet points
    text = re.sub(r"^- ", "• ", text, flags=re.MULTILINE)
    text = re.sub(r"^\* ", "• ", text, flags=re.MULTILINE)
    
    # Xử lý xuống dòng
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if line:  # Chỉ giữ dòng có nội dung
            cleaned_lines.append(line)
    
    # Nối lại với <br> cho HTML
    result = '<br>'.join(cleaned_lines)
    
    return result


@router.post("/chatbot", response_model=ChatResponse)
def chatbot_reply(req: ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_message = req.message.strip()
    session_id = req.session_id or f"user_{current_user.id}_session"

    if not user_message:
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung để tôi có thể giúp bạn.")
    
    if model is None:
        raise HTTPException(status_code=500, detail="Mô hình AI chưa được khởi tạo.")

    # Thêm background task để dọn dẹp chat cũ
    background_tasks.add_task(cleanup_old_chat_history, db)

    try:
        # Xác định loại câu hỏi và tạo prompt phù hợp
        def get_specialized_prompt(message: str) -> str:
            message_lower = message.lower()
            
            # Template cho từng loại câu hỏi về CÀ PHÊ
            if "phát hiện bệnh" in message_lower or "bệnh lá" in message_lower:
                return f"""
Xin chào! Tôi là chuyên gia bệnh cây cà phê của LeafSense. Rất vui được hỗ trợ bạn! 🌱

Câu hỏi của bạn: {message}

Tôi sẽ hướng dẫn bạn cách phát hiện bệnh lá cà phê:
• Dấu hiệu bệnh lá cà phê (2-3 điểm cụ thể)
• Cách kiểm tra cây cà phê (1-2 bước)  
• Lưu ý quan trọng cho cà phê (1 điểm)
"""
            
            elif "rỉ sắt" in message_lower or "điều trị" in message_lower:
                return f"""
Xin chào! Tôi là chuyên gia điều trị bệnh cà phê của LeafSense, sẵn sàng giúp bạn! 🌱💚

Câu hỏi của bạn: {message}

Tôi sẽ hướng dẫn bạn cách điều trị bệnh cà phê:
• Biện pháp khẩn cấp cho cây cà phê (1-2 điểm)
• Phương pháp điều trị cà phê (2-3 điểm)
• Phòng ngừa tái phát ở cà phê (1 điểm)
"""
                
            elif "phân bón" in message_lower:
                return f"""
Xin chào! Tôi là chuyên gia dinh dưỡng cây cà phê của LeafSense, rất vui được tư vấn cho bạn! 🌱🌿

Câu hỏi của bạn: {message}

Tôi sẽ tư vấn về phân bón cho cà phê:
• Loại phân bón phù hợp cho cà phê
• Liều lượng và thời điểm bón cho cà phê  
• Cách bón hiệu quả cho cây cà phê
"""
                
            elif "tưới nước" in message_lower:
                return f"""
Xin chào! Tôi là chuyên gia chăm sóc cây cà phê của LeafSense, sẵn sàng hỗ trợ bạn! 🌱💧

Câu hỏi của bạn: {message}

Tôi sẽ hướng dẫn cách tưới nước cho cà phê:
• Tần suất tưới nước cho cà phê
• Lượng nước phù hợp cho cây cà phê
• Thời điểm tưới tốt nhất cho cà phê
"""
                
            elif "thu hoạch" in message_lower:
                return f"""
Xin chào! Tôi là chuyên gia thu hoạch cà phê của LeafSense, rất vui được hướng dẫn bạn! 🌱☕

Câu hỏi của bạn: {message}

Tôi sẽ hướng dẫn về thu hoạch cà phê:
• Dấu hiệu quả cà phê chín muồi
• Thời điểm thu hoạch cà phê tốt nhất
• Kỹ thuật thu hoạch cà phê đúng cách
"""
            
            else:
                # Prompt chung cho các câu hỏi khác - CHỈ VỀ CÀ PHÊ
                return f"""
Xin chào! Tôi là AI chuyên gia về cây cà phê của LeafSense, rất vui được hỗ trợ bạn! 🌱☕

Tôi có thể giúp bạn về:
• Chẩn đoán bệnh cà phê  
• Hướng dẫn điều trị và phòng ngừa
• Tư vấn chăm sóc cây cà phê
• Kỹ thuật trồng và thu hoạch

LƯU Ý:
- CHỈ TRẢ LỜI CÁC CÂU HỎI VỀ CÀ PHÊ
- Nếu câu hỏi không liên quan đến cà phê, tôi sẽ từ chối lịch sự và hướng dẫn hỏi về cà phê
- Trả lời NGẮN GỌN, DỄ HIỂU (tối đa 3-4 câu)
- Sử dụng bullet points (•) cho danh sách
- Đưa ra thông tin THỰC TẾ, HỮU ÍCH về cà phê

CHUYÊN MÔN CÀ PHÊ:
- Bệnh cà phê: rỉ sắt, đốm nâu, nấm bệnh
- Chăm sóc cà phê: tưới nước, phân bón, cắt tỉa  
- Kỹ thuật trồng cà phê: gieo trồng, thu hoạch, sấy khô
- Giống cà phê: Arabica, Robusta

Câu hỏi của bạn: {message}

Hãy để tôi giúp bạn về cà phê nhé! Trả lời thân thiện và hữu ích:"""

        specialized_prompt = get_specialized_prompt(user_message)
        result = model.generate_content(specialized_prompt)
        cleaned_response = clean_response_text(result.text)
        
        # Thêm gợi ý câu hỏi tiếp theo về CÀ PHÊ
        def add_follow_up_suggestion(message: str, response: str) -> str:
            message_lower = message.lower()
            suggestions = []
            
            if "phát hiện bệnh" in message_lower or "nhận biết" in message_lower:
                suggestions = ["Cách điều trị bệnh rỉ sắt cà phê?", "Phòng ngừa bệnh lá cà phê như thế nào?"]
            elif "rỉ sắt" in message_lower or "điều trị" in message_lower:
                suggestions = ["Phân bón nào giúp cà phê phục hồi?", "Cách tăng sức đề kháng cây cà phê?"]
            elif "phân bón" in message_lower:
                suggestions = ["Khi nào tưới nước cho cà phê?", "Cách quan sát cây cà phê phát triển?"]
            elif "tưới nước" in message_lower:
                suggestions = ["Dấu hiệu cây cà phê thiếu nước?", "Cách cải thiện đất trồng cà phê?"]
            elif "thu hoạch" in message_lower:
                suggestions = ["Cách sấy khô cà phê đúng cách?", "Bảo quản cà phê sau thu hoạch?"]
                
            if suggestions:
                suggestion_text = "<br><br><em>🌱 Câu hỏi về cà phê tiếp theo:</em><br>• " + "<br>• ".join(suggestions)
                return response + suggestion_text
            return response
        
        final_response = add_follow_up_suggestion(user_message, cleaned_response)

        # Lưu lịch sử chat bằng SQLAlchemy
        db_chat = ChatHistory(
            user_id=current_user.id,
            session_id=session_id,
            user_message=user_message,
            bot_response=final_response
        )
        db.add(db_chat)
        db.commit()

        return ChatResponse(response=final_response)
    except Exception as e:
        # Không log ra terminal, chỉ trả về lỗi cho client
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chatbot/history", response_model=list[ChatHistoryItem])
def get_user_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy lịch sử chat của user hiện tại (chỉ trong 3 giờ gần đây)"""
    chat_history = db.query(ChatHistory)\
                     .filter(
                         and_(
                             ChatHistory.user_id == current_user.id,
                             get_valid_chat_time_filter()
                         )
                     )\
                     .order_by(ChatHistory.timestamp.desc())\
                     .limit(50)\
                     .all()
    return chat_history

@router.get("/chatbot/history/{session_id}", response_model=list[ChatHistoryItem])
def get_session_chat_history(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy lịch sử chat của một session cụ thể thuộc về user hiện tại (chỉ trong 3 giờ gần đây)"""
    chat_history = db.query(ChatHistory)\
                     .filter(
                         and_(
                             ChatHistory.user_id == current_user.id,
                             ChatHistory.session_id == session_id,
                             get_valid_chat_time_filter()
                         )
                     )\
                     .order_by(ChatHistory.timestamp.desc())\
                     .limit(20)\
                     .all()
    return chat_history

@router.delete("/chatbot/history")
def clear_user_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Xóa tất cả lịch sử chat của user hiện tại"""
    deleted_count = db.query(ChatHistory)\
                      .filter(ChatHistory.user_id == current_user.id)\
                      .delete()
    db.commit()
    return {"message": f"Đã xóa {deleted_count} tin nhắn trong lịch sử chat"}

@router.delete("/chatbot/history/{session_id}")
def clear_session_chat_history(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Xóa lịch sử chat của một session cụ thể thuộc về user hiện tại"""
    deleted_count = db.query(ChatHistory)\
                      .filter(
                          ChatHistory.user_id == current_user.id,
                          ChatHistory.session_id == session_id
                      )\
                      .delete()
    db.commit()
    return {"message": f"Đã xóa {deleted_count} tin nhắn trong session '{session_id}'"}

@router.post("/chatbot/cleanup")
def manual_cleanup_old_chats(db: Session = Depends(get_db)):
    """Kích hoạt việc dọn dẹp chat cũ hơn 3 giờ thủ công"""
    deleted_count = cleanup_old_chat_history(db)
    return {
        "message": f"Đã xóa {deleted_count} tin nhắn chat cũ hơn {CHAT_HISTORY_RETENTION_HOURS} giờ",
        "retention_hours": CHAT_HISTORY_RETENTION_HOURS,
        "cutoff_time": (datetime.utcnow() - timedelta(hours=CHAT_HISTORY_RETENTION_HOURS)).isoformat()
    }

@router.get("/chatbot/stats")
def get_chat_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Thống kê lịch sử chat của user hiện tại"""
    base_query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    
    # Tổng số chat
    total_chats = base_query.count()
    
    # Chat trong 3 giờ gần đây
    cutoff_time = datetime.utcnow() - timedelta(hours=CHAT_HISTORY_RETENTION_HOURS)
    recent_chats = base_query.filter(ChatHistory.timestamp >= cutoff_time).count()
    
    # Chat cũ sẽ bị xóa
    old_chats = base_query.filter(ChatHistory.timestamp < cutoff_time).count()
    
    return {
        "total_chats": total_chats,
        "recent_chats_count": recent_chats,
        "old_chats_to_delete": old_chats,
        "retention_hours": CHAT_HISTORY_RETENTION_HOURS,
        "cutoff_time": cutoff_time.isoformat(),
        "next_cleanup_deletes_before": cutoff_time.isoformat()
    }

@router.get("/chatbot/cleanup-status")
def get_cleanup_status():
    """Kiểm tra trạng thái của hệ thống tự động xóa chat"""
    cutoff_time = datetime.utcnow() - timedelta(hours=CHAT_HISTORY_RETENTION_HOURS)
    return {
        "auto_cleanup_enabled": True,
        "retention_hours": CHAT_HISTORY_RETENTION_HOURS,
        "cleanup_frequency": "Mỗi khi có chat mới và mỗi 30 phút",
        "cutoff_time": cutoff_time.isoformat(),
        "description": f"Hệ thống sẽ tự động xóa tất cả chat cũ hơn {CHAT_HISTORY_RETENTION_HOURS} giờ"
    }
