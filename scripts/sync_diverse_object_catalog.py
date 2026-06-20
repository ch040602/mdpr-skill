#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SEEDS = ROOT / "design_components" / "design-source-adapter" / "seeds" / "visual-diversification-seeds.json"
CATALOG = ROOT / "design_components" / "decoration" / "src" / "decorators" / "objectShapeCatalog.json"

LEGACY_ALIASES = {
    "left-accent-rail": "accent-rail-card",
    "top-hairline-rule": "top-rule-card",
    "number-tab": "number-tab-card",
    "corner-chip": "corner-chip-card",
    "bracket-callout": "bracket-note-card",
    "bottom-meter": "bottom-meter-card",
    "side-notch": "side-notch-card",
    "rank-ribbon": "rank-ribbon-card",
}


def pattern_to_catalog(pattern: dict[str, Any]) -> dict[str, Any]:
    structure = [str(item) for item in pattern.get("structure", [])]
    best_for = [str(item) for item in pattern.get("bestFor", [])]
    selection = pattern.get("selection", {})
    signals = best_for + [str(key) for key in selection.keys()]
    family = str(pattern["family"])
    bindings = ["surface", "line", "accent", "text"]
    if family in {"surface", "card", "chart", "image"}:
        bindings.append("effect")
    return {
        "id": pattern["id"],
        "kind": pattern["id"],
        "family": family,
        "archetype": f"{family}:{'|'.join(structure)}",
        "shapeGrammar": "; ".join(structure),
        "selectionSignals": sorted(set(signals)),
        "themeBindings": bindings,
        "coherenceGuard": pattern.get("coherenceGuard", ""),
    }


def main() -> None:
    seeds = json.loads(SEEDS.read_text(encoding="utf-8"))
    patterns = [pattern_to_catalog(pattern) for pattern in seeds["derivedObjectPatterns"]]
    by_id = {pattern["id"]: pattern for pattern in patterns}
    for alias_id, source_id in LEGACY_ALIASES.items():
        source = dict(by_id[source_id])
        source["id"] = alias_id
        source["kind"] = alias_id
        source["archetype"] = f"compat:{alias_id}:{source['shapeGrammar']}"
        source["selectionSignals"] = sorted(set(source["selectionSignals"] + ["legacy-selector-compatible"]))
        patterns.append(source)
    catalog = {
        "schemaVersion": 2,
        "purpose": "Renderer-neutral object and layout grammar for MDPR visual diversification. Entries are source-neutral structural rules, not copied reference slides.",
        "minimumDistinctArchetypes": 50,
        "themeBindingContract": {
            "surface": "PowerPoint theme surface/background slot or harmony support color",
            "line": "PowerPoint theme line/text2 slot or harmony muted color",
            "accent": "PowerPoint theme accent slot or harmony emphasis/contrast color",
            "text": "PowerPoint theme text slot",
            "effect": "Theme decoration style controls shadow/glass/grid/data/magazine treatment",
        },
        "diversityPolicy": {
            "minimumPatterns": 50,
            "minimumFamilies": 12,
            "maximumCardFamilyRatio": 0.4,
            "requiredFamilies": ["card", "list", "callout", "metric", "image", "diagram", "chart", "table", "surface", "label"],
        },
        "patterns": patterns,
    }
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "path": str(CATALOG.relative_to(ROOT)),
        "patternCount": len(patterns),
        "familyCount": len({pattern["family"] for pattern in patterns}),
        "archetypeCount": len({pattern["archetype"] for pattern in patterns}),
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
