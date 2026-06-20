from __future__ import annotations

import logging
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)


def _pick_extractor(document_type: str):
    """Return the right extractor instance for the given document type."""
    from extractors.revenue_license import RevenueLicenseExtractor
    from extractors.registration_cert import RegistrationCertExtractor
    from extractors.emission_test import EmissionTestExtractor
    from extractors.generic import GenericExtractor

    mapping = {
        "revenue_license": RevenueLicenseExtractor,
        "registration_certificate": RegistrationCertExtractor,
        "emission_test": EmissionTestExtractor,
    }
    cls = mapping.get(document_type, GenericExtractor)
    return cls()


async def process_ocr_job(job: dict[str, Any]) -> None:
    document_id: str = job["documentId"]
    document_type: str = job["documentType"]
    file_url: str = job["fileUrl"]
    callback_url: str = job["callbackUrl"]

    logger.info("OCR job started: %s (%s)", document_id, document_type)

    # Notify backend that processing has started
    await _callback(callback_url, {
        "ocrStatus": "processing",
        "extractedFields": None,
    })

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(file_url)
            resp.raise_for_status()
            file_bytes = resp.content
            mime_type = resp.headers.get("content-type", "application/octet-stream")

        extractor = _pick_extractor(document_type)
        fields = extractor.extract(file_bytes, mime_type)

        if fields:
            status = "completed"
            logger.info("OCR completed for %s: %d fields", document_id, len(fields))
        else:
            status = "failed"
            logger.warning("OCR produced no fields for %s", document_id)

        await _callback(callback_url, {"ocrStatus": status, "extractedFields": fields or None})

    except Exception as exc:
        logger.error("OCR job failed for %s: %s", document_id, exc, exc_info=True)
        await _callback(callback_url, {"ocrStatus": "failed", "extractedFields": None})


async def _callback(url: str, payload: dict) -> None:
    headers = {"x-internal-secret": settings.internal_secret, "content-type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(url, json=payload, headers=headers)
    except Exception as exc:
        logger.error("Callback failed to %s: %s", url, exc)
