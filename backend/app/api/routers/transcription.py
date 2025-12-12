from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established for transcription")
    
    try:
        while True:
            # Receive binary audio data
            data = await websocket.receive_bytes()
            
            # TODO: Process audio data (STT, Translation)
            # For now, just acknowledge receipt
            await websocket.send_text(f"Received {len(data)} bytes")
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
