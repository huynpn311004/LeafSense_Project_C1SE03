import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.database import Base, engine
from app.routers import prediction, auth, users, history_upload, shop, admin, coupon  # Import router mới
from app.models.users import PasswordResetToken
from app.models.coupon import Coupon
from app.models.coupon_usage import CouponUsage
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
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"), "http://localhost:5174", "http://localhost:3000",
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
    app.include_router(prediction.router)
    app.include_router(auth.router, prefix="/api", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/user", tags=["User Management"])
    app.include_router(history_upload.router, prefix="/api", tags=["History"])
    app.include_router(shop.router, prefix="/api/shop", tags=["Shop"])
    app.include_router(admin.router, prefix="/api", tags=["Admin"])
    app.include_router(coupon.router, prefix="/api", tags=["Coupons"])

    # Health check
    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app
