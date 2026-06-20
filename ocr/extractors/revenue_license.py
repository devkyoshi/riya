from __future__ import annotations

import re

from extractors.base import BaseExtractor, FieldResult


class RevenueLicenseExtractor(BaseExtractor):
    """
    Extracts fields from Sri Lankan Revenue License (issued by local councils).
    Key fields: plate number, owner name, expiry date, vehicle class, fee.
    Document uses a consistent A4 grid — keyword anchors are more robust than
    fixed pixel regions given the variance in phone-photo framing and resolution.
    """

    def _parse_fields(self, full_text: str, ocr_lines: list[dict]) -> FieldResult:
        result: FieldResult = {}

        # Plate / Registration number
        plate = self._find_plate(full_text)
        if plate:
            result["plateNumber"] = self._field(plate[0], plate[1], regex_validated=True)

        # Expiry date — look for "valid", "expiry", "expire" anchors
        expiry_anchors = ["valid until", "expiry date", "expire", "valid to", "validity"]
        expiry = None
        for anchor in expiry_anchors:
            expiry = self._find_date(full_text, anchor)
            if expiry:
                break
        if not expiry:
            # Fall back: last date-like string in the text
            expiry = self._find_date(full_text)
        if expiry:
            result["expiresAt"] = self._field(expiry[0], expiry[1], regex_validated=True)

        # Issue date
        issue = self._find_date(full_text, "issue") or self._find_date(full_text, "issued")
        if issue:
            result["issueDate"] = self._field(issue[0], issue[1], regex_validated=True)

        # Owner name — line after "owner" or "name of owner"
        owner_anchors = ["name of owner", "owner's name", "owner name", "owner:"]
        for anchor in owner_anchors:
            name = self._find_near(full_text, anchor)
            if name:
                result["ownerName"] = self._field(name[0], name[1])
                break

        # License / document number
        num_anchors = ["revenue license no", "license no", "license number", "reg. no", "registration no"]
        for anchor in num_anchors:
            num = self._find_near(full_text, anchor)
            if num:
                # Extract only the alphanumeric part
                clean = re.sub(r"[^A-Z0-9/-]", "", num[0].upper())
                if clean:
                    result["licenseNumber"] = self._field(clean, num[1])
                break

        # Fee amount
        fee_m = re.search(r"(?:fee|amount)[^\d]*(\d[\d,]+(?:\.\d{2})?)", full_text, re.IGNORECASE)
        if fee_m:
            fee_raw = fee_m.group(1).replace(",", "")
            result["feeAmountLkr"] = self._field(fee_raw, 0.70)

        # Vehicle class / type
        class_anchors = ["vehicle class", "class of vehicle", "type of vehicle"]
        for anchor in class_anchors:
            vc = self._find_near(full_text, anchor)
            if vc:
                result["vehicleClass"] = self._field(vc[0], vc[1])
                break

        return result
