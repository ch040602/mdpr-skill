from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any


MIN_FONT_SIZE_PT = 16
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


def runtime_design_evidence_ok(report: dict[str, Any], *, artifact_root: Path) -> bool:
    evidence = report.get("runtimeDesignEvidence")
    actual_run = report.get("actualMarkdownRun")
    if not isinstance(evidence, dict) or not isinstance(actual_run, dict):
        return False

    polish = evidence.get("polish")
    layout_composition = polish.get("layoutComposition") if isinstance(polish, dict) else None
    coherence = evidence.get("coherence")
    checks = coherence.get("checks") if isinstance(coherence, dict) else None
    required_coherence_checks = (
        "claimlessEvidenceSlides",
        "detachedCaptions",
        "orphanTables",
        "lowObjectCoverage",
    )
    manifest_path_value = evidence.get("manifestPath")
    if not isinstance(manifest_path_value, str) or not manifest_path_value:
        return False
    root = artifact_root.resolve()
    manifest_path = (root / manifest_path_value).resolve()
    if not manifest_path.is_relative_to(root) or not manifest_path.is_file():
        return False
    manifest_bytes = manifest_path.read_bytes()
    manifest_sha256 = hashlib.sha256(manifest_bytes).hexdigest()
    try:
        manifest = json.loads(manifest_bytes)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return False
    manifest_validation = manifest.get("validation") or {}
    manifest_polish = manifest_validation.get("polish") or {}
    manifest_layout = (manifest_polish.get("chapters") or {}).get("layoutComposition") or {}
    manifest_coherence = manifest_validation.get("coherence") or {}
    manifest_checks = manifest_coherence.get("checks") or {}
    manifest_diagnostics = manifest_coherence.get("diagnostics") or []
    required_layout_fields = (
        "required",
        "passed",
        "eligibleSlideCount",
        "dominantGeometryRatio",
        "maxSameGeometryInFive",
    )
    layout_evidence_matches = (
        isinstance(layout_composition, dict)
        and all(key in layout_composition for key in required_layout_fields)
        and all(value == manifest_layout.get(key) for key, value in layout_composition.items())
    )
    coherence_evidence_matches = (
        isinstance(checks, dict)
        and all(checks.get(name) == manifest_checks.get(name) for name in required_coherence_checks)
        and coherence.get("errorCount") == sum(item.get("level") == "error" for item in manifest_diagnostics)
        and coherence.get("warningCount", 0) == sum(item.get("level") == "warning" for item in manifest_diagnostics)
    )

    return (
        isinstance(evidence.get("manifestSha256"), str)
        and bool(SHA256_RE.fullmatch(evidence["manifestSha256"]))
        and evidence["manifestSha256"] == manifest_sha256
        and evidence.get("mdprCommit") == actual_run.get("mdprCommit")
        and evidence.get("engine") == manifest.get("engine") == "mdpresent"
        and evidence.get("slideCount") == manifest.get("slideCount") == report.get("mdprBaselineValidation", {}).get("slides")
        and isinstance(polish, dict)
        and polish.get("checked") is manifest_polish.get("checked") is True
        and polish.get("requiredFailureCount") == manifest_polish.get("requiredFailureCount") == 0
        and layout_evidence_matches
        and layout_composition.get("required") is True
        and layout_composition.get("passed") is True
        and isinstance(coherence, dict)
        and coherence.get("checked") is manifest_coherence.get("checked") is True
        and coherence.get("errorCount") == 0
        and coherence_evidence_matches
    )


def comparison_report_ok(
    report: dict[str, Any],
    *,
    actual_run_exists: bool,
    artifact_root: Path | None = None,
) -> bool:
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
        and runtime_design_evidence_ok(report, artifact_root=artifact_root or Path.cwd())
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
