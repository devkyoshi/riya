from __future__ import annotations

import re

from extractors.base import BaseExtractor, FieldResult


class RegistrationCertExtractor(BaseExtractor):
    """
    Extracts fields from the Sri Lankan Vehicle Registration Certificate (CR Book / Blue Book).
    Issued by Dept. of Motor Traffic (DMT). Key fields: plate, chassis, engine,
    make, model, year, owner name/address.
    """

    def _parse_fields(self, full_text: str, ocr_lines: list[dict]) -> FieldResult:
        result: FieldResult = {}

        # Registration / plate number
        plate = self._find_plate(full_text)
        if plate:
            result["plateNumber"] = self._field(plate[0], plate[1], regex_validated=True)

        # Chassis number — 17-char VIN or shorter local format
        chassis_m = re.search(
            r"(?:chassis|frame)\s*(?:no\.?|number)[:\s]*([A-Z0-9]{6,17})",
            full_text, re.IGNORECASE
        )
        if chassis_m:
            result["chassisNumber"] = self._field(chassis_m.group(1), 0.85, regex_validated=True)

        # Engine number
        engine_m = re.search(
            r"engine\s*(?:no\.?|number)[:\s]*([A-Z0-9]{4,20})",
            full_text, re.IGNORECASE
        )
        if engine_m:
            result["engineNumber"] = self._field(engine_m.group(1), 0.85, regex_validated=True)

        # Make / manufacturer
        make = self._find_near(full_text, "make") or self._find_near(full_text, "manufacturer")
        if make:
            result["make"] = self._field(make[0].title(), make[1])

        # Model
        model = self._find_near(full_text, "model")
        if model:
            result["model"] = self._field(model[0], model[1])

        # Year of manufacture
        year_m = re.search(r"(?:year|manufactured|manufacture date)[^\d]*(\d{4})", full_text, re.IGNORECASE)
        if year_m:
            result["year"] = self._field(year_m.group(1), 0.88, regex_validated=True)

        # Owner name
        owner_anchors = ["name of owner", "owner's name", "owner name", "registered owner"]
        for anchor in owner_anchors:
            name = self._find_near(full_text, anchor)
            if name:
                result["ownerName"] = self._field(name[0], name[1])
                break

        # Address
        addr = self._find_near(full_text, "address", max_chars=200)
        if addr:
            result["ownerAddress"] = self._field(addr[0], addr[1])

        # Color
        color_m = re.search(r"colou?r[:\s]+([A-Za-z]+)", full_text, re.IGNORECASE)
        if color_m:
            result["color"] = self._field(color_m.group(1).title(), 0.80)

        # Fuel type
        fuel_m = re.search(r"fuel[:\s]+(petrol|diesel|electric|hybrid|cng|gas)", full_text, re.IGNORECASE)
        if fuel_m:
            result["fuelType"] = self._field(fuel_m.group(1).lower(), 0.85, regex_validated=True)

        return result
