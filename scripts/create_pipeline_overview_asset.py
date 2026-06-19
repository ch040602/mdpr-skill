#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
PPTX = OUT / "pipeline-overview.pptx"
PNG = OUT / "pipeline-overview.png"
REPORT = OUT / "pipeline-overview-report.json"


@dataclass(frozen=True)
class PipelineLayout:
    slide_w: float = 13.333
    slide_h: float = 7.25
    export_w: int = 2600
    export_h: int = 1414
    origin_x: float = 0.64
    origin_y: float = 0.34
    canvas_x: float = 0.54
    canvas_y: float = 1.0
    canvas_w: float = 12.24
    canvas_h: float = 5.78
    scale: float = 1.0
    min_font_pt: int = 8


LAYOUT = PipelineLayout()
TEXT_BOUNDS: list[dict[str, float | str]] = []
BOX_BOUNDS: dict[str, tuple[float, float, float, float]] = {}


def rgb(hex_value: str) -> RGBColor:
    return RGBColor(*(int(hex_value[i:i + 2], 16) for i in (0, 2, 4)))


def font_size(size: int) -> int:
    return max(LAYOUT.min_font_pt, round(size * LAYOUT.scale))


def fits_inside(inner: tuple[float, float, float, float], outer: tuple[float, float, float, float]) -> bool:
    ix, iy, iw, ih = inner
    ox, oy, ow, oh = outer
    eps = 0.012
    return ix + eps >= ox and iy + eps >= oy and ix + iw <= ox + ow + eps and iy + ih <= oy + oh + eps


def shape(slide, name: str, kind: MSO_AUTO_SHAPE_TYPE, x: float, y: float, w: float, h: float, fill: str, line: str = "D7E1EE"):
    item = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    item.name = name
    item.fill.solid()
    item.fill.fore_color.rgb = rgb(fill)
    item.line.color.rgb = rgb(line)
    BOX_BOUNDS[name] = (x, y, w, h)
    return item


def text(slide, name: str, x: float, y: float, w: float, h: float, value: str, size: int, color: str = "0F172A", bold: bool = False, parent: str | None = None):
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
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = value
    run.font.size = Pt(font_size(size))
    run.font.bold = bold
    run.font.color.rgb = rgb(color)
    TEXT_BOUNDS.append({"name": name, "parent": parent or "", "x": x, "y": y, "w": w, "h": h, "fontSize": font_size(size), "text": value})
    return box


def card(slide, name: str, x: float, y: float, w: float, h: float, title: str, lines: list[str], accent: str = "E2E8F0", border: str = "CBD5E1"):
    parent = f"{name}_card"
    shape(slide, parent, MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, x, y, w, h, "F8FAFC", border)
    shape(slide, f"{name}_dot", MSO_AUTO_SHAPE_TYPE.OVAL, x + 0.16, y + 0.18, 0.18, 0.18, accent, accent)
    text(slide, f"{name}_title", x + 0.42, y + 0.13, w - 0.58, 0.22, title, 11, "111827", True, parent=parent)
    body_top = y + 0.44
    body_bottom = y + h - 0.12
    line_count = max(1, len(lines))
    line_gap = min(0.18, max(0.12, (body_bottom - body_top) / line_count))
    line_h = min(0.16, max(0.12, line_gap - 0.02))
    for idx, line in enumerate(lines):
        line_y = body_top + idx * line_gap
        text(slide, f"{name}_line_{idx}", x + 0.22, line_y, w - 0.42, line_h, line, 8, "526071", parent=parent)


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
    TEXT_BOUNDS.clear()
    BOX_BOUNDS.clear()
    prs = Presentation()
    prs.slide_width = Inches(LAYOUT.slide_w)
    prs.slide_height = Inches(LAYOUT.slide_h)
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    shape(slide, "z00_background", MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, LAYOUT.slide_w, LAYOUT.slide_h, "F8FAFC", "F8FAFC")
    shape(slide, "z01_canvas", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, LAYOUT.canvas_x, LAYOUT.canvas_y, LAYOUT.canvas_w, LAYOUT.canvas_h, "FFFFFF", "DDE6F3")

    text(slide, "title", LAYOUT.origin_x, LAYOUT.origin_y, 6.3, 0.4, "MDPR Design Components Pipeline", 22, "0F172A", True)
    text(slide, "subtitle", LAYOUT.origin_x, 0.68, 8.7, 0.24, "LLM hints semantic intent only. Deterministic rules own design decisions and editable rendering.", 10, "475569")

    text(slide, "section_input", 0.86, 1.3, 2.2, 0.22, "INPUT AND STRUCTURE", 8, "64748B", True)
    text(slide, "section_rule", 5.0, 1.3, 3.08, 0.22, "RULE-BASED DETERMINISTIC BOUNDARY", 8, "15803D", True)
    text(slide, "section_output", 10.64, 1.3, 1.6, 0.22, "OUTPUTS", 8, "64748B", True)

    card(slide, "markdown", 0.86, 1.7, 1.82, 1.1, "Markdown", ["headings and lists", "tables, code, images"], "CBD5E1")
    card(slide, "splitter", 3.08, 1.7, 2.05, 1.1, "MDPR Splitter", ["slides and elements", "semantic structure", "no visual choices"], "CBD5E1")
    card(slide, "ir", 5.52, 1.7, 2.02, 1.1, "Slide Element IR", ["content-only contract", "for downstream rules"], "CBD5E1")
    arrow(slide, "arrow_markdown_splitter", 2.68, 2.25, 0.38)
    arrow(slide, "arrow_splitter_ir", 5.14, 2.25, 0.34)

    shape(slide, "llm_card", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 2.86, 3.42, 3.12, 1.15, "EFF6FF", "93C5FD")
    text(slide, "llm_title", 3.12, 3.65, 1.72, 0.24, "LLM Assistant", 12, "111827", True, parent="llm_card")
    text(slide, "llm_body", 3.12, 3.96, 2.34, 0.22, "Intent, grouping, and importance candidates.", 8, "526071", False, parent="llm_card")
    shape(slide, "llm_badge", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 4.88, 3.58, 0.78, 0.24, "2563EB", "2563EB")
    text(slide, "llm_badge_text", 5.04, 3.64, 0.48, 0.12, "hints", 8, "FFFFFF", True, parent="llm_badge")
    text(slide, "llm_boundary", 3.12, 4.26, 2.5, 0.18, "No coordinates, colors, variants, or z-order.", 8, "64748B", True, parent="llm_card")
    arrow(slide, "hint_ir_llm", 6.36, 2.86, -0.86, "2563EB", True)
    arrow(slide, "hint_llm_rules", 5.98, 4.0, 0.64, "2563EB", True)

    shape(slide, "rule_boundary", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 6.9, 1.62, 3.64, 3.34, "EEF7F1", "86EFAC")
    text(slide, "rule_boundary_title", 7.2, 1.95, 2.96, 0.22, "Final design decisions happen here", 8, "15803D", True, parent="rule_boundary")
    card(slide, "features", 7.18, 2.34, 1.52, 0.78, "Features", ["density and mix", "size risk"], "86EFAC", "BBF7D0")
    card(slide, "rules", 8.9, 2.34, 1.38, 0.78, "Rules", ["profile, recipe", "variant"], "86EFAC", "BBF7D0")
    card(slide, "compose", 7.18, 3.6, 1.52, 0.78, "Compose", ["regions, boxes", "fit, overflow"], "86EFAC", "BBF7D0")
    card(slide, "decorate", 8.9, 3.6, 1.38, 0.78, "Decorate", ["type, radius", "shadow, effects"], "86EFAC", "BBF7D0")
    arrow(slide, "arrow_ir_rule", 7.54, 2.25, 0.34)
    arrow(slide, "rule_arrow_1", 8.7, 2.72, 0.18, "16A34A")
    arrow(slide, "rule_arrow_2", 9.58, 3.12, 0.0, "16A34A")
    shape(slide, "lint_pill", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 7.38, 4.58, 2.54, 0.26, "DCFCE7", "86EFAC")
    text(slide, "lint_text", 7.74, 4.66, 1.82, 0.1, "Coherence lint: one visual language", 8, "166534", True, parent="lint_pill")

    card(slide, "styled_ir", 10.92, 1.96, 1.62, 0.92, "Styled Deck IR", ["renderer-neutral", "visual contract"], "CBD5E1")
    card(slide, "renderers", 10.92, 3.48, 1.62, 1.1, "Renderers", ["editable PPTX", "HTML and PDF", "visual validation"], "CBD5E1")
    arrow(slide, "arrow_rule_output", 10.54, 2.58, 0.36)
    arrow(slide, "arrow_ir_renderers", 11.74, 2.88, 0.0)

    shape(slide, "responsibility", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 0.88, 5.58, 11.48, 0.72, "F8FAFC", "D7E1EE")
    text(slide, "responsibility_title", 1.12, 5.8, 1.56, 0.18, "Responsibility split", 11, "111827", True, parent="responsibility")
    text(slide, "responsibility_body", 2.74, 5.8, 6.9, 0.22, "LLM: semantic hints only. Rules: selection, composition, decoration, coherence, readability. Renderers: editable objects and output verification.", 8, "526071", False, parent="responsibility")
    shape(slide, "font_badge", MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, 10.72, 5.78, 1.28, 0.26, "111827", "111827")
    text(slide, "font_badge_text", 10.9, 5.86, 0.94, 0.1, "font size >= 8pt", 8, "FFFFFF", True, parent="font_badge")

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
        presentation.Export(str(output_dir.resolve()), "PNG", LAYOUT.export_w, LAYOUT.export_h)
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


def validate_layout() -> dict[str, Any]:
    overflow: list[dict[str, Any]] = []
    font_violations: list[dict[str, Any]] = []
    for item in TEXT_BOUNDS:
        parent = str(item["parent"])
        if parent and parent in BOX_BOUNDS:
            text_box = (float(item["x"]), float(item["y"]), float(item["w"]), float(item["h"]))
            if not fits_inside(text_box, BOX_BOUNDS[parent]):
                overflow.append(item)
        if int(item["fontSize"]) < LAYOUT.min_font_pt:
            font_violations.append(item)
    return {
        "origin": {"x": LAYOUT.origin_x, "y": LAYOUT.origin_y},
        "slideSize": {"widthIn": LAYOUT.slide_w, "heightIn": LAYOUT.slide_h},
        "exportSize": {"widthPx": LAYOUT.export_w, "heightPx": LAYOUT.export_h},
        "alignment": "left",
        "fontScale": LAYOUT.scale,
        "minFontSizePt": LAYOUT.min_font_pt,
        "trackedTextBoxes": len(TEXT_BOUNDS),
        "overflowCount": len(overflow),
        "fontViolationCount": len(font_violations),
        "overflow": overflow,
        "fontViolations": font_violations,
        "ok": not overflow and not font_violations,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    export_dir = OUT / "pipeline-overview-export"
    build_deck(PPTX)
    exported = export_with_powerpoint(PPTX, export_dir)
    shutil.copyfile(exported, PNG)
    render = validate_png(PNG)
    layout = validate_layout()
    report = {
        "pptx": str(PPTX.relative_to(ROOT)),
        "png": str(PNG.relative_to(ROOT)),
        "powerPointRawExportPng": str(exported.relative_to(ROOT)),
        "renderValidation": render,
        "layoutValidation": layout,
        "ok": render["hasContent"] and layout["ok"],
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not report["ok"]:
        raise SystemExit(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
