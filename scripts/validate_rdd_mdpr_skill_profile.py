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

FORBIDDEN_ALLOWLIST_TERMS = [
    "FluxDerby",
    "craftpix",
    "Steam",
    "steam",
    "Unity",
    "unity/",
    "saves/**",
    "assets/external/craftpix",
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
    truncation = inventory.get("truncation", {})

    if inventory.get("release_profile") != "mdpr-skill":
        fail(f"expected mdpr-skill release profile, got {inventory.get('release_profile')!r}")
    if release_evidence.get("profile") != "mdpr-skill":
        fail(f"expected mdpr-skill release evidence profile, got {release_evidence.get('profile')!r}")
    if release_coverage.get("status") != "pass":
        fail(f"expected release scan coverage pass, got {release_coverage.get('status')!r}")
    if release_verdict.get("release_gate_status") != "local_static_structure_gate_pass":
        fail(f"expected local static gate pass, got {release_verdict.get('release_gate_status')!r}")

    constraints = release_verdict.get("constraints", [])
    constraint_by_id = {
        item.get("id"): item
        for item in constraints
        if isinstance(item, dict)
    }
    constraint_ids = set(constraint_by_id)
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

    if "schema_sync_and_shared_contracts" in constraint_ids:
        fail("schema sync and schema contract coverage must be separate constraints")
    if "schema_contract_files_covered" not in constraint_ids:
        fail("missing schema_contract_files_covered constraint")
    if "schema_sync_gate_passed" not in constraint_ids:
        fail("missing schema_sync_gate_passed constraint")

    schema_contract = constraint_by_id["schema_contract_files_covered"]
    if schema_contract.get("source") != "release_scan_coverage":
        fail(f"schema_contract_files_covered must use release_scan_coverage source, got {schema_contract.get('source')!r}")

    schema_sync = constraint_by_id["schema_sync_gate_passed"]
    if schema_sync.get("status") == "proven":
        source = str(schema_sync.get("source", ""))
        command = str(schema_sync.get("command", ""))
        if source == "release_scan_coverage" or "validate-schema-sync" not in command:
            fail("schema_sync_gate_passed cannot be proven from inventory coverage alone")
    elif schema_sync.get("status") != "not_evaluated":
        fail(f"unexpected schema_sync_gate_passed status: {schema_sync.get('status')!r}")

    allowlist = [
        str(item)
        for item in truncation.get("omitted_path_allowlist", [])
    ]
    stale_allowlist = sorted(
        rule
        for rule in allowlist
        if any(term in rule for term in FORBIDDEN_ALLOWLIST_TERMS)
    )
    if stale_allowlist:
        fail(f"stale game-project omitted-path allowlist entries present: {', '.join(stale_allowlist)}")

    markdown = PROFILE_MD.read_text(encoding="utf-8")
    found_terms = sorted(term for term in FORBIDDEN_TERMS if term in markdown)
    if found_terms:
        fail(f"forbidden Unity/Steam terms present in profile Markdown: {', '.join(found_terms)}")

    print("RDD mdpr-skill profile validation passed")


if __name__ == "__main__":
    main()
