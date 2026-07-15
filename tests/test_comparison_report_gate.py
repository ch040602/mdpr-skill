from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.comparison_report_gate import comparison_report_ok


def complete_report(root: Path) -> dict:
    manifest_path = root / "mdpr-runtime-manifest.json"
    manifest_path.write_text(json.dumps({
        "engine": "mdpresent",
        "slideCount": 10,
        "validation": {
            "polish": {
                "checked": True,
                "requiredFailureCount": 0,
                "chapters": {
                    "layoutComposition": {
                        "required": True,
                        "passed": True,
                        "eligibleSlideCount": 8,
                        "dominantGeometryRatio": 0.5,
                        "maxSameGeometryInFive": 3,
                    },
                },
            },
            "coherence": {
                "checked": True,
                "checks": {
                    "claimlessEvidenceSlides": True,
                    "detachedCaptions": True,
                    "orphanTables": True,
                    "lowObjectCoverage": True,
                },
                "diagnostics": [],
            },
        },
    }), encoding="utf-8")
    manifest_sha256 = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
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
        "runtimeDesignEvidence": {
            "manifestPath": manifest_path.name,
            "manifestSha256": manifest_sha256,
            "mdprCommit": "b" * 40,
            "engine": "mdpresent",
            "slideCount": 10,
            "polish": {
                "checked": True,
                "requiredFailureCount": 0,
                "layoutComposition": {
                    "required": True,
                    "passed": True,
                    "eligibleSlideCount": 8,
                    "dominantGeometryRatio": 0.5,
                    "maxSameGeometryInFive": 3,
                },
            },
            "coherence": {
                "checked": True,
                "errorCount": 0,
                "checks": {
                    "claimlessEvidenceSlides": True,
                    "detachedCaptions": True,
                    "orphanTables": True,
                    "lowObjectCoverage": True,
                },
            },
        },
        "actualMarkdownRun": {"mdprCommit": "b" * 40},
    }


class ComparisonReportGateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_complete_report_passes(self) -> None:
        self.assertTrue(comparison_report_ok(complete_report(self.root), actual_run_exists=True, artifact_root=self.root))

    def test_missing_runtime_design_evidence_fails_closed(self) -> None:
        report = complete_report(self.root)
        del report["runtimeDesignEvidence"]
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_stale_runtime_manifest_hash_fails_closed(self) -> None:
        report = complete_report(self.root)
        report["runtimeDesignEvidence"]["manifestSha256"] = "0" * 64
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_runtime_evidence_commit_and_slide_count_must_match_actual_run(self) -> None:
        report = complete_report(self.root)
        report["runtimeDesignEvidence"]["mdprCommit"] = "d" * 40
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

        report = complete_report(self.root)
        report["runtimeDesignEvidence"]["slideCount"] = 11
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_runtime_polish_or_coherence_error_cannot_hide_behind_valid_pptx(self) -> None:
        report = complete_report(self.root)
        report["runtimeDesignEvidence"]["polish"]["layoutComposition"]["passed"] = False
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

        report = complete_report(self.root)
        report["runtimeDesignEvidence"]["coherence"]["errorCount"] = 1
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_runtime_coherence_warning_remains_a_warning(self) -> None:
        report = complete_report(self.root)
        manifest_path = self.root / report["runtimeDesignEvidence"]["manifestPath"]
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["validation"]["coherence"]["checks"]["detachedCaptions"] = False
        manifest["validation"]["coherence"]["diagnostics"] = [
            {"level": "warning", "code": "DETACHED_CAPTION"},
        ]
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        report["runtimeDesignEvidence"]["manifestSha256"] = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
        report["runtimeDesignEvidence"]["coherence"]["checks"]["detachedCaptions"] = False
        report["runtimeDesignEvidence"]["coherence"]["warningCount"] = 1
        self.assertTrue(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_report_summary_cannot_override_failing_bound_manifest(self) -> None:
        report = complete_report(self.root)
        manifest_path = self.root / report["runtimeDesignEvidence"]["manifestPath"]
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["validation"]["polish"]["requiredFailureCount"] = 1
        manifest["validation"]["polish"]["chapters"]["layoutComposition"]["passed"] = False
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        report["runtimeDesignEvidence"]["manifestSha256"] = hashlib.sha256(manifest_path.read_bytes()).hexdigest()

        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_sub_floor_typography_in_either_deck_fails(self) -> None:
        report = complete_report(self.root)
        report["mdprBaselineValidation"]["minFontSizePt"] = 15.9
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

        report = complete_report(self.root)
        report["skillValidation"]["minFontSizePt"] = 15.9
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))

    def test_missing_or_nonnumeric_font_evidence_fails_closed(self) -> None:
        report = complete_report(self.root)
        report["skillValidation"]["minFontSizePt"] = None
        self.assertFalse(comparison_report_ok(report, actual_run_exists=True, artifact_root=self.root))


if __name__ == "__main__":
    unittest.main()
