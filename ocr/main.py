from __future__ import annotations

import logging

import uvicorn
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import settings
from worker import process_ocr_job

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(title="Riya OCR Service", version="1.0.0")


class OcrJobRequest(BaseModel):
    documentId: str
    documentType: str
    fileUrl: str
    callbackUrl: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ocr/jobs", status_code=202)
async def enqueue_ocr_job(job: OcrJobRequest, background_tasks: BackgroundTasks):
    """Accept an OCR job and process it in the background. Returns 202 immediately."""
    background_tasks.add_task(process_ocr_job, job.model_dump())
    return {"accepted": True, "documentId": job.documentId}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": str(exc)})


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=False)
