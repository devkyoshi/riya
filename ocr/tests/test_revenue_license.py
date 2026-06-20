"""Unit tests for the Revenue License extractor using mocked PaddleOCR output."""
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

# Mock PaddleOCR before any import that triggers it
MOCK_OCR_LINES = [
    {"text": "REVENUE LICENSE", "confidence": 0.99, "bbox": []},
    {"text": "License No: RL-2024-001234", "confidence": 0.95, "bbox": []},
    {"text": "Registration No: CAB-4321", "confidence": 0.96, "bbox": []},
    {"text": "Name of Owner: K.P. Perera", "confidence": 0.94, "bbox": []},
    {"text": "Valid Until: 2025-09-30", "confidence": 0.93, "bbox": []},
    {"text": "Issue Date: 2024-10-01", "confidence": 0.92, "bbox": []},
    {"text": "Vehicle Class: Motor Car", "confidence": 0.91, "bbox": []},
    {"text": "Fee Amount: LKR 5,000.00", "confidence": 0.90, "bbox": []},
]


@pytest.fixture(autouse=True)
def patch_ocr_and_image(monkeypatch):
    """Patch PaddleOCR and image loading so tests run without GPU/models."""
    import sys
    import types

    # Stub paddleocr module
    paddle_mod = types.ModuleType("paddleocr")
    paddle_mod.PaddleOCR = MagicMock()
    sys.modules.setdefault("paddleocr", paddle_mod)

    import importlib
    import extractors.base as base_mod

    # Patch _run_ocr to return our fixture lines
    monkeypatch.setattr(base_mod.BaseExtractor, "_run_ocr", lambda self, img: MOCK_OCR_LINES)
    # Patch _load_image to return a dummy PIL image
    from PIL import Image
    monkeypatch.setattr(base_mod.BaseExtractor, "_load_image", lambda self, b, m: Image.new("RGB", (800, 1200)))


def test_plate_extracted():
    from extractors.revenue_license import RevenueLicenseExtractor
    result = RevenueLicenseExtractor().extract(b"dummy", "image/jpeg")
    assert "plateNumber" in result
    assert result["plateNumber"]["value"] == "CAB-4321"
    assert result["plateNumber"]["confidence"] >= 0.90


def test_expiry_extracted():
    from extractors.revenue_license import RevenueLicenseExtractor
    result = RevenueLicenseExtractor().extract(b"dummy", "image/jpeg")
    assert "expiresAt" in result
    assert result["expiresAt"]["value"] == "2025-09-30"


def test_owner_name_extracted():
    from extractors.revenue_license import RevenueLicenseExtractor
    result = RevenueLicenseExtractor().extract(b"dummy", "image/jpeg")
    assert "ownerName" in result
    assert "Perera" in result["ownerName"]["value"]


def test_license_number_extracted():
    from extractors.revenue_license import RevenueLicenseExtractor
    result = RevenueLicenseExtractor().extract(b"dummy", "image/jpeg")
    assert "licenseNumber" in result


def test_confidence_within_range():
    from extractors.revenue_license import RevenueLicenseExtractor
    result = RevenueLicenseExtractor().extract(b"dummy", "image/jpeg")
    for field, data in result.items():
        assert 0.0 <= data["confidence"] <= 1.0, f"{field} confidence out of range"
