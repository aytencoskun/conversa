from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.core.database import get_sessions_collection
from app.core.security import get_optional_user

router = APIRouter()


def _serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict (ObjectId -> str)."""
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/session/list")
async def list_sessions(current_user: dict | None = Depends(get_optional_user)):
    """Return sessions for the authenticated user, most recent first."""
    col = get_sessions_collection()

    query = {}
    if current_user:
        query["user_id"] = current_user["sub"]

    cursor = col.find(
        query,
        {
            "title": 1,
            "created_at": 1,
            "duration": 1,
            "status": 1,
            "source_lang": 1,
            "target_lang": 1,
        },
    ).sort("created_at", -1)

    sessions = []
    async for doc in cursor:
        sessions.append(_serialize_doc(doc))
    return sessions


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Return full session details including transcript, translation and summary."""
    col = get_sessions_collection()
    try:
        doc = await col.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    return _serialize_doc(doc)


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session by ID."""
    col = get_sessions_collection()
    try:
        result = await col.delete_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "deleted", "session_id": session_id}


@router.patch("/session/{session_id}/title")
async def update_session_title(session_id: str, title: str):
    """Update just the title of a session."""
    col = get_sessions_collection()
    try:
        result = await col.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"title": title}},
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "updated", "session_id": session_id}
