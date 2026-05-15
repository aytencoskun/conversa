"""
Async MongoDB client for session persistence.
Uses motor (async PyMongo wrapper) so it integrates seamlessly with FastAPI.
"""
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env from the backend directory (one level above app/)
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "conversa")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Call once at app startup."""
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # Ensure indexes for fast lookups
    await db.sessions.create_index("created_at")
    await db.sessions.create_index("user_id")
    # Users collection — unique email
    await db.users.create_index("email", unique=True)
    print(f"MongoDB connected → {MONGO_URL}/{DB_NAME}")


async def close_db():
    """Call once at app shutdown."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_sessions_collection():
    """Return the sessions collection handle."""
    return db["sessions"]


def get_users_collection():
    """Return the users collection handle."""
    return db["users"]
