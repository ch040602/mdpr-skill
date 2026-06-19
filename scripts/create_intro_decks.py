from __future__ import annotations

import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MDPR = ROOT / ".cache" / "mdpr"
CLI = MDPR / "packages" / "cli" / "dist" / "index.js"
OUT = ROOT / "artifacts" / "intro-decks"

THEMES = [
    "plain",
    "clean",
    "executive",
    "editorial",
    "technical",
    "dark",
    "nord",
    "solarized",
    "dracula",
    "tableau",
    "gruvbox",
    "monokai",
    "material",
    "tokyo-night",
]

INTRO_MD = """# MDPR Visual Diversification

## Runtime Boundary

- MDPR: deterministic parsing, splitting, layout, color harmony, rendering, and validation.
- mdpr-skill: optional compact semantic hints before deterministic selection.
- LLM scope: intent, grouping, importance candidates, and ambiguity notes only.
- Rule scope: slide splits, coordinates, typography, colors, z-order, effects, arrows, tables, charts, and PPTX objects.

## Numeric Evidence Beside Reading

- Purpose: compare quantitative signal and interpretation in one pass.
- Layout hint: keep the explanation short enough for chart-beside-prose placement.
- Rule boundary: MDPR chooses coordinates, theme colors, and chart objects.

```chart
labels: Parse, Split, Layout, Render
Before: 56, 64, 70, 62
After: 82, 88, 91, 87
```

## Parallel Table And Graph

```chart
labels: Table, Chart, Text, Theme
Coherence: 89, 92, 86, 91
```

| Area | Rule-based behavior | Validation signal |
| --- | --- | --- |
| Table | Header weight and numeric alignment | readable cells |
| Chart | Theme-bound palette tokens | editable chart |
| Text | Minimum readable font floor | bounded frame |

## Visual Families

- Sequence rail: ordered steps, consistent arrow semantics, restrained accent.
- Proof point: metric, callout line, contrast chip, and evidence table.
- Comparison: two balanced regions with shared baseline and matching text floors.
- Text relief: one quiet monochrome icon slot when a prose slide would otherwise be plain.

## Reuse Contract

- This Markdown is the reusable LLM-hint version.
- The LLM does not select the final theme, coordinates, variants, or object geometry.
- MDPR can rebuild the same source under every design preset through `--theme-gallery`.
"""

ELEMENTS_MD = """# MDPR Slide Element Catalog

## Text Blocks

- Cover title
- Section title
- Paragraph body
- Ordered list
- Unordered list
- Quote emphasis
- Code block

## Tables

| Element | PPTX object | Coherence rule |
| --- | --- | --- |
| Header row | Native table text | bold and readable |
| Numeric cell | Native table text | right aligned |
| Long label | Native table text | trimmed spacing |
| Body cell | Native table text | stable minimum font |

## Native Chart

```chart
labels: Parser, Layout, Renderer
Coverage: 91, 87, 94
```

## Chart Beside Prose

- Pattern: short interpretation text beside quantitative evidence.
- Owner: MDPR selects body/chart geometry and typography.
- Constraint: text stays compact so the chart keeps visual priority.

```chart
labels: Baseline, Refined, Validated
Score: 61, 84, 93
```

## Gauge Proof Object

```chart
kind: gauge
labels: Readiness
Score: 83
```

## Arc Ring Proof Object

```arc-ring
labels: Validated, Remaining
Coverage: 72, 28
```

## Connected Strip Proof Object

```connected-strip
Draft, 20
Render, 68
Validate, 92
```

## Ranked Bars Proof Object

```ranked-bars
Parser, 91
Layout, 87
Renderer, 94
```

## Metric Dots Proof Object

```metric-dots
Draft, 20
Review, 68
Ship, 92
```

## Image Slot

- Image-aware layouts keep body text and image objects in separate regions.
- The renderer must preserve aspect ratio and avoid covering text.
- The catalog keeps the icon/image role restrained rather than filling blank space.
"""

README = """# Intro Deck Artifacts

This folder contains reusable MDPR-generated introduction decks.

- `mdpr-intro-refined.md`: reusable LLM-hint source. It is already compacted into semantic presentation text, but MDPR still owns final layout, colors, charts, and PPTX objects.
- `element-catalog-refined.md`: a bullet-style catalog of slide elements and object families supported by the current MDPR path.
- `theme-gallery/deck.pptx`: one PowerPoint deck that repeats the intro source across every built-in MDPR theme.
- `element-catalog/deck.pptx`: one PowerPoint deck that lists supported slide elements and proof-object families.
- `theme-gallery-contact-sheet.png` and `element-catalog-contact-sheet.png`: PowerPoint-rendered visual QA sheets.
- `validation-report.json`: slide counts, exported PNG counts, native chart-part counts, and basic rendered-content checks.

The LLM only prepares reusable bullet-style source wording. Runtime decisions remain deterministic MDPR behavior.
"""


def write_sources() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "mdpr-intro-refined.md").write_text(INTRO_MD, encoding="utf-8")
    (OUT / "element-catalog-refined.md").write_text(ELEMENTS_MD, encoding="utf-8")
    (OUT / "README.md").write_text(README, encoding="utf-8")
    (OUT / "mdpresent.config.yaml").write_text(
        "\n".join([
            'version: "1.0"',
            "deck:",
            "  language: en",
            "theme:",
            "  designPreset: tableau",
            "  colorCombination: split-complementary",
            "pptx:",
            "  designPreset: tableau",
            "  lockBackgroundToMaster: false",
            "",
        ]),
        encoding="utf-8",
    )


def run_mdpr(source: Path, out_dir: Path, *extra: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    command = [
        "node",
        str(CLI),
        "build",
        str(source),
        "--to",
        "pptx,html",
        "--out",
        str(out_dir),
        *extra,
    ]
    subprocess.run(command, cwd=ROOT, check=True)
    pptx = out_dir / "deck.pptx"
    if not pptx.exists():
        raise FileNotFoundError(pptx)
    return pptx


def export_with_powerpoint(pptx_path: Path, output_dir: Path, width: int = 1600, height: int = 900) -> list[Path]:
    import win32com.client  # type: ignore

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Open(str(pptx_path.resolve()), WithWindow=False)
        presentation.Export(str(output_dir.resolve()), "PNG", width, height)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()
    paths = sorted({path.resolve(): path for path in [*output_dir.glob("*.PNG"), *output_dir.glob("*.png")]}.values())
    paths = sorted(paths, key=slide_sort_key)
    if not paths:
        raise FileNotFoundError(f"PowerPoint did not export PNG files to {output_dir}")
    return paths


def slide_sort_key(path: Path) -> tuple[int, str]:
    match = re.search(r"(\d+)", path.stem)
    return (int(match.group(1)) if match else 10_000, path.name)


def make_contact_sheet(paths: list[Path], output: Path, columns: int = 5) -> dict[str, Any]:
    thumbs: list[Image.Image] = []
    thumb_w, thumb_h = 320, 180
    for path in paths:
        image = Image.open(path).convert("RGB")
        image.thumbnail((thumb_w, thumb_h), Image.LANCZOS)
        canvas = Image.new("RGB", (thumb_w, thumb_h), "white")
        canvas.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
        thumbs.append(canvas)

    rows = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + 26)), "white")
    draw = ImageDraw.Draw(sheet)
    for index, thumb in enumerate(thumbs):
        x = (index % columns) * thumb_w
        y = (index // columns) * (thumb_h + 26)
        sheet.paste(thumb, (x, y))
        draw.text((x + 8, y + thumb_h + 5), f"Slide {index + 1}", fill=(31, 41, 55))
    sheet.save(output)
    return {"path": str(output.relative_to(ROOT)), "slides": len(paths), "size": sheet.size}


def pptx_stats(path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
    return {
        "pptx": str(path.relative_to(ROOT)),
        "slideXmlCount": len([name for name in names if name.startswith("ppt/slides/slide") and name.endswith(".xml")]),
        "nativeChartParts": len([name for name in names if name.startswith("ppt/charts/chart") and name.endswith(".xml")]),
    }


def png_stats(paths: list[Path]) -> list[dict[str, Any]]:
    stats = []
    for path in paths:
        image = Image.open(path).convert("RGB")
        colors = image.getcolors(maxcolors=4_000_000) or []
        non_white = sum(count for count, color in colors if color != (255, 255, 255))
        stats.append({
            "file": str(path.relative_to(ROOT)),
            "size": image.size,
            "uniqueColors": len(colors),
            "nonWhitePixels": non_white,
            "hasContent": len(colors) > 20 and non_white > 20_000,
        })
    return stats


def main() -> None:
    if not CLI.exists():
        raise FileNotFoundError("MDPR CLI dist is missing. Build .cache/mdpr/packages/cli first.")

    write_sources()
    theme_pptx = run_mdpr(
        OUT / "mdpr-intro-refined.md",
        OUT / "theme-gallery",
        "--config",
        str(OUT / "mdpresent.config.yaml"),
        "--theme-gallery",
        ",".join(THEMES),
    )
    element_pptx = run_mdpr(
        OUT / "element-catalog-refined.md",
        OUT / "element-catalog",
        "--config",
        str(OUT / "mdpresent.config.yaml"),
    )

    theme_pngs = export_with_powerpoint(theme_pptx, OUT / "theme-gallery-powerpoint-export")
    element_pngs = export_with_powerpoint(element_pptx, OUT / "element-catalog-powerpoint-export")

    report = {
        "themes": THEMES,
        "sources": [
            str((OUT / "mdpr-intro-refined.md").relative_to(ROOT)),
            str((OUT / "element-catalog-refined.md").relative_to(ROOT)),
        ],
        "themeGallery": {
            **pptx_stats(theme_pptx),
            "exportedPngCount": len(theme_pngs),
            "contactSheet": make_contact_sheet(theme_pngs, OUT / "theme-gallery-contact-sheet.png", columns=5),
            "pngChecks": png_stats(theme_pngs),
        },
        "elementCatalog": {
            **pptx_stats(element_pptx),
            "exportedPngCount": len(element_pngs),
            "contactSheet": make_contact_sheet(element_pngs, OUT / "element-catalog-contact-sheet.png", columns=4),
            "pngChecks": png_stats(element_pngs),
        },
    }
    theme_slides_per_preset = report["themeGallery"]["slideXmlCount"] // len(THEMES)
    report["themeGallery"]["slidesPerTheme"] = theme_slides_per_preset
    report["ok"] = (
        report["themeGallery"]["slideXmlCount"] % len(THEMES) == 0
        and theme_slides_per_preset >= 5
        and report["themeGallery"]["exportedPngCount"] == report["themeGallery"]["slideXmlCount"]
        and report["elementCatalog"]["slideXmlCount"] >= 8
        and report["elementCatalog"]["nativeChartParts"] >= 1
        and all(item["hasContent"] for item in report["themeGallery"]["pngChecks"])
        and all(item["hasContent"] for item in report["elementCatalog"]["pngChecks"])
    )
    (OUT / "validation-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not report["ok"]:
        raise SystemExit(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
