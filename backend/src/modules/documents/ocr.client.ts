import { config } from '@/config.js'

interface OcrJobPayload {
  id: string
  documentType: string
  fileUrl: string
}

const OCR_ELIGIBLE_TYPES = new Set([
  'revenue_license',
  'registration_certificate',
  'emission_test',
  'insurance_policy',
  'service_receipt',
])

export function isOcrEligible(documentType: string): boolean {
  return OCR_ELIGIBLE_TYPES.has(documentType)
}

export function dispatchOcrJob(doc: OcrJobPayload): void {
  const backendBase = `http://localhost:3001`

  const jobPayload = {
    documentId: doc.id,
    documentType: doc.documentType,
    fileUrl: `${backendBase}${doc.fileUrl}`,
    callbackUrl: `${backendBase}/v1/internal/documents/${doc.id}/ocr-result`,
  }

  fetch(`${config.OCR_SERVICE_URL}/ocr/jobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(jobPayload),
  }).catch((err) => {
    // OCR service being unavailable must never fail the upload
    console.warn('[ocr] dispatch failed (OCR service may be down):', err?.message)
  })
}
