from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    await websocket.accept()
    print("BACKEND: WebSocket connection established for transcription")
    
    try:
        while True:
            # Receive any data (text or binary)
            print("BACKEND: Waiting for data...")
            message = await websocket.receive()
            
            if "bytes" in message:
                data = message["bytes"]
                print(f"BACKEND: Server received BINARY: {len(data)} bytes")
            elif "text" in message:
                data = message["text"]
                print(f"BACKEND: Server received TEXT: {data[:50]}...")
            else:
                 print(f"BACKEND: Server received UNKNOWN message type: {message.keys()}")

            # For now, just acknowledge receipt
            await websocket.send_text("Ack")
            
    except WebSocketDisconnect:
        print("BACKEND: WebSocket disconnected")
    except Exception as e:
        print(f"BACKEND: WebSocket error: {e}")
