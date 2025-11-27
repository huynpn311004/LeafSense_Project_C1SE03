## LeafSense – Hướng dẫn chạy & thông tin dự án

LeafSense là hệ thống hỗ trợ nông hộ cà phê chẩn đoán bệnh lá, nhận khuyến nghị điều trị bằng AI, quản lý mua bán nông sản và tham gia cộng đồng. Dự án gồm backend FastAPI, frontend React/Vite, mô hình YOLO và dịch vụ Gemini/Firebase.

---

### 1. Tổng quan kiến trúc
- `backend/`: FastAPI với các router `auth`, `prediction`, `shop`, `community`, `chatbot`, …; models SQLAlchemy; services Firebase.
- `frontend/`: SPA React 19 (Vite) gồm dashboard, marketplace, chatbot và trang quản trị.
- `ml_model/`: Trọng số YOLO (`coffee_cls_best.pt`, `coffee_seg_best.pt`) và dataset phục vụ huấn luyện.
- `instance/`: Chứa SQLite DB (`leafsense.db`) tạo tự động khi chạy local.

---

### 2. Yêu cầu môi trường
- Python 3.11+ và pip.
- Node.js 20+ cùng npm.
- Firebase project với file service account JSON.
- Gemini API key (Google AI Studio).
- (Tùy chọn) Git LFS nếu quản lý file `.pt` lớn.

---

### 3. Hướng dẫn chạy backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r ../requirement.txt
```

Tạo file `.env` trong `backend/`:
```
GEMINI_API_KEY=your_gemini_key
SECRET_KEY=change_me
DATABASE_URL=sqlite:///./instance/leafsense.db   # có thể đổi sang MySQL
```

Sao chép file service account vào `backend/core/firebase-key.json`.

(Tùy chọn) seed data:
```bash
python create_admin.py
python create_sample_coupons.py
```

Chạy API:
```bash
uvicorn main:app --reload
```
Backend mặc định ở `http://127.0.0.1:8000`.

---

### 4. Hướng dẫn chạy frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Ứng dụng mở tại URL Vite (thường `http://localhost:5173`). Nếu backend đổi host/port, cập nhật các file API trong `frontend/src/services/`.

---

### 5. Quy trình phát triển
- Backend: cập nhật router ở `backend/app/routers/`, models ở `backend/app/models/`, schema ở `backend/app/schemas/`.
- Frontend: các trang nằm trong `frontend/src/components/pages/`, layout dùng lại ở `frontend/src/components/layout/`.
- ML: thay trọng số trong `ml_model/` hoặc mở notebook `ml_model/training_leafsense_coffee.ipynb` để huấn luyện lại.
- CSDL: dùng SQLite local (`instance/leafsense.db`). Nếu cần MySQL/PostgreSQL, cập nhật `DATABASE_URL` và cài driver phù hợp.

---

### 6. Script & thư mục hữu ích
- `backend/create_admin.py`: tạo nhanh tài khoản admin.
- `backend/create_sample_coupons.py`: thêm mã giảm giá mẫu.
- `backend/migration_account_lock.py`: script tiện ích xử lý khóa tài khoản.
- `frontend/public/debug-*`: các trang kiểm thử auth/like.

---

### 7. Kiểm thử & lint
- Backend: bổ sung test với PyTest (chưa có sẵn).
- Frontend: `npm run lint` (ESLint 9).

---

### 8. Gợi ý triển khai production
- Bảo mật `firebase-key.json` và `.env`, không commit lên repo.
- Dùng DB production (MySQL/PostgreSQL) và bật backup định kỳ.
- Đảm bảo phiên bản `torch`/`torchvision` tương thích GPU nếu chạy inference trên server.
- Cấu hình HTTPS, CORS và cơ chế refresh token trước khi public.

---

### 9. Đóng góp & giấy phép
1. Fork & clone repository.
2. Tạo branch mới cho tính năng/bugfix.
3. Viết code, cập nhật README hoặc docs nếu thay đổi hành vi.
4. Tạo pull request kèm mô tả và log/screenshot cần thiết.

License: chưa chỉ định (hãy bổ sung MIT/Apache-2.0… nếu cần).

