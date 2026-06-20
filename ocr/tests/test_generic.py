"""Unit tests for the Generic extractor (insurance policies, service receipts)."""
from unittest.mock import MagicMock
import sys
import types

import pytest


INSURANCE_OCR_LINES = [
    {"text": "INSURANCE POLICY", "confidence": 0.99, "bbox": []},
    {"text": "Policy No: INS-2024-789012", "confidence": 0.95, "bbox": []},
    {"text": "Insurer: Lanka Insurance Company", "confidence": 0.93, "bbox": []},
    {"text": "Vehicle Reg: WP ABC-5678", "confidence": 0.94, "bbox": []},
    {"text": "Commencement Date: 2024-01-01", "confidence": 0.92, "bbox": []},
    {"text": "Expiry Date: 2024-12-31", "confidence": 0.91, "bbox": []},
    {"text": "Total Premium: 45,000.00", "confidence": 0.90, "bbox": []},
    {"text": "Coverage Type: Comprehensive", "confidence": 0.89, "bbox": []},
]


@pytest.fixture(autouse=True)
def patch_ocr_and_image(monkeypatch):
    paddle_mod = types.ModuleType("paddleocr")
    paddle_mod.PaddleOCR = MagicMock()
    sys.modules.setdefault("paddleocr", paddle_mod)

    import extractors.base as base_mod
    monkeypatch.setattr(base_mod.BaseExtractor, "_run_ocr", lambda self, img: INSURANCE_OCR_LINES)
    from PIL import Image
    monkeypatch.setattr(base_mod.BaseExtractor, "_load_image", lambda self, b, m: Image.new("RGB", (800, 1200)))


def test_policy_number_found():
    from extractors.generic import GenericExtractor
    result = GenericExtractor().extract(b"dummy", "image/jpeg")
    assert "policyNumber" in result
    assert "INS-2024-789012" in result["policyNumber"]["value"]


def test_plate_found():
    from extractors.generic import GenericExtractor
    result = GenericExtractor().extract(b"dummy", "image/jpeg")
    assert "plateNumber" in result


def test_expiry_date_parsed():
    from extractors.generic import GenericExtractor
    result = GenericExtractor().extract(b"dummy", "image/jpeg")
    assert "expiresAt" in result
    assert result["expiresAt"]["value"] == "2024-12-31"


def test_premium_extracted():
    from extractors.generic import GenericExtractor
    result = GenericExtractor().extract(b"dummy", "image/jpeg")
    assert "premiumLkr" in result
    assert result["premiumLkr"]["value"] == "45000.00"


def test_coverage_type_extracted():
    from extractors.generic import GenericExtractor
    result = GenericExtractor().extract(b"dummy", "image/jpeg")
    assert "coverageType" in result
    assert "Comprehensive" in result["coverageType"]["value"]


def test_generic_confidence_lower_than_template():
    """Generic extractor should produce lower confidence than template extractors."""
    from extractors.generic import GenericExtractor
    result = GenericExtractor().extract(b"dummy", "image/jpeg")
    non_plate_fields = {k: v for k, v in result.items() if k != "plateNumber"}
    avg_conf = sum(v["confidence"] for v in non_plate_fields.values()) / max(len(non_plate_fields), 1)
    assert avg_conf <= 0.80
