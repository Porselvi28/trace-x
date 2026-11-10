import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging_config import logger
from app.core.security import hash_password
from app.database.connection import engine, SessionLocal, Base
from app.database import models

# Import routers
from app.routers import (
    auth, dashboard, cases, evidence, integrity,
    custody, processing, events, search, timeline,
    correlation, authenticity, reports, audit, system, users
)

def seed_initial_data():
    """Seeds initial administrative account and college demonstration case if empty."""
    db = SessionLocal()
    try:
        # 1. Seed Administrator & Investigator
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            admin_user = models.User(
                username="admin",
                email="admin@tracex.internal",
                hashed_password=hash_password("adminpassword123"),
                full_name="Lead Forensic Administrator",
                role="Administrator",
                badge_number="TRX-DIR-01",
                agency="Digital Forensic Investigation Unit",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)
            logger.info("Default administrator account created: admin / adminpassword123")

        inv_user = db.query(models.User).filter(models.User.username == "investigator").first()
        if not inv_user:
            inv_user = models.User(
                username="investigator",
                email="investigator@tracex.internal",
                hashed_password=hash_password("investigator123"),
                full_name="Inspector R. Vance",
                role="Investigator",
                badge_number="INV-CCTV-402",
                agency="Metropolitan Cybercrime Division",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(inv_user)
            logger.info("Default investigator account created: investigator / investigator123")

        db.commit()

        # 2. Seed initial sample case for immediate college demonstration if empty
        case_count = db.query(models.Case).count()
        if case_count == 0:
            sample_case = models.Case(
                id="TRX-CASE-2026-001",
                title="Operation Iron Perimeter — Sector 4 Surveillance Audit",
                description="Investigation into unauthorized perimeter access and physical alteration of security barrier at Terminal Gate B.",
                category="Physical Intrusion",
                status="Active",
                priority="High",
                investigator_id=inv_user.id,
                investigator_name=inv_user.full_name,
                notes="Initial CCTV footage requisitioned from North Gate DVR and Perimeter Cam 03. SHA-256 baseline hashing required.",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(sample_case)
            db.commit()

            # Add initial audit log
            audit_log = models.AuditLog(
                actor="System Initialization",
                action="SYSTEM_INIT",
                resource_type="SYSTEM",
                resource_id="TRX-PLATFORM",
                outcome="SUCCESS",
                timestamp=datetime.now(timezone.utc),
                details="TRACE X Forensic Engine initialized with baseline models and secure database schema."
            )
            db.add(audit_log)
            db.commit()
            logger.info("Sample demonstration case TRX-CASE-2026-001 created.")

    except Exception as e:
        logger.error(f"Error during database initialization/seeding: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("SQLAlchemy database schema verified.")
    # Seed
    seed_initial_data()
    yield
    logger.info("Shutting down TRACE X backend.")

# Also initialize immediately for synchronous runners/testclients
Base.metadata.create_all(bind=engine)
seed_initial_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "TRACE X is a secure AI-assisted digital evidence intelligence and forensic reconstruction platform. "
        "Engineered for authorized investigators analyzing multi-camera surveillance DVR/NVR video footage."
    ),
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(integrity.router, prefix="/api")
app.include_router(custody.router, prefix="/api")
app.include_router(processing.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(correlation.router, prefix="/api")
app.include_router(authenticity.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(users.router, prefix="/api")

# Global Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal forensic processing exception occurred. Please check audit logs."}
    )

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_prefix": "/api"
    }
