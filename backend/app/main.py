from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Conversa Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.routers import health, transcription, translation, summarization, session

app.include_router(health.router)
app.include_router(transcription.router)
app.include_router(translation.router)
app.include_router(summarization.router)
app.include_router(session.router)

@app.get("/")
async def root():
    return {"message": "Conversa Backend is running"}
