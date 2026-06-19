#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
PPTX = OUT / "pipeline-overview.pptx"
PNG = OUT / "pipeline-overview.png"
REPORT = OUT / "pipeline-overview-report.json"


def rgb(hex_value: str) -> RGBColor:
    return RGBColor(*(int(hex_value[i:i + 2], 16) for i in (0, 2, 4)))


def shape(slide, name: str, kind: MSO_AUTO_SHAPE_TYPE, x: float, y: float, w: float, h: float, fill: str, line: str = "D7E1EE", radius_text: str | None = None):
    item = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    item.name = name
    item.fill.solid()
    item.fill.fore_color.rgb = rgb(fill)
    item.line.color.rgb = rgb(line)
    return item


def text(slide, name: str, x: float, y: float, w: float, h: float, value: str, size: int, color: str = "0F172A", bold: bool = False):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    box.name = name
    frame = box.text_frame
    frame.clear()
    frame.margin_left = 0
    frame.margin_right = 0
    frame.margin_top = 0
    frame.margin_bottom = 0
    frame.word_wrap = True
    p = frame.paragraphs[0]
    run = p.add_run()
    run.text = value
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = rgb(color)
    return box


def card(slide, name: str, x: float, y: float, w: float, h: float, title: str, lines: list[str], accent: str = "E2E8F0", border: str = "CBD5E1"):
    shape(slide, f"{name}_card", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, x, y, w, h, "F8FAFC", border)
    shape(slide, f"{name}_dot", MSO_AUTO_SHAPE_TYPE.OVAL, x + 0.16, y + 0.18, 0.18, 0.18, accent, accent)
    text(slide, f"{name}_title", x + 0.42, y + 0.14, w - 0.58, 0.24, title, 12, "111827", True)
    for idx, line in enumerate(lines):
        text(slide, f"{name}_line_{idx}", x + 0.22, y + 0.52 + idx * 0.21, w - 0.42, 0.18, line, 8, "526071")


def arrow(slide, name: str, x: float, y: float, w: float, color: str = "475569", dashed: bool = False):
    line = slide.shapes.add_connector(1, Inches(x), Inches(y), Inches(x + w), Inches(y))
    line.name = name
    line.line.color.rgb = rgb(color)
    line.line.width = Pt(1.8)
    line.line.end_arrowhead = True
    if dashed:
        line.line.dash_style = 4
    return line


def build_deck(path: Path) -> None:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.25)
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    shape(slide, "z00_background", MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, 13.333, 7.25, "F8FAFC", "F8FAFC")
    shape(slide, "z01_canvas", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 0.46, 0.82, 12.42, 5.92, "FFFFFF", "DDE6F3")

    text(slide, "title", 0.62, 0.28, 5.8, 0.38, "MDPR Design Components Pipeline", 24, "0F172A", True)
    text(slide, "subtitle", 0.63, 0.64, 8.0, 0.22, "LLM hints semantic intent only. Deterministic rules own design decisions and editable rendering.", 11, "475569")

    text(slide, "section_input", 0.78, 1.12, 2.2, 0.2, "INPUT AND STRUCTURE", 8, "64748B", True)
    text(slide, "section_rule", 5.02, 1.12, 3.0, 0.2, "RULE-BASED DETERMINISTIC BOUNDARY", 8, "15803D", True)
    text(slide, "section_output", 10.78, 1.12, 1.6, 0.2, "OUTPUTS", 8, "64748B", True)

    card(slide, "markdown", 0.82, 1.52, 1.65, 1.0, "Markdown", ["headings, lists,", "tables, code,", "images"], "CBD5E1")
    card(slide, "splitter", 2.86, 1.52, 1.82, 1.0, "MDPR Splitter", ["slides, elements,", "semantic structure,", "no visual choices"], "CBD5E1")
    card(slide, "ir", 5.06, 1.52, 1.86, 1.0, "Slide Element IR", ["content-only", "contract for rules"], "CBD5E1")
    arrow(slide, "arrow_markdown_splitter", 2.48, 2.02, 0.36)
    arrow(slide, "arrow_splitter_ir", 4.7, 2.02, 0.34)

    shape(slide, "llm_card", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 2.72, 3.12, 2.92, 1.14, "EFF6FF", "93C5FD")
    text(slide, "llm_title", 2.98, 3.34, 1.7, 0.24, "LLM Assistant", 13, "111827", True)
    text(slide, "llm_body", 2.98, 3.66, 2.2, 0.38, "Intent, grouping, and importance candidates.", 8, "526071")
    shape(slide, "llm_badge", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 4.56, 3.28, 0.78, 0.24, "2563EB", "2563EB")
    text(slide, "llm_badge_text", 4.72, 3.34, 0.48, 0.12, "hints", 8, "FFFFFF", True)
    text(slide, "llm_boundary", 2.98, 4.03, 2.25, 0.18, "No coordinates, colors, variants, or z-order.", 8, "64748B", True)
    arrow(slide, "hint_ir_llm", 5.98, 2.58, -0.78, "2563EB", True)
    arrow(slide, "hint_llm_rules", 5.64, 3.7, 0.7, "2563EB", True)

    shape(slide, "rule_boundary", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 6.84, 1.46, 3.48, 3.28, "EEF7F1", "86EFAC")
    text(slide, "rule_boundary_title", 7.12, 1.76, 2.72, 0.2, "Final design decisions happen here", 8, "15803D", True)
    card(slide, "features", 7.08, 2.06, 1.44, 0.72, "Features", ["density, mix", "size risk"], "86EFAC", "BBF7D0")
    card(slide, "rules", 8.66, 2.06, 1.44, 0.72, "Rules", ["profile, recipe", "variant"], "86EFAC", "BBF7D0")
    card(slide, "compose", 7.08, 3.28, 1.44, 0.72, "Compose", ["regions, boxes", "fit, overflow"], "86EFAC", "BBF7D0")
    card(slide, "decorate", 8.66, 3.28, 1.44, 0.72, "Decorate", ["type, radius", "shadow, effects"], "86EFAC", "BBF7D0")
    arrow(slide, "arrow_ir_rule", 6.92, 2.02, 0.28)
    arrow(slide, "rule_arrow_1", 8.52, 2.42, 0.14, "16A34A")
    arrow(slide, "rule_arrow_2", 9.38, 2.78, 0.0, "16A34A")
    shape(slide, "lint_pill", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 7.28, 4.26, 2.56, 0.26, "DCFCE7", "86EFAC")
    text(slide, "lint_text", 7.66, 4.34, 1.8, 0.1, "Coherence lint: one visual language", 8, "166534", True)

    card(slide, "styled_ir", 10.78, 1.84, 1.64, 0.9, "Styled Deck IR", ["renderer-neutral", "visual contract"], "CBD5E1")
    card(slide, "renderers", 10.78, 3.26, 1.64, 1.08, "Renderers", ["editable PPTX", "HTML and PDF", "visual validation"], "CBD5E1")
    arrow(slide, "arrow_rule_output", 10.32, 2.44, 0.42)
    arrow(slide, "arrow_ir_renderers", 11.46, 2.74, 0.0)

    shape(slide, "responsibility", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 0.84, 5.36, 11.6, 0.76, "F8FAFC", "D7E1EE")
    text(slide, "responsibility_title", 1.1, 5.58, 1.6, 0.18, "Responsibility split", 12, "111827", True)
    text(slide, "responsibility_body", 2.72, 5.56, 6.6, 0.28, "LLM: semantic hints only. Rules: selection, composition, decoration, coherence, readability. Renderers: editable objects and output verification.", 8, "526071")
    shape(slide, "font_badge", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 10.66, 5.54, 1.32, 0.26, "111827", "111827")
    text(slide, "font_badge_text", 10.84, 5.62, 0.98, 0.1, "font size >= 8pt", 8, "FFFFFF", True)

    prs.save(path)


def export_with_powerpoint(pptx_path: Path, output_dir: Path) -> Path:
    import win32com.client  # type: ignore

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Open(str(pptx_path.resolve()), WithWindow=False)
        presentation.Export(str(output_dir.resolve()), "PNG", 2400, 1305)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()
    candidates = sorted(output_dir.glob("*.PNG")) + sorted(output_dir.glob("*.png"))
    if not candidates:
        raise FileNotFoundError(f"PowerPoint did not export PNG files to {output_dir}")
    return candidates[0]


def validate_png(path: Path) -> dict[str, Any]:
    image = Image.open(path).convert("RGB")
    colors = image.getcolors(maxcolors=5_000_000) or []
    non_white = sum(count for count, color in colors if color != (255, 255, 255))
    return {
        "file": str(path.relative_to(ROOT)),
        "size": image.size,
        "uniqueColors": len(colors),
        "nonWhitePixels": non_white,
        "hasContent": len(colors) > 50 and non_white > 100_000,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    export_dir = OUT / "pipeline-overview-export"
    build_deck(PPTX)
    exported = export_with_powerpoint(PPTX, export_dir)
    shutil.copyfile(exported, PNG)
    render = validate_png(PNG)
    report = {
        "pptx": str(PPTX.relative_to(ROOT)),
        "png": str(PNG.relative_to(ROOT)),
        "powerPointRawExportPng": str(exported.relative_to(ROOT)),
        "renderValidation": render,
        "ok": render["hasContent"],
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not report["ok"]:
        raise SystemExit(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
