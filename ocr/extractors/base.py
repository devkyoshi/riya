from __future__ import annotations

import io
import re
from abc import ABC, abstractmethod
from typing import Any

import fitz  # PyMuPDF
import numpy as np
from PIL import Image

from preprocessing import pil_to_cv2, preprocess_image


# Lazy-load PaddleOCR so tests can mock it before import
_paddle_ocr = None


def _get_ocr():
    global _paddle_ocr
    if _paddle_ocr is None:
        from paddleocr import PaddleOCR
        _paddle_ocr = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=False, show_log=False)
    return _paddle_ocr


FieldResult = dict[str, dict[str, Any]]  # {field: {value, confidence}}


class BaseExtractor(ABC):
    """Load, preprocess, OCR, then delegate to subclass for field parsing."""

    def extract(self, file_bytes: bytes, mime_type: str) -> FieldResult:
        img = self._load_image(file_bytes, mime_type)
        cv2_img = pil_to_cv2(img)
        processed = preprocess_image(cv2_img)
        ocr_lines = self._run_ocr(processed)
        full_text = "\n".join(line["text"] for line in ocr_lines)
        return self._parse_fields(full_text, ocr_lines)

    @abstractmethod
    def _parse_fields(self, full_text: str, ocr_lines: list[dict]) -> FieldResult:
        """Extract structured fields from raw OCR text."""

    # ------------------------------------------------------------------ helpers

    def _load_image(self, file_bytes: bytes, mime_type: str) -> Image.Image:
        if mime_type == "application/pdf" or file_bytes[:4] == b"%PDF":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page = doc[0]
            pix = page.get_pixmap(dpi=200)
            return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return Image.open(io.BytesIO(file_bytes)).convert("RGB")

    def _run_ocr(self, img: np.ndarray) -> list[dict]:
        """Return list of {text, confidence, bbox} dicts from PaddleOCR."""
        result = _get_ocr().ocr(img, cls=True)
        lines = []
        if not result or not result[0]:
            return lines
        for item in result[0]:
            bbox, (text, conf) = item
            lines.append({"text": text.strip(), "confidence": float(conf), "bbox": bbox})
        return lines

    # ------------------------------------------------------------------ regex utils

    @staticmethod
    def _find_plate(text: str) -> tuple[str, float] | None:
        """Match Sri Lankan plate formats: CAB-1234, 35-1234, WP CAB-1234 etc."""
        patterns = [
            r"\b([A-Z]{2,3}[-\s]?\d{4})\b",
            r"\b(\d{2}[-\s]?\d{4})\b",
            r"\b([A-Z]{2}\s\d{4})\b",
        ]
        for pat in patterns:
            m = re.search(pat, text)
            if m:
                return m.group(1).replace(" ", "-"), 0.90
        return None

    @staticmethod
    def _find_date(text: str, anchor: str | None = None) -> tuple[str, float] | None:
        """Find the first ISO-normalizable date near an optional anchor keyword."""
        search_area = text
        if anchor:
            idx = text.lower().find(anchor.lower())
            if idx >= 0:
                search_area = text[idx: idx + 120]

        patterns = [
            (r"\b(\d{4}[-/]\d{2}[-/]\d{2})\b", "%Y-%m-%d"),
            (r"\b(\d{2}[-/]\d{2}[-/]\d{4})\b", "%d-%m-%Y"),
            (r"\b(\d{2}\.\d{2}\.\d{4})\b", "%d.%m.%Y"),
        ]
        import datetime
        for pat, fmt in patterns:
            m = re.search(pat, search_area)
            if m:
                raw = m.group(1).replace("/", "-").replace(".", "-")
                try:
                    dt = datetime.datetime.strptime(raw, fmt)
                    return dt.strftime("%Y-%m-%d"), 0.88
                except ValueError:
                    continue
        return None

    @staticmethod
    def _find_near(text: str, keyword: str, max_chars: int = 80) -> tuple[str, float] | None:
        """Return the text immediately following a keyword anchor."""
        idx = text.lower().find(keyword.lower())
        if idx < 0:
            return None
        snippet = text[idx + len(keyword): idx + len(keyword) + max_chars].strip()
        # Take up to end of first line
        first_line = snippet.split("\n")[0].strip().rstrip(":").strip()
        if first_line:
            return first_line, 0.75
        return None

    @staticmethod
    def _field(value: str | None, conf: float, regex_validated: bool = False) -> dict:
        effective = min(conf + (0.08 if regex_validated else 0), 1.0)
        return {"value": value, "confidence": round(effective, 3)}
