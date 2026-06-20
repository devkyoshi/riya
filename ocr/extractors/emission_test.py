from __future__ import annotations

import re

from extractors.base import BaseExtractor, FieldResult


class EmissionTestExtractor(BaseExtractor):
    """
    Extracts fields from Sri Lankan Emission Test Certificates.
    Issued by NTES-approved test centers. Key fields: plate, test date, expiry, result, test center.
    """

    def _parse_fields(self, full_text: str, ocr_lines: list[dict]) -> FieldResult:
        result: FieldResult = {}

        # Plate number
        plate = self._find_plate(full_text)
        if plate:
            result["plateNumber"] = self._field(plate[0], plate[1], regex_validated=True)

        # Test result — look for PASS / FAIL / CONDITIONAL
        result_m = re.search(r"\b(PASS(?:ED)?|FAIL(?:ED)?|CONDITIONAL)\b", full_text, re.IGNORECASE)
        if result_m:
            raw = result_m.group(1).lower()
            normalized = "pass" if raw.startswith("pass") else ("fail" if raw.startswith("fail") else "conditional")
            result["result"] = self._field(normalized, 0.92, regex_validated=True)

        # Test date
        test_date = self._find_date(full_text, "test date") or self._find_date(full_text, "tested on")
        if test_date:
            result["testDate"] = self._field(test_date[0], test_date[1], regex_validated=True)

        # Expiry date
        expiry = (
            self._find_date(full_text, "valid until")
            or self._find_date(full_text, "expiry")
            or self._find_date(full_text, "valid to")
        )
        if expiry:
            result["expiresAt"] = self._field(expiry[0], expiry[1], regex_validated=True)

        # Test center
        center_anchors = ["test centre", "test center", "station", "testing centre"]
        for anchor in center_anchors:
            center = self._find_near(full_text, anchor)
            if center:
                result["testCenter"] = self._field(center[0], center[1])
                break

        # CO / HC readings (emission values)
        co_m = re.search(r"CO[:\s]*(\d+\.?\d*)\s*%?", full_text, re.IGNORECASE)
        hc_m = re.search(r"HC[:\s]*(\d+\.?\d*)\s*(?:ppm)?", full_text, re.IGNORECASE)
        if co_m or hc_m:
            readings: dict = {}
            if co_m:
                readings["co"] = co_m.group(1)
            if hc_m:
                readings["hc"] = hc_m.group(1)
            result["readings"] = self._field(str(readings), 0.72)

        return result
