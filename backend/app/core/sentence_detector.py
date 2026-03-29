import re
import time
import logging

logger = logging.getLogger(__name__)

# Regex for sentence-ending punctuation (handles "...", "?!", etc.)
SENTENCE_END_RE = re.compile(r'[.!?]+\s*$')


class SentenceBoundaryDetector:
    """
    Accumulates STT partial text and detects sentence boundaries.

    A sentence is emitted when:
      1. Sentence-ending punctuation (., ?, !) is detected, OR
      2. A silence timeout occurs (no new text for `silence_timeout_s` seconds).
    """

    def __init__(self, silence_timeout_s: float = 1.3):
        self._buffer: str = ""
        self._last_text_time: float = time.monotonic()
        self.silence_timeout_s = silence_timeout_s

    def add_text(self, text: str) -> list[str]:
        """
        Feed new STT text into the detector.
        Returns a list of complete sentences (may be empty or contain multiple).
        """
        if not text:
            return []

        self._buffer += text
        self._last_text_time = time.monotonic()

        sentences: list[str] = []

        # Split on sentence-ending punctuation while keeping the delimiter
        parts = re.split(r'(?<=[.!?])\s+', self._buffer)

        if len(parts) > 1:
            # All parts except the last are complete sentences
            for part in parts[:-1]:
                sentence = part.strip()
                if sentence:
                    sentences.append(sentence)
                    logger.info(f"Sentence detected (punctuation): {sentence}")
            # Keep the remainder in the buffer
            self._buffer = parts[-1]
        elif SENTENCE_END_RE.search(self._buffer):
            # Buffer itself ends with punctuation
            sentence = self._buffer.strip()
            if sentence:
                sentences.append(sentence)
                logger.info(f"Sentence detected (punctuation): {sentence}")
            self._buffer = ""

        return sentences

    def check_silence_timeout(self) -> str | None:
        """
        Call periodically. If enough time has elapsed since the last text,
        flush the buffer as a complete sentence.
        Returns the flushed sentence or None.
        """
        if not self._buffer.strip():
            return None

        elapsed = time.monotonic() - self._last_text_time
        if elapsed >= self.silence_timeout_s:
            sentence = self._buffer.strip()
            self._buffer = ""
            logger.info(f"Sentence detected (silence timeout {elapsed:.1f}s): {sentence}")
            return sentence
        return None

    def flush(self) -> str | None:
        """Flush whatever remains in the buffer (e.g. on disconnect)."""
        if self._buffer.strip():
            sentence = self._buffer.strip()
            self._buffer = ""
            return sentence
        return None

    def reset(self):
        """Clear the buffer and reset timing."""
        self._buffer = ""
        self._last_text_time = time.monotonic()
