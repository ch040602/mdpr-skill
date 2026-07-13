from __future__ import annotations

import unittest

from scripts.comparison_report_gate import comparison_report_ok


def complete_report() -> dict:
    return {
        "sourceFileCount": 20,
        "mdprBaselineValidation": {"slides": 10, "minFontSizePt": 16},
        "skillValidation": {"slides": 9, "minFontSizePt": 16},
        "powerPointExport": {
            "ok": True,
            "baselineSlideCount": 10,
            "skillSlideCount": 9,
            "baselineValidation": {"invalidSlideCount": 0},
            "skillValidation": {"invalidSlideCount": 0},
        },
        "baselineRenderPreview": [{"hasContent": True}] * 4,
        "skillRenderPreview": [{"hasContent": True}] * 4,
    }


class ComparisonReportGateTests(unittest.TestCase):
    def test_complete_report_passes(self) -> None:
        self.assertTrue(comparison_report_ok(complete_report(), actual_run_exists=True))

    def test_sub_floor_typography_in_either_deck_fails(self) -> None:
        report = complete_report()
        report["mdprBaselineValidation"]["minFontSizePt"] = 15.9
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True))

        report = complete_report()
        report["skillValidation"]["minFontSizePt"] = 15.9
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True))

    def test_missing_or_nonnumeric_font_evidence_fails_closed(self) -> None:
        report = complete_report()
        report["skillValidation"]["minFontSizePt"] = None
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True))


if __name__ == "__main__":
    unittest.main()
