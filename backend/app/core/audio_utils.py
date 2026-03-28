import numpy as np
import ffmpeg

def convert_pcm_to_float32(pcm_bytes: bytes, input_sample_rate: int = 16000) -> np.ndarray:
    """
    Convert raw PCM bytes (16-bit integer, mono) to normalized float32 numpy array.
    Used for transferring React Native LiveAudioStream data to faster-whisper.
    """
    # Convert directly if already 16kHz
    if input_sample_rate == 16000:
        return np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    
    # Otherwise use ffmpeg to resample
    try:
        out, _ = (
            ffmpeg
            .input('pipe:', format='s16le', acodec='pcm_s16le', ac=1, ar=str(input_sample_rate))
            .output('pipe:', format='s16le', acodec='pcm_s16le', ac=1, ar='16000')
            .run(input=pcm_bytes, capture_stdout=True, capture_stderr=True)
        )
        return np.frombuffer(out, dtype=np.int16).astype(np.float32) / 32768.0
    except ffmpeg.Error as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        raise e
