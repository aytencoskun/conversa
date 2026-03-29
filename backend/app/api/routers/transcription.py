from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio
from app.services.stt_service import stt_service
from app.core.audio_utils import convert_pcm_to_float32
from app.core.sentence_detector import SentenceBoundaryDetector
from app.services.translation import get_translation_adapter
from app.core.translation_cache import translation_cache

router = APIRouter()
logger = logging.getLogger(__name__)

# Need 16000 Hz * 2 bytes * 1 channel * 2 seconds = 64000 bytes for 2 seconds of audio
BUFFER_SIZE_LIMIT = 64000

# How often to poll the silence timeout (seconds)
SILENCE_CHECK_INTERVAL = 0.3


@router.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    await websocket.accept()
    print("BACKEND: WebSocket connection established for transcription")

    audio_buffer = bytearray()
    sentence_detector = SentenceBoundaryDetector(silence_timeout_s=1.3)

    # Translation config — defaults; can be overridden via first JSON message
    target_lang = "TR"
    source_lang = "EN"
    translation_provider = "libre"
    translation_enabled = True

    async def translate_and_send(sentence: str):
        """Translate a complete sentence and send via WebSocket."""
        if not translation_enabled:
            return
        
        # Check cache first
        cached = translation_cache.get(sentence, source_lang, target_lang, translation_provider)
        if cached:
            translated = cached
            print(f"TRANSLATION (CACHE HIT): '{sentence}' -> '{translated}'")
        else:
            try:
                adapter = get_translation_adapter(translation_provider)
                translated = await adapter.translate(sentence, source_lang, target_lang)
                translation_cache.put(sentence, source_lang, target_lang, translation_provider, translated)
                print(f"TRANSLATION: '{sentence}' -> '{translated}'")
            except Exception as e:
                err_msg = str(e).split('For more information')[0].strip()
                print(f"BACKEND: Translation error: {err_msg}")
                # Send the original with an error flag so UI can still display it
                await websocket.send_text(json.dumps({
                    "type": "translation",
                    "original": sentence,
                    "translated": f"⚠️ Çeviri hatası ({translation_provider})",
                    "is_final": False,
                }))
                return

        # Send to UI
        await websocket.send_text(json.dumps({
            "type": "translation",
            "original": sentence,
            "translated": translated,
            "is_final": False,
        }))

    async def silence_checker():
        """Background task: periodically check for silence-based sentence boundaries."""
        try:
            while True:
                await asyncio.sleep(SILENCE_CHECK_INTERVAL)
                sentence = sentence_detector.check_silence_timeout()
                if sentence:
                    await translate_and_send(sentence)
        except asyncio.CancelledError:
            pass

    # Start the silence checker background task
    silence_task = asyncio.create_task(silence_checker())

    try:
        while True:
            data = await websocket.receive()

            # Handle initial config message (JSON text)
            if "text" in data:
                try:
                    config = json.loads(data["text"])
                    if config.get("type") == "config":
                        target_lang = config.get("target_lang", target_lang)
                        source_lang = config.get("source_lang", source_lang)
                        translation_provider = config.get("provider", translation_provider)
                        translation_enabled = config.get("translation_enabled", translation_enabled)
                        print(f"BACKEND: Config updated — {source_lang}->{target_lang} via {translation_provider}")
                        continue
                except (json.JSONDecodeError, KeyError):
                    pass
                continue

            # Handle binary audio data
            if "bytes" not in data:
                continue

            audio_data = data["bytes"]
            audio_buffer.extend(audio_data)

            # Show progress
            print(f"BACKEND: Received chunk ({len(audio_data)} bytes). Buffer: {len(audio_buffer)}/{BUFFER_SIZE_LIMIT}")

            # Group into frames of BUFFER_SIZE_LIMIT (e.g. 2s)
            if len(audio_buffer) >= BUFFER_SIZE_LIMIT:
                chunk_bytes = bytes(audio_buffer)
                audio_buffer.clear()

                print(f"BACKEND: Processing {len(chunk_bytes)} bytes through STT...")

                try:
                    float_audio = convert_pcm_to_float32(chunk_bytes)
                    print(f"BACKEND: Converted to float32 array, length: {len(float_audio)}")

                    loop = asyncio.get_running_loop()
                    text = await loop.run_in_executor(None, stt_service.transcribe_chunk, float_audio)

                    if text:
                        print(f"TRANSCRIPT: {text}")
                        await websocket.send_text(json.dumps({
                            "type": "partial_transcript",
                            "text": text,
                            "is_final": False,
                        }))

                        # Feed text to sentence detector
                        sentences = sentence_detector.add_text(" " + text)
                        for sentence in sentences:
                            await translate_and_send(sentence)
                    else:
                        print("BACKEND: STT returned empty (non-speech audio, VAD filtered)")
                except Exception as stt_error:
                    print(f"BACKEND: STT processing ERROR: {stt_error}")

    except WebSocketDisconnect:
        print("BACKEND: WebSocket disconnected")
        silence_task.cancel()

        # Final pass — flush remaining audio buffer
        if len(audio_buffer) > 0:
            try:
                float_audio = convert_pcm_to_float32(bytes(audio_buffer))
                loop = asyncio.get_running_loop()
                text = await loop.run_in_executor(None, stt_service.transcribe_chunk, float_audio)
                if text:
                    print(f"TRANSCRIPT (FINAL): {text}")
                    sentence_detector.add_text(" " + text)
                    await websocket.send_text(json.dumps({
                        "type": "partial_transcript",
                        "text": text,
                        "is_final": True,
                    }))
            except Exception as e:
                print(f"BACKEND: Final buffer processing error: {e}")

        # Flush sentence detector
        remaining = sentence_detector.flush()
        if remaining:
            await translate_and_send(remaining)

    except Exception as e:
        silence_task.cancel()
        print(f"BACKEND: WebSocket error: {e}")
