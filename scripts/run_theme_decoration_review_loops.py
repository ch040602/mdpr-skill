#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "theme-decoration-review"
ITERATIONS = OUT / "iterations"
DECK_SCRIPT = ROOT / "scripts" / "create_theme_decoration_review_deck.py"
DECK_REPORT = OUT / "theme-decoration-review-deck-report.json"
PPTX = OUT / "theme-decoration-review.pptx"
PNG_DIR = OUT / "png"
LOOP_REPORT = OUT / "theme-decoration-review-iteration-report.json"


def copy_round_artifacts(round_dir: Path) -> None:
    if round_dir.exists():
        shutil.rmtree(round_dir)
    round_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PPTX, round_dir / PPTX.name)
    shutil.copy2(DECK_REPORT, round_dir / DECK_REPORT.name)
    png_out = round_dir / "png"
    shutil.copytree(PNG_DIR, png_out)


def classify_round(report: dict[str, Any]) -> dict[str, Any]:
    validation = report["validation"]
    pngs = validation["pngValidation"]
    findings: list[str] = []
    if validation["boundsViolations"]:
        findings.append("slide-bound overflow")
    if validation["textMarginViolations"]:
        findings.append("text margin too small")
    if validation["minFontPt"] < 7:
        findings.append("font below readable minimum")
    if len(validation["layoutFamilies"]) < 6:
        findings.append("layout diversity insufficient")
    if not all(item["hasContent"] and item["uniqueColors"] > 100 for item in pngs):
        findings.append("rendered PNG lacks visual content")
    if validation["slideCount"] < 10:
        findings.append("review coverage slide count too low")
    return {
        "ok": validation["ok"] and not findings,
        "findings": findings,
        "vlmReviewChecklist": [
            "text boxes appear separated from decoration marks",
            "marker letters are centered inside circles or tabs",
            "timeline/comparison/process/data/catalog layouts are visually distinct",
            "no generated object crosses slide boundaries",
            "empty space is not filled by unrelated large icons",
        ],
    }


def run_round(index: int) -> dict[str, Any]:
    subprocess.run([sys.executable, str(DECK_SCRIPT)], cwd=ROOT, check=True)
    report = json.loads(DECK_REPORT.read_text(encoding="utf-8"))
    review = classify_round(report)
    round_dir = ITERATIONS / f"round-{index:02d}"
    copy_round_artifacts(round_dir)
    return {
        "round": index,
        "artifacts": str(round_dir.relative_to(ROOT)),
        "deckOk": report["ok"],
        "validation": report["validation"],
        "review": review,
        "ok": report["ok"] and review["ok"],
    }


def main() -> None:
    ITERATIONS.mkdir(parents=True, exist_ok=True)
    rounds = [run_round(index) for index in range(1, 6)]
    result = {
        "purpose": "Five-pass generated PPTX -> PowerPoint PNG export -> visual/geometry review loop for theme decoration deck.",
        "roundCount": len(rounds),
        "rounds": rounds,
        "acceptedFixesBeforeLoop": [
            "separated catalog preview decoration zones from text zones",
            "raised review-deck minimum text size to 7pt",
            "added non-card layout slides for timeline, comparison, process, data/table/chart, and mixed object stress checks",
            "added bounds, text-margin, font-size, layout-family, and rendered-PNG validation gates",
        ],
        "ok": len(rounds) >= 5 and all(item["ok"] for item in rounds),
    }
    LOOP_REPORT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
