# Cải thiện Code để Dự án có thể Chạy được

Tài liệu này mô tả các cải thiện đã thực hiện để giúp dự án có thể chạy được và kiểm tra tất cả cấu trúc.

## Các Thay đổi Chính

### 1. Database Configuration (`backend/core/database.py`)
- ✅ **Trước:** Chỉ hỗ trợ MySQL, sẽ lỗi nếu thiếu biến môi trường
- ✅ **Sau:** 
  - Hỗ trợ SQLite mặc định (không cần cấu hình)
  - Tự động tạo thư mục `instance/` nếu chưa có
  - Hỗ trợ MySQL nếu có đủ biến môi trường (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
  - Hoặc dùng DATABASE_URL trực tiếp
  - Thêm `check_same_thread=False` cho SQLite để tương thích với FastAPI

### 2. Security Configuration (`backend/core/security.py`)
- ✅ **Trước:** SECRET_KEY hardcoded
- ✅ **Sau:** Lấy SECRET_KEY từ biến môi trường (SECRET_KEY), có giá trị mặc định nếu không có

### 3. Gemini API Key Handling

#### `backend/app/routers/prediction.py`
- ✅ **Trước:** Raise error ngay khi start nếu thiếu GEMINI_API_KEY
- ✅ **Sau:**
  - Chỉ warning khi thiếu GEMINI_API_KEY, không crash
  - Kiểm tra key trước khi sử dụng trong hàm `get_treatment_suggestion`
  - Trả về thông báo thân thiện nếu chưa cấu hình

#### `backend/app/routers/chatbot.py`
- ✅ **Trước:** Raise error khi thiếu GEMINI_API_KEY
- ✅ **Sau:**
  - Chỉ warning khi thiếu key, không crash
  - Kiểm tra model None trước khi sử dụng trong endpoint
  - Thêm logger để dễ debug

### 4. Model Loading (`backend/app/routers/prediction.py`)
- ✅ **Trước:** 
  - Đường dẫn model sai (tìm ở `ml_model/` thay vì `ml_model/ml_model/`)
  - Crash nếu không tìm thấy model files
- ✅ **Sau:**
  - Sửa đường dẫn đúng: `ml_model/ml_model/coffee_cls_best.pt`
  - Xử lý lỗi gracefully nếu model không tồn tại
  - Kiểm tra model None trước khi sử dụng trong endpoint
  - Thêm logging để dễ debug

### 5. Error Handling
- ✅ Thêm kiểm tra `cls_model is None` và `seg_model is None` trong endpoint `/api/prediction/analyze`
- ✅ Thêm kiểm tra `model is None` trong chatbot endpoint
- ✅ Cải thiện thông báo lỗi rõ ràng hơn

## Cách Chạy Dự án

### Backend

1. **Cài đặt dependencies:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r ../requirement.txt
```

2. **Tạo file `.env` trong `backend/`** (tùy chọn):
```
# Tối thiểu để chạy được (không bắt buộc):
SECRET_KEY=your-secret-key-here
SESSION_SECRET=your-session-secret

# Để sử dụng Gemini AI (tùy chọn):
GEMINI_API_KEY=your-gemini-api-key

# Để dùng MySQL thay vì SQLite (đã cài pymysql):
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=leafsense

# Hoặc dùng DATABASE_URL trực tiếp:
# DATABASE_URL=mysql+pymysql://user:password@host:port/database
```

**Lưu ý về MySQL:**
- Đã cài đặt `pymysql` driver
- Nếu có đủ 5 biến môi trường (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME), hệ thống sẽ tự động dùng MySQL
- Nếu thiếu bất kỳ biến nào, hệ thống sẽ fallback về SQLite
- Đảm bảo MySQL server đang chạy và database đã được tạo trước

**Lưu ý:**
- Nếu không có file `.env`, dự án vẫn chạy được với:
  - SQLite database (tự động tạo tại `backend/instance/leafsense.db`)
  - SECRET_KEY mặc định
- Các tính năng cần GEMINI_API_KEY sẽ không hoạt động nhưng không crash:
  - Gợi ý điều trị bệnh trong prediction
  - Chatbot

3. **Chạy backend:**
```bash
cd backend
python main.py
# hoặc
uvicorn main:app --reload
```

Backend sẽ chạy tại `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

## Cấu trúc Dự án

```
LeafSense_Project/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── core/
│   │   ├── database.py      # Database config (SQLite/MySQL)
│   │   ├── security.py      # JWT & auth
│   │   └── firebase_config.py
│   ├── instance/            # SQLite DB (tự động tạo)
│   ├── main.py              # Entry point
│   └── .env                 # Environment variables (tạo thủ công)
├── frontend/                # React + Vite
├── ml_model/
│   └── ml_model/            # YOLO model files
│       ├── coffee_cls_best.pt
│       └── coffee_seg_best.pt
└── requirement.txt          # Python dependencies
```

## Kiểm tra Cấu trúc

### Backend
- ✅ Database: SQLite tự động tạo tại `backend/instance/leafsense.db`
- ✅ Models: Tự động tạo tables khi start lần đầu
- ✅ API endpoints: Có thể test tại `http://127.0.0.1:8000/docs`

### Frontend
- ✅ Dependencies: Cài đặt với `npm install`
- ✅ Development server: Chạy với `npm run dev`

### ML Models
- ✅ Đường dẫn: `ml_model/ml_model/coffee_cls_best.pt` và `coffee_seg_best.pt`
- ✅ Tự động load khi có, warning nếu thiếu

## Troubleshooting

### Backend không start được
1. Kiểm tra Python version (cần 3.11+)
2. Kiểm tra đã cài dependencies: `pip list`
3. Xem logs để biết lỗi cụ thể

### Database errors
- SQLite: Tự động tạo tại `backend/instance/leafsense.db`
- MySQL: Kiểm tra biến môi trường DB_* hoặc DATABASE_URL

### Model không load được
- Kiểm tra file model tồn tại tại `ml_model/ml_model/`
- Xem warning trong logs để biết đường dẫn đúng

### Gemini API không hoạt động
- Thêm `GEMINI_API_KEY` vào file `.env`
- Lấy key tại: https://aistudio.google.com/app/apikey
- Tính năng vẫn chạy được nhưng không có AI suggestions

## Ghi chú

- Tất cả các thay đổi **không ảnh hưởng đến giao diện** (frontend/backend UI)
- Code có thể chạy được **ngay cả khi thiếu một số config** (database, API keys)
- Error handling được cải thiện để dễ debug hơn

