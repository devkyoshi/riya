from __future__ import annotations

import re

from extractors.base import BaseExtractor, FieldResult


# Common label→field mappings for insurance policies and service receipts
_LABEL_MAP: list[tuple[re.Pattern, str]] = [
    (re.compile(r"policy\s*(?:no\.?|number)", re.I), "policyNumber"),
    (re.compile(r"insured\s*name|name\s*of\s*insured", re.I), "insuredName"),
    (re.compile(r"vehicle\s*reg(?:istration)?", re.I), "plateNumber"),
    (re.compile(r"commencement\s*date|start\s*date|effective\s*date", re.I), "startDate"),
    (re.compile(r"expiry\s*date|valid\s*until|end\s*date", re.I), "expiresAt"),
    (re.compile(r"premium|total\s*(?:amount|premium)", re.I), "premiumLkr"),
    (re.compile(r"coverage\s*type|type\s*of\s*cover", re.I), "coverageType"),
    (re.compile(r"insurer|insurance\s*company|company\s*name", re.I), "provider"),
    # Service receipt labels
    (re.compile(r"service\s*date|date\s*of\s*service", re.I), "serviceDate"),
    (re.compile(r"mileage|odometer|km", re.I), "mileageKm"),
    (re.compile(r"total\s*cost|total\s*amount|amount\s*due", re.I), "totalCost"),
    (re.compile(r"description|service\s*description|work\s*done", re.I), "description"),
    (re.compile(r"garage|workshop|service\s*center", re.I), "garageName"),
]


class GenericExtractor(BaseExtractor):
    """
    Fallback extractor for documents without a fixed template
    (insurance policies, service receipts, purchase agreements).
    Uses keyword-label proximity matching on the raw OCR text.
    Confidence is intentionally lower (~0.5–0.75) to signal human review.
    """

    def _parse_fields(self, full_text: str, ocr_lines: list[dict]) -> FieldResult:
        result: FieldResult = {}

        # Always try to find a plate number
        plate = self._find_plate(full_text)
        if plate:
            result["plateNumber"] = self._field(plate[0], plate[1], regex_validated=True)

        # Scan each line for label anchors
        lines = [l["text"] for l in ocr_lines]
        for i, line in enumerate(lines):
            for pattern, field_key in _LABEL_MAP:
                if not pattern.search(line):
                    continue
                if field_key in result:
                    continue  # already found

                # Value is either on the same line (after colon/tab) or the next line
                inline = re.sub(r"^[^:：]+[:：]\s*", "", line).strip()
                if inline and inline != line.strip():
                    value = inline
                elif i + 1 < len(lines):
                    value = lines[i + 1].strip()
                else:
                    continue

                if not value:
                    continue

                # Refine dates and amounts
                if field_key in ("expiresAt", "startDate", "serviceDate"):
                    parsed = self._find_date(value)
                    if parsed:
                        result[field_key] = self._field(parsed[0], 0.70, regex_validated=True)
                    continue

                if field_key in ("premiumLkr", "totalCost", "mileageKm"):
                    num_m = re.search(r"[\d,]+(?:\.\d+)?", value)
                    if num_m:
                        clean = num_m.group(0).replace(",", "")
                        result[field_key] = self._field(clean, 0.65)
                    continue

                result[field_key] = self._field(value, 0.60)

        return result
