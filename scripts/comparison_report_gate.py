from __future__ import annotations

from typing import Any


MIN_FONT_SIZE_PT = 16


def comparison_report_ok(report: dict[str, Any], *, actual_run_exists: bool) -> bool:
    baseline_previews = report["baselineRenderPreview"]
    skill_previews = report["skillRenderPreview"]
    minimum_fonts = (
        report["mdprBaselineValidation"].get("minFontSizePt"),
        report["skillValidation"].get("minFontSizePt"),
    )
    return (
        report["sourceFileCount"] >= 20
        and report["mdprBaselineValidation"]["slides"] >= 10
        and report["skillValidation"]["slides"] >= 9
        and report["skillValidation"].get("namedContainerOverflowCount", 0) == 0
        and all(isinstance(value, (int, float)) and value >= MIN_FONT_SIZE_PT for value in minimum_fonts)
        and actual_run_exists
        and report["powerPointExport"]["ok"]
        and report["powerPointExport"]["baselineSlideCount"] == report["mdprBaselineValidation"]["slides"]
        and report["powerPointExport"]["skillSlideCount"] == report["skillValidation"]["slides"]
        and report["powerPointExport"]["baselineValidation"]["invalidSlideCount"] == 0
        and report["powerPointExport"]["skillValidation"]["invalidSlideCount"] == 0
        and len(baseline_previews) == 4
        and len(skill_previews) == 4
        and all(item["hasContent"] for item in baseline_previews)
        and all(item["hasContent"] for item in skill_previews)
    )
