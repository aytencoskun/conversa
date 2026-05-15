from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json
import asyncio
import time
from datetime import datetime, timezone
from app.services.stt_service import stt_service
from app.core.audio_utils import convert_pcm_to_float32
from app.core.sentence_detector import SentenceBoundaryDetector
from app.services.translation import get_translation_adapter
from app.core.translation_cache import translation_cache
from app.services.summarization_manager import SummarizationManager
from app.core.database import get_sessions_collection
from app.core.security import decode_access_token

router = APIRouter()
logger = logging.getLogger(__name__)

# Need 16000 Hz * 2 bytes * 1 channel * 2 seconds = 64000 bytes for 2 seconds of audio
BUFFER_SIZE_LIMIT = 64000

# How often to poll the silence timeout (seconds)
SILENCE_CHECK_INTERVAL = 0.3


def remove_overlap(previous_text: str, new_text: str) -> str:
    """Removes overlapping words from the start of new_text based on previous_text."""
    if not previous_text or not new_text:
        return new_text
        
    prev_words = previous_text.strip().split()
    new_words = new_text.strip().split()
    
    max_overlap = 0
    max_possible = min(len(prev_words), len(new_words))
    for i in range(1, max_possible + 1):
        pw = [w.lower().strip('.,!?') for w in prev_words[-i:]]
        nw = [w.lower().strip('.,!?') for w in new_words[:i]]
        if pw == nw:
            max_overlap = i
            
    if max_overlap > 0:
        return " ".join(new_words[max_overlap:])
    return new_text.strip()

# Next in the file: Look at the while loop inside transcribe_websocket
@router.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    await websocket.accept()
    print("BACKEND: WebSocket connection established for transcription")

    audio_buffer = bytearray()
    sentence_detector = SentenceBoundaryDetector(silence_timeout_s=1.3)
    previous_text = ""
    OVERLAP_BYTES = 16000 # 0.5s of 16kHz 16-bit mono

    # Translation config — defaults; can be overridden via first JSON message
    target_lang = "TR"
    source_lang = "EN"
    translation_provider = "libre"
    translation_enabled = True

    # ── Auth — extract user_id from Authorization header if present ──
    user_id: str | None = None
    auth_header = websocket.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            payload = decode_access_token(auth_header[7:])
            user_id = payload.get("sub")
        except Exception:
            pass  # Anonymous session — still allowed

    summarization_manager = SummarizationManager(provider="mistral", target_lang=target_lang)

    # ── Session tracking state ──
    session_start_time = time.time()
    transcript_segments: list[dict] = []    # {id, text, timestamp}
    translation_segments: list[dict] = []   # {id, original, translated, timestamp}
    segment_counter = 0

    async def run_intermediate_summarization():
        try:
            summary_text = await summarization_manager.trigger_intermediate_summary()
            if summary_text:
                await websocket.send_text(json.dumps({
                    "type": "summary",
                    "text": summary_text
                }))
        except Exception as e:
            print(f"BACKEND: Summarization error: {e}")

    async def translate_and_send(sentence: str):
        """Translate a complete sentence and send via WebSocket."""
        nonlocal segment_counter
        segment_counter += 1
        seg_id = f"seg-{segment_counter}"
        elapsed = round(time.time() - session_start_time, 2)

        # Track transcript segment
        transcript_segments.append({
            "id": seg_id,
            "text": sentence,
            "timestamp": elapsed,
        })

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
                # Still track with error
                translation_segments.append({
                    "id": seg_id,
                    "original": sentence,
                    "translated": f"[Translation Error]",
                    "timestamp": elapsed,
                })
                return

        # Track translation segment
        translation_segments.append({
            "id": seg_id,
            "original": sentence,
            "translated": translated,
            "timestamp": elapsed,
        })

        # Send to UI
        await websocket.send_text(json.dumps({
            "type": "translation",
            "original": sentence,
            "translated": translated,
            "is_final": False,
        }))

        # Trigger Summarization Logic
        summarization_manager.add_sentence(sentence)
        if summarization_manager.should_trigger_intermediate():
            asyncio.create_task(run_intermediate_summarization())

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
                        summarization_manager.target_lang = target_lang
                        
                        if config.get("reset_session", False):
                            summarization_manager.reset()
                            previous_text = ""
                            sentence_detector.flush()
                            transcript_segments.clear()
                            translation_segments.clear()
                            segment_counter = 0
                            session_start_time = time.time()
                            print("BACKEND: Session state reset via config")
                        
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
                chunk_bytes = bytes(audio_buffer[:BUFFER_SIZE_LIMIT])
                # Keep the last OVERLAP_BYTES for the next chunk
                audio_buffer = audio_buffer[BUFFER_SIZE_LIMIT - OVERLAP_BYTES:]

                print(f"BACKEND: Processing {len(chunk_bytes)} bytes through STT...")

                try:
                    float_audio = convert_pcm_to_float32(chunk_bytes)
                    
                    loop = asyncio.get_running_loop()
                    # Pass previous_text as initial_prompt to help Whisper keep the context
                    text = await loop.run_in_executor(None, stt_service.transcribe_chunk, float_audio, previous_text, source_lang.lower())

                    if text:
                        import re
                        # Clean up "..." and ".."
                        text = re.sub(r'\.{2,}', ' ', text).strip()
                        if text == '.': text = ''
                        text = " ".join(text.split())

                    if text:
                        print(f"TRANSCRIPT RAW: {text}")
                        clean_text = remove_overlap(previous_text, text)
                        
                        # Keep the last 15 words for the next context window
                        previous_text = " ".join(text.strip().split()[-15:])
                        
                        if clean_text:
                            print(f"TRANSCRIPT (CLEANED): {clean_text}")
                            await websocket.send_text(json.dumps({
                                "type": "partial_transcript",
                                "text": clean_text,
                                "is_final": False,
                            }))

                            # Feed clean text to sentence detector
                            sentences = sentence_detector.add_text(" " + clean_text)
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
                text = await loop.run_in_executor(None, stt_service.transcribe_chunk, float_audio, None, source_lang.lower())
                
                if text:
                    import re
                    text = re.sub(r'\.{2,}', ' ', text).strip()
                    if text == '.': text = ''
                    text = " ".join(text.split())

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

        # Generate final AI summary and persist the session to MongoDB
        async def final_summary_and_save():
            try:
                final_json = await summarization_manager.trigger_final_summary()
                print("\n" + "="*50)
                print("🚀 FINAL MEETING SUMMARY:")
                print(json.dumps(final_json, indent=2, ensure_ascii=False))
                print("="*50 + "\n")

                # Send full summary to the client if still reachable
                try:
                    await websocket.send_text(json.dumps({
                        "type": "final_summary",
                        "summary": final_json,
                    }))
                except Exception:
                    pass  # Client may have already disconnected

                # ── Persist to MongoDB ──
                session_duration = round(time.time() - session_start_time, 2)
                session_doc = {
                    "title": f"Meeting {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "duration": session_duration,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "status": "completed",
                    "transcript": transcript_segments,
                    "translation": translation_segments,
                    "summary": final_json,
                    "intermediate_summaries": summarization_manager.intermediate_summaries,
                    "user_id": user_id,  # None if unauthenticated
                }
                try:
                    col = get_sessions_collection()
                    result = await col.insert_one(session_doc)
                    print(f"✅ Session saved to MongoDB → _id: {result.inserted_id}")
                except Exception as db_err:
                    print(f"❌ MongoDB save failed: {db_err}")

            except Exception as e:
                print(f"BACKEND: Final summary error: {e}")
        
        asyncio.create_task(final_summary_and_save())

    except Exception as e:
        silence_task.cancel()
        print(f"BACKEND: WebSocket error: {e}")

