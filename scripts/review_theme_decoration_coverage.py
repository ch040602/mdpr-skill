#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import zipfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "theme-decoration-review"
CATALOG = ROOT / "design_components" / "decoration" / "src" / "decorators" / "objectShapeCatalog.json"
SELECTOR = ROOT / "design_components" / "rule-engine" / "src" / "select" / "selectVariant.ts"
MATRIX_REPORT = ROOT / "artifacts" / "theme-style-color-matrix" / "theme-style-color-report.json"
REFERENCE_REPORT = ROOT / "artifacts" / "reference-pattern-analysis" / "derived-object-rules.json"

EXPECTED_STYLE_FEEL: dict[str, dict[str, Any]] = {
    "glass": {"dark": True, "shadow": "glass", "shapeSource": "svg"},
    "grid": {"shadow": "none", "shapeSource": "svg"},
    "data": {"dark": True, "shadow": "none", "shapeSource": "svg"},
    "magazine": {"warm": True, "shapeSource": "svg"},
    "minimalism": {"shapeSource": "svg", "shadow": "none", "light": True},
    "newmorphism": {"shapeSource": "svg", "shadow": "newmorphic", "light": True},
    "executive": {"shapeSource": "svg"},
    "technical": {"shapeSource": "svg"},
    "dark": {"dark": True, "shapeSource": "svg"},
    "simple": {"shapeSource": "svg"},
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def luminance(hex_color: str) -> float:
    r, g, b = [channel / 255 for channel in hex_to_rgb(hex_color)]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def is_warm(hex_color: str) -> bool:
    r, g, b = hex_to_rgb(hex_color)
    return r >= b and (r + g * 0.62) > (b * 1.45)


def selected_decoration_ids() -> list[str]:
    source = SELECTOR.read_text(encoding="utf-8")
    return sorted(set(re.findall(r"\{\s*id:\s*'([^']+)'", source)))


def image_stats(path: Path) -> dict[str, Any]:
    image = Image.open(path).convert("RGB")
    stat = ImageStat.Stat(image)
    mean = tuple(round(value, 2) for value in stat.mean)
    gray = image.convert("L")
    histogram = gray.histogram()
    total = image.width * image.height
    dark = sum(histogram[:80]) / total
    light = sum(histogram[210:]) / total
    return {"size": list(image.size), "meanRgb": mean, "darkPixelRatio": round(dark, 4), "lightPixelRatio": round(light, 4)}


def pptx_contains_frosted_glass_markers(path: Path) -> bool:
    if not path.exists():
        return False
    markers = ("data-mdpr-glass=\"frosted\"", "glassFill", "frostedNoise", "data-mdpr-glass-layer")
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.startswith("ppt/media/") or not name.lower().endswith(".svg"):
                continue
            text = archive.read(name).decode("utf-8", errors="ignore")
            if all(marker in text for marker in markers):
                return True
    return False


def pptx_contains_newmorphic_markers(path: Path) -> bool:
    if not path.exists():
        return False
    markers = ("data-mdpr-newmorphism=\"soft-ui\"", "newmorphicLift", "data-mdpr-newmorphism-layer")
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.startswith("ppt/media/") or not name.lower().endswith(".svg"):
                continue
            text = archive.read(name).decode("utf-8", errors="ignore")
            if all(marker in text for marker in markers):
                return True
    return False


def color_distance(left: tuple[float, float, float], right: tuple[float, float, float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def audit_catalog() -> dict[str, Any]:
    catalog = read_json(CATALOG)
    patterns = catalog["patterns"]
    policy = catalog.get("diversityPolicy", {})
    selected = selected_decoration_ids()
    by_id = {pattern["id"]: pattern for pattern in patterns}
    missing = [item for item in selected if item not in by_id]
    unique_kinds = sorted({pattern["kind"] for pattern in patterns})
    archetypes = sorted({pattern.get("archetype") or f"{pattern.get('family')}:{pattern.get('shapeGrammar')}" for pattern in patterns})
    token_ready = [
        pattern["id"]
        for pattern in patterns
        if {"surface", "line", "text"}.issubset(set(pattern.get("themeBindings", [])))
        or {"line", "accent", "text"}.issubset(set(pattern.get("themeBindings", [])))
    ]
    families = sorted({pattern["family"] for pattern in patterns})
    family_counts = {family: sum(1 for pattern in patterns if pattern["family"] == family) for family in families}
    card_ratio = family_counts.get("card", 0) / len(patterns) if patterns else 1
    required_families = set(policy.get("requiredFamilies", []))
    missing_required_families = sorted(required_families - set(families))
    min_patterns = int(policy.get("minimumPatterns", 50))
    min_families = int(policy.get("minimumFamilies", 12))
    max_card_ratio = float(policy.get("maximumCardFamilyRatio", 0.4))
    return {
        "catalogPath": str(CATALOG.relative_to(ROOT)),
        "catalogPatternCount": len(patterns),
        "uniqueKindCount": len(unique_kinds),
        "structuralArchetypeCount": len(archetypes),
        "themeTokenReadyCount": len(token_ready),
        "selectorPatternCount": len(selected),
        "selectorMissingFromCatalog": missing,
        "families": families,
        "familyCounts": family_counts,
        "cardFamilyRatio": round(card_ratio, 3),
        "missingRequiredFamilies": missing_required_families,
        "sampleKinds": unique_kinds[:40],
        "ok": (
            len(patterns) >= min_patterns
            and len(unique_kinds) >= min_patterns
            and len(archetypes) >= min_patterns
            and len(token_ready) >= min_patterns
            and len(families) >= min_families
            and card_ratio <= max_card_ratio
            and not missing_required_families
            and len(selected) >= 30
            and not missing
        ),
    }


def audit_reference_corpus() -> dict[str, Any]:
    report = read_json(REFERENCE_REPORT)
    checks = {
        "sourceNeutral": report.get("sourceClass") == "approved presentation reference corpus; source identities omitted",
        "downloadedEnough": report.get("pptDownloaded", 0) >= 80,
        "slidesEnough": report.get("slidesAnalyzed", 0) >= 700,
        "renderedEnough": report.get("renderedPngSlides", 0) >= 1200,
        "samplesEnough": report.get("pngSamplesAnalyzed", 0) >= 120,
        "derivedEnough": report.get("derivedObjectPatternCount", 0) >= 60,
    }
    return {
        "reportPath": str(REFERENCE_REPORT.relative_to(ROOT)),
        "pptDownloaded": report.get("pptDownloaded", 0),
        "slidesAnalyzed": report.get("slidesAnalyzed", 0),
        "renderedPngSlides": report.get("renderedPngSlides", 0),
        "pngSamplesAnalyzed": report.get("pngSamplesAnalyzed", 0),
        "derivedObjectPatternCount": report.get("derivedObjectPatternCount", 0),
        "contactSheet": report.get("contactSheet"),
        "checks": checks,
        "ok": all(checks.values()),
    }


def audit_theme_matrix() -> dict[str, Any]:
    report = read_json(MATRIX_REPORT)
    combinations = report.get("combinations", [])
    audits: list[dict[str, Any]] = []
    means: list[tuple[str, tuple[float, float, float]]] = []
    for combo in combinations:
        lock = read_json(ROOT / combo["designLock"])
        style = combo["style"]
        expected = EXPECTED_STYLE_FEEL.get(style, {})
        surface = lock.get("surfacePolicy", {})
        theme_colors = lock.get("themeColors", {})
        bg = theme_colors.get("light1") or theme_colors.get("dark1") or "FFFFFF"
        primary = theme_colors.get("accent1", "").upper()
        palette = lock.get("paletteSeed", {})
        png_path = ROOT / combo["pngPreview"]
        proof_path = ROOT / combo["pngProofPreview"]
        pptx_path = ROOT / combo["pptx"] if combo.get("pptx") else Path()
        preview_stats = image_stats(png_path)
        proof_stats = image_stats(proof_path)
        means.append((combo["id"], tuple(float(x) for x in preview_stats["meanRgb"])))
        checks = {
            "styleMatchesLock": lock.get("decorationStyle") == style,
            "harmonyMatchesLock": lock.get("colorCombination") == combo["harmony"],
            "colorSeedMatchesAccent1": primary == combo["color"].lstrip("#").upper(),
            "adobePaletteSeed": palette.get("sourceModel") == "adobe-color-wheel",
            "themeAccentCount": len([key for key in theme_colors if key.startswith("accent")]) >= 6,
            "boundsOk": combo.get("boundsValidation", {}).get("ok") is True,
            "pngExported": combo.get("pngSlideCount", 0) >= 10,
            "shapeSource": not expected.get("shapeSource") or surface.get("shapeSource") == expected["shapeSource"],
            "shadow": not expected.get("shadow") or surface.get("shadow") == expected["shadow"],
            "darkFeel": not expected.get("dark") or luminance(bg) < 0.35 or preview_stats["darkPixelRatio"] > 0.35,
            "lightFeel": not expected.get("light") or luminance(bg) > 0.72 or preview_stats["lightPixelRatio"] > 0.55,
            "warmFeel": not expected.get("warm") or is_warm(bg) or is_warm(primary),
            "frostedGlassSvg": style != "glass" or pptx_contains_frosted_glass_markers(pptx_path),
            "newmorphicSvg": style != "newmorphism" or pptx_contains_newmorphic_markers(pptx_path),
        }
        audits.append({
            "id": combo["id"],
            "style": style,
            "color": combo["color"],
            "harmony": combo["harmony"],
            "surfacePolicy": surface,
            "paletteBase": palette.get("base"),
            "previewStats": preview_stats,
            "proofStats": proof_stats,
            "checks": checks,
            "ok": all(checks.values()),
        })
    pairwise = []
    for index, (left_id, left_mean) in enumerate(means):
        for right_id, right_mean in means[index + 1:]:
            pairwise.append(color_distance(left_mean, right_mean))
    return {
        "matrixPath": str(MATRIX_REPORT.relative_to(ROOT)),
        "comboCount": len(combinations),
        "visualDistinctness": {
            "minMeanRgbDistance": round(min(pairwise), 2) if pairwise else 0,
            "averageMeanRgbDistance": round(sum(pairwise) / len(pairwise), 2) if pairwise else 0,
            "policy": "average RGB distance must be high; a low minimum is allowed for multiple dark-style themes when style-specific grammar checks pass",
        },
        "themeAudits": audits,
        "contactSheets": {
            "cover": report.get("coverContactSheet"),
            "proof": report.get("proofContactSheet"),
        },
        "ok": len(combinations) >= 8 and all(item["ok"] for item in audits) and ((sum(pairwise) / len(pairwise)) if pairwise else 0) > 40,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = audit_catalog()
    matrix = audit_theme_matrix()
    reference = audit_reference_corpus()
    result = {
        "criteria": {
            "minimumDistinctObjectKinds": 50,
            "minimumReferenceCorpus": "80 PPT files, 700 slides, 1200 PowerPoint PNG renders, and 60 source-neutral derived object patterns",
            "diversityDefinition": "count structural archetypes and families; card variants alone do not satisfy diversity",
            "themeAndColorAdjustable": "each counted object kind must declare themeBindings and generated decks must write Adobe-style palette/theme colors",
            "themeFeel": "style-specific design locks plus PowerPoint-exported PNG previews must pass checks",
        },
        "catalogAudit": catalog,
        "referenceCorpusAudit": reference,
        "themeMatrixAudit": matrix,
        "assessment": "sufficient" if catalog["ok"] and reference["ok"] and matrix["ok"] else "needs-improvement",
        "ok": catalog["ok"] and reference["ok"] and matrix["ok"],
    }
    path = OUT / "theme-decoration-coverage-report.json"
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
