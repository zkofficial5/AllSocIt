from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.universes import router as universes_router
from app.api.tweaknow import router as tweaknow_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AllSocIt API",
    description="Digital Storyteller's Toolkit API",
    version="1.0.0"
)

# CORS middleware (allows React Native to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(universes_router, prefix="/universes", tags=["Universes"])
app.include_router(tweaknow_router, prefix="/tweaknow", tags=["TweakNow"])

@app.get("/")
def root():
    return {"message": "Welcome to AllSocIt API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}