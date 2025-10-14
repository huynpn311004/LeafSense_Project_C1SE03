from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load env early so DATABASE_URL is available at import-time
load_dotenv()

# Default to SQLite if no DATABASE_URL provided
os.makedirs("./instance", exist_ok=True)
db_path = "./instance/leafsense.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{db_path}")

# If using SQLite, we need special connect args; otherwise leave empty
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
