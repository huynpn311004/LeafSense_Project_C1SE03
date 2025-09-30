from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cấu hình MySQL - Thay đổi thông tin theo MySQL của bạn
# Format: mysql+mysqlclient://username:password@host:port/database_name
DATABASE_URL = "mysql+mysqlclient://root:785619@localhost:3306/leafsense"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
