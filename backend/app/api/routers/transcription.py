from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
from app.services.stt_service import stt_service
from app.core.audio_utils import convert_pcm_to_float32
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# Need 16000 Hz * 2 bytes * 1 channel * 2 seconds = 64000 bytes for 2 seconds of audio
BUFFER_SIZE_LIMIT = 64000  

@router.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    await websocket.accept()
    print("BACKEND: WebSocket connection established for transcription")
    
    audio_buffer = bytearray()
    
    try:
        while True:
            # Wait and receive binary data
            data = await websocket.receive_bytes()
            audio_buffer.extend(data)
            
            # Show progress in terminal so we know it's not frozen
            print(f"BACKEND: Received chunk ({len(data)} bytes). Buffer: {len(audio_buffer)}/{BUFFER_SIZE_LIMIT}")
            
            # Group into frames of length BUFFER_SIZE_LIMIT (e.g 2s)
            if len(audio_buffer) >= BUFFER_SIZE_LIMIT:
                chunk_bytes = bytes(audio_buffer)
                audio_buffer.clear()
                
                print(f"BACKEND: Processing {len(chunk_bytes)} bytes through STT...")
                
                try:
                    # Process audio formatting synchronously (very fast, no need for executor)
                    float_audio = convert_pcm_to_float32(chunk_bytes)
                    print(f"BACKEND: Converted to float32 array, length: {len(float_audio)}")
                    
                    # Offload transcription to a thread, otherwise it will block the FastAPI async loop!
                    loop = asyncio.get_running_loop()
                    text = await loop.run_in_executor(None, stt_service.transcribe_chunk, float_audio)
                    
                    if text:
                        print(f"TRANSCRIPT: {text}")
                        await websocket.send_text(text)
                    else:
                        print("BACKEND: STT returned empty (non-speech audio, VAD filtered)")
                except Exception as stt_error:
                    print(f"BACKEND: STT processing ERROR: {stt_error}")
            
    except WebSocketDisconnect:
        print("BACKEND: WebSocket disconnected")
        # Final pass for trailing data buffer
        if len(audio_buffer) > 0:
            float_audio = convert_pcm_to_float32(bytes(audio_buffer))
            text = stt_service.transcribe_chunk(float_audio)
            if text:
                print(f"TRANSCRIPT (FINAL): {text}")
    except Exception as e:
        print(f"BACKEND: WebSocket error: {e}")

