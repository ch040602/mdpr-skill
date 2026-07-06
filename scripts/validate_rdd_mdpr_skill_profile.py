#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROFILE_JSON = ROOT / ".codex" / "review-driven-development" / "project-structure-completeness.json"
PROFILE_MD = ROOT / ".codex" / "review-driven-development" / "project-structure-completeness.md"

FORBIDDEN_TERMS = [
    "FLUX DERBY",
    "Steamworks",
    "Unity Editor",
    "unity_project_structure",
    "unity_editor_execution",
    "steamworks_upload_review",
    "rendered_capture",
    "hardware_qa",
    "legal_review",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if not PROFILE_JSON.exists():
        fail(f"missing RDD profile JSON: {PROFILE_JSON}")
    if not PROFILE_MD.exists():
        fail(f"missing RDD profile Markdown: {PROFILE_MD}")

    try:
        packet = json.loads(PROFILE_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"invalid RDD profile JSON: {error}")

    inventory = packet.get("inventory", {})
    release_evidence = packet.get("release_evidence_completeness", {})
    release_verdict = packet.get("release_verdict", {})
    release_coverage = inventory.get("release_scan_coverage", {})

    if inventory.get("release_profile") != "mdpr-skill":
        fail(f"expected mdpr-skill release profile, got {inventory.get('release_profile')!r}")
    if release_evidence.get("profile") != "mdpr-skill":
        fail(f"expected mdpr-skill release evidence profile, got {release_evidence.get('profile')!r}")
    if release_coverage.get("status") != "pass":
        fail(f"expected release scan coverage pass, got {release_coverage.get('status')!r}")
    if release_verdict.get("release_gate_status") != "local_static_structure_gate_pass":
        fail(f"expected local static gate pass, got {release_verdict.get('release_gate_status')!r}")

    constraints = release_verdict.get("constraints", [])
    constraint_ids = {
        item.get("id")
        for item in constraints
        if isinstance(item, dict)
    }
    forbidden_constraint_ids = {
        "unity_project_structure",
        "unity_editor_execution",
        "steamworks_upload_review",
        "rendered_capture",
        "hardware_qa",
        "legal_review",
    }
    present_forbidden = sorted(constraint_ids & forbidden_constraint_ids)
    if present_forbidden:
        fail(f"forbidden Unity/Steam constraints present: {', '.join(present_forbidden)}")

    markdown = PROFILE_MD.read_text(encoding="utf-8")
    found_terms = sorted(term for term in FORBIDDEN_TERMS if term in markdown)
    if found_terms:
        fail(f"forbidden Unity/Steam terms present in profile Markdown: {', '.join(found_terms)}")

    print("RDD mdpr-skill profile validation passed")


if __name__ == "__main__":
    main()
