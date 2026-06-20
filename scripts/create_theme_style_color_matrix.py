#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MDPR = ROOT / ".cache" / "mdpr"
OUT = ROOT / "artifacts" / "theme-style-color-matrix"
SOURCE_DIR = OUT / "source"
SOURCE_MD = SOURCE_DIR / "theme-style-color-matrix.md"

COMBOS: list[dict[str, str]] = [
    {
        "id": "simple-blue-analogous",
        "style": "simple",
        "color": "#2563EB",
        "harmony": "analogous",
        "role": "Minimal blue system for clean operational slides",
    },
    {
        "id": "minimalism-ink-mono",
        "style": "minimalism",
        "color": "#111827",
        "harmony": "monochromatic",
        "role": "Whitespace-first slides with thin rules and restrained emphasis",
    },
    {
        "id": "newmorphism-slate-analogous",
        "style": "newmorphism",
        "color": "#4F6F8F",
        "harmony": "analogous",
        "role": "Soft UI surfaces using same-tone panels and paired shadows",
    },
    {
        "id": "glass-violet-split",
        "style": "glass",
        "color": "#8A4FFF",
        "harmony": "split-complementary",
        "role": "Translucent proof surfaces with contrast accents",
    },
    {
        "id": "grid-red-complementary",
        "style": "grid",
        "color": "#DC2626",
        "harmony": "complementary",
        "role": "Swiss modular grid with restrained red accent",
    },
    {
        "id": "data-amber-mono",
        "style": "data",
        "color": "#F59E0B",
        "harmony": "monochromatic",
        "role": "Dark data-journalism page with dense proof rails",
    },
    {
        "id": "magazine-rust-triadic",
        "style": "magazine",
        "color": "#C2410C",
        "harmony": "triadic",
        "role": "Editorial magazine cover/page rhythm",
    },
    {
        "id": "executive-teal-complementary",
        "style": "executive",
        "color": "#0F766E",
        "harmony": "complementary",
        "role": "Business deck rhythm with a warm opposing accent",
    },
    {
        "id": "technical-green-mono",
        "style": "technical",
        "color": "#16A34A",
        "harmony": "monochromatic",
        "role": "Engineering/validation tone with brightness steps",
    },
    {
        "id": "dark-rose-complementary",
        "style": "dark",
        "color": "#E11D48",
        "harmony": "complementary",
        "role": "Dark proof deck with high-contrast emphasis",
    },
]


def write_source_markdown() -> None:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    rows = "\n".join(
        f"| {item['style']} | `{item['color']}` | {item['harmony']} | {item['role']} |"
        for item in COMBOS
    )
    SOURCE_MD.write_text(
        f"""# MDPR Theme Style and Color Matrix

## Theme Contract

> Decoration style and color seed are separate deterministic choices.

- **Decoration style**
  Controls surface grammar, shadow, density, and object treatment.
- **Color seed**
  Provides the main color; harmony rules derive chart, accent, and PowerPoint theme colors.
- **Visual validation**
  The build manifest records overflow, font floor, region count, and resolved design tokens.

## Pipeline and Object Routing

Markdown Source => Semantic IR => Rule Engine => Styled Deck IR => PPTX Output => Visual Check

- Style selection happens before region surfaces and proof-object rendering.
- Color derivation happens before charts, connectors, and PowerPoint theme slots.
- Text, tables, charts, icons, and connectors stay editable in the PPTX output.

## Numeric Proof Objects

```chart
labels: Parser, Layout, PPTX, Visual QA
Coverage: 91, 88, 94, 86
Change: 14, 22, 31, 18
```

The chart keeps one evidence object as the main proof while labels and theme colors remain coherent.

## Arc Ring Proof

```arc-ring
labels: Validated, Remaining
Coverage: 78, 22
```

Editable arc geometry uses theme accents.

## Table and Text Coherence

| Requirement | Rule | Visual Check |
| --- | --- | --- |
| Shape text | Middle anchor plus readable insets | No text touches a border |
| Table text | Header emphasis and row labels | Cells keep row grammar |
| Bullet markers | Marker and text share a centerline | No low or drifting glyphs |
| Color usage | Harmony palette only | Accent color marks real contrast |

## Decoration Selection Inputs

- **Constraint**
  Long text should use plain-safe or rail layouts instead of decorative cards.
- **Evidence**
  Important proof points may receive a contrast chip, but sibling objects keep one grammar.
- **Image need**
  Image sidecars are reserved only when the source contains or requires an image.
- **Density**
  Dense tables and code blocks reduce decoration before shrinking below the readable font floor.

## Theme Matrix

| Style | Main Color | Harmony | Intended Role |
| --- | --- | --- | --- |
{rows}

## Final Checks

- Build writes a design lock for the resolved style/color contract.
- Build writes a manifest with source hash, output list, diagnostics, and optional visual summary.
- Generated PPTX files are exported through PowerPoint to PNG previews for visual comparison.
""",
        encoding="utf-8",
    )


def run_build(combo: dict[str, str]) -> dict[str, Any]:
    combo_dir = OUT / combo["id"]
    if combo_dir.exists():
        shutil.rmtree(combo_dir)
    combo_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        shutil.which("npm.cmd") or shutil.which("npm") or "npm",
        "run",
        "cli",
        "--",
        "build",
        str(SOURCE_MD.resolve()),
        "--to",
        "pptx,html",
        "--out",
        str(combo_dir.resolve()),
        "--theme-style",
        combo["style"],
        "--theme-color",
        combo["color"],
        "--theme-harmony",
        combo["harmony"],
        "--visual",
    ]
    subprocess.run(cmd, cwd=MDPR, check=True)
    pptx_files = sorted(combo_dir.glob("*.pptx"))
    html_files = sorted(combo_dir.glob("*.html"))
    lock = combo_dir / "mdpresent-design-lock.json"
    manifest = combo_dir / "mdpresent-manifest.json"
    bounds = validate_pptx_bounds(pptx_files[0]) if pptx_files else {"ok": False, "violations": ["missing pptx"]}
    return {
        **combo,
        "dir": str(combo_dir.relative_to(ROOT)),
        "pptx": str(pptx_files[0].relative_to(ROOT)) if pptx_files else None,
        "html": str(html_files[0].relative_to(ROOT)) if html_files else None,
        "designLock": str(lock.relative_to(ROOT)) if lock.exists() else None,
        "manifest": str(manifest.relative_to(ROOT)) if manifest.exists() else None,
        "boundsValidation": bounds,
    }


def validate_pptx_bounds(pptx_path: Path) -> dict[str, Any]:
    import re

    tolerance = 9144
    violations: list[dict[str, Any]] = []
    with zipfile.ZipFile(pptx_path) as archive:
        presentation_xml = archive.read("ppt/presentation.xml").decode("utf-8", errors="ignore")
        size_match = re.search(r"<p:sldSz cx=\"(\d+)\" cy=\"(\d+)\"", presentation_xml)
        width = int(size_match.group(1)) if size_match else int(13.333 * 914400)
        height = int(size_match.group(2)) if size_match else int(7.5 * 914400)
        for name in archive.namelist():
            if not re.match(r"ppt/slides/slide\d+\.xml$", name):
                continue
            xml = archive.read(name).decode("utf-8", errors="ignore")
            for index, match in enumerate(re.finditer(r"<a:off x=\"(-?\d+)\" y=\"(-?\d+)\"/>\s*<a:ext cx=\"(\d+)\" cy=\"(\d+)\"/>", xml), 1):
                x, y, cx, cy = (int(value) for value in match.groups())
                if x < -tolerance or y < -tolerance or x + cx > width + tolerance or y + cy > height + tolerance:
                    violations.append({
                        "slide": name,
                        "index": index,
                        "x": x,
                        "y": y,
                        "cx": cx,
                        "cy": cy,
                    })
    return {
        "ok": not violations,
        "checkedPptx": str(pptx_path.relative_to(ROOT)),
        "slideSizeEmu": {"width": width, "height": height},
        "violations": violations[:20],
        "violationCount": len(violations),
    }


def export_powerpoint_previews(results: list[dict[str, Any]]) -> None:
    import win32com.client  # type: ignore

    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        for result in results:
            if not result["pptx"]:
                continue
            pptx = ROOT / result["pptx"]
            export_dir = OUT / result["id"] / "png"
            if export_dir.exists():
                shutil.rmtree(export_dir)
            export_dir.mkdir(parents=True, exist_ok=True)
            presentation = app.Presentations.Open(str(pptx.resolve()), WithWindow=False)
            presentation.Export(str(export_dir.resolve()), "PNG", 1600, 900)
            presentation.Close()
            presentation = None
            pngs = sorted({path.resolve(): path for path in list(export_dir.glob("*.PNG")) + list(export_dir.glob("*.png"))}.values())
            result["pngPreview"] = str(pngs[0].relative_to(ROOT)) if pngs else None
            proof = next((path for path in pngs if "6" in path.stem), None)
            result["pngProofPreview"] = str((proof or (pngs[0] if pngs else export_dir)).relative_to(ROOT)) if pngs else None
            result["pngSlideCount"] = len(pngs)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()


def make_contact_sheet(results: list[dict[str, Any]], preview_key: str, filename: str) -> dict[str, Any]:
    thumbs: list[tuple[dict[str, Any], Image.Image]] = []
    for result in results:
        preview = result.get(preview_key)
        if not preview:
            continue
        image = Image.open(ROOT / preview).convert("RGB")
        image.thumbnail((420, 236))
        thumbs.append((result, image.copy()))
    if not thumbs:
        return {"ok": False, "reason": "no previews"}

    font = ImageFont.load_default()
    cols = 4
    cell_w, cell_h = 380, 286
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (result, thumb) in enumerate(thumbs):
        thumb.thumbnail((340, 191))
        x = (index % cols) * cell_w + 20
        y = (index // cols) * cell_h + 16
        sheet.paste(thumb, (x, y))
        label = f"{result['style']} | {result['color']} | {result['harmony']}"
        draw.text((x, y + 204), label, fill=(17, 24, 39), font=font)
        draw.text((x, y + 224), result["role"][:62], fill=(71, 85, 105), font=font)

    out = OUT / filename
    sheet.save(out)
    return {
        "ok": True,
        "file": str(out.relative_to(ROOT)),
        "size": sheet.size,
        "previewCount": len(thumbs),
    }


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)
    write_source_markdown()
    results = [run_build(combo) for combo in COMBOS]
    export_powerpoint_previews(results)
    cover_contact_sheet = make_contact_sheet(results, "pngPreview", "theme-style-color-cover-contact-sheet.png")
    proof_contact_sheet = make_contact_sheet(results, "pngProofPreview", "theme-style-color-proof-contact-sheet.png")
    report = {
        "source": str(SOURCE_MD.relative_to(ROOT)),
        "comboCount": len(results),
        "combinations": results,
        "coverContactSheet": cover_contact_sheet,
        "proofContactSheet": proof_contact_sheet,
        "ok": len(results) == len(COMBOS) and cover_contact_sheet.get("ok") is True and proof_contact_sheet.get("ok") is True and all(item.get("pptx") and item.get("manifest") and item.get("designLock") and item.get("boundsValidation", {}).get("ok") for item in results),
    }
    report_path = OUT / "theme-style-color-report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not report["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
