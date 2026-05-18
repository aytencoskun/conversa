from faster_whisper import WhisperModel
import numpy as np
import logging

logger = logging.getLogger(__name__)

class STTService:
    def __init__(self, model_size="small", device="cpu", compute_type="int8"):
        logger.info(f"Loading faster-whisper model '{model_size}' on {device}...")
        # compute_type int8 provides a major speed default for CPU inference. 
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        logger.info("Model loaded successfully.")

    def transcribe_chunk(self, audio_chunk: np.ndarray, initial_prompt: str = None, language: str = None) -> str:
        """
        Transcribes a float32 16kHz mono audio chunk.
        """
        if len(audio_chunk) == 0:
            return ""
            
        # VAD filter prevents hallucinations on pure silence / background noise
        segments, info = self.model.transcribe(
            audio_chunk, 
            beam_size=1, 
            vad_filter=False,
            initial_prompt=initial_prompt,
            language=language
        )
        
        text = " ".join([segment.text for segment in segments])
        return text.strip()

# Create a singleton instance to be used across the application
stt_service = STTService()
