from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="Conversa Backend", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.routers import health, transcription, translation, summarization, session, auth

app.include_router(health.router)
app.include_router(transcription.router)
app.include_router(translation.router)
app.include_router(summarization.router)
app.include_router(session.router)
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Conversa Backend is running"}

