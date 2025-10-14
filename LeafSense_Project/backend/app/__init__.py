import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.database import Base, engine
# Routers: prediction is optional to avoid heavy deps during shop dev
try:
    from app.routers import prediction
except Exception:
    prediction = None
from app.routers import auth, users, shop  # ✅ giữ các router chính
from app.models import *  # Import all models to register them

def create_app() -> FastAPI:
    # Load env
    load_dotenv()
    app = FastAPI(
        title="LeafSense API",
        description="API for leaf disease detection",
        version="1.0.0"
    )

    # CORS
    origins = [
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
        "http://localhost:5174",   # vite đôi khi chạy port 5174
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from starlette.middleware.sessions import SessionMiddleware
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET", "supersecret")
    )

    # DB init (sau khi import models)
    Base.metadata.create_all(bind=engine)

    # Static files for avatars
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    # Routers
    if prediction is not None:
        app.include_router(prediction.router)
    app.include_router(auth.router, prefix="/api", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/user", tags=["User Management"])
    app.include_router(shop.router, prefix="/api", tags=["Shop"])

    # Health check
    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app
