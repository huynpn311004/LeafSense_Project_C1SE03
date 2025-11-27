from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

# Lấy DATABASE_URL từ env, nếu không có thì dùng SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

# Kiểm tra xem có đủ thông tin MySQL không
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

has_mysql_config = all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME])

# Nếu DATABASE_URL được set và là MySQL URL, giữ nguyên
# Nếu không, kiểm tra MySQL config
if not DATABASE_URL:
    if has_mysql_config:
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        # Mặc định dùng SQLite
        BASE_DIR = Path(__file__).resolve().parent.parent
        INSTANCE_DIR = BASE_DIR / "instance"
        INSTANCE_DIR.mkdir(exist_ok=True)
        DATABASE_URL = f"sqlite:///{INSTANCE_DIR}/leafsense.db"
elif DATABASE_URL.startswith("mysql"):
    # Nếu DATABASE_URL là MySQL nhưng không có MySQL config, fallback về SQLite
    if not has_mysql_config:
        BASE_DIR = Path(__file__).resolve().parent.parent
        INSTANCE_DIR = BASE_DIR / "instance"
        INSTANCE_DIR.mkdir(exist_ok=True)
        DATABASE_URL = f"sqlite:///{INSTANCE_DIR}/leafsense.db"

# Tạo engine với connect_args cho SQLite để hỗ trợ foreign keys
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Thử tạo engine, nếu lỗi (ví dụ thiếu driver MySQL) thì fallback về SQLite
try:
    engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    # Nếu có lỗi và đang dùng MySQL, fallback về SQLite
    if DATABASE_URL.startswith("mysql"):
        print(f"Warning: Could not connect to MySQL ({e}). Falling back to SQLite.")
        BASE_DIR = Path(__file__).resolve().parent.parent
        INSTANCE_DIR = BASE_DIR / "instance"
        INSTANCE_DIR.mkdir(exist_ok=True)
        DATABASE_URL = f"sqlite:///{INSTANCE_DIR}/leafsense.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
    else:
        raise

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
