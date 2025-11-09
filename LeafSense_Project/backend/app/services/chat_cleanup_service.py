import asyncio
import threading
import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from core.database import SessionLocal
from app.models.chat_history import ChatHistory

class ChatCleanupService:
    def __init__(self):
        self.retention_hours = 3
        self.is_running = False
        self.cleanup_thread = None
        self.cleanup_interval_minutes = 30  # Cleanup mỗi 30 phút
    
    def cleanup_old_chats(self):
        """Xóa chat cũ hơn retention_hours"""
        db = SessionLocal()
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=self.retention_hours)
            deleted_count = db.query(ChatHistory)\
                              .filter(ChatHistory.timestamp < cutoff_time)\
                              .delete()
            db.commit()
            return deleted_count
        except Exception as e:
            db.rollback()
            return 0
        finally:
            db.close()
    
    def start_scheduler(self):
        """Bắt đầu scheduler để chạy cleanup định kỳ"""
        if self.is_running:
            return
        
        def run_cleanup_loop():
            self.is_running = True
            
            while self.is_running:
                try:
                    # Chạy cleanup im lặng
                    self.cleanup_old_chats()
                    
                    # Chờ interval_minutes
                    for _ in range(self.cleanup_interval_minutes * 60):  # Convert to seconds
                        if not self.is_running:
                            break
                        time.sleep(1)
                        
                except Exception as e:
                    time.sleep(60)  # Chờ 1 phút trước khi thử lại
        
        self.cleanup_thread = threading.Thread(target=run_cleanup_loop, daemon=True)
        self.cleanup_thread.start()
    
    def stop_scheduler(self):
        """Dừng scheduler"""
        self.is_running = False
    
    def manual_cleanup(self):
        """Chạy cleanup thủ công"""
        return self.cleanup_old_chats()

# Global instance
chat_cleanup_service = ChatCleanupService()

def start_chat_cleanup_service():
    """Khởi động service cleanup chat"""
    chat_cleanup_service.start_scheduler()

def stop_chat_cleanup_service():
    """Dừng service cleanup chat"""
    chat_cleanup_service.stop_scheduler()

def manual_chat_cleanup():
    """Chạy cleanup chat thủ công"""
    return chat_cleanup_service.manual_cleanup()