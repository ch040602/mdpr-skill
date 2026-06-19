#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import math
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
SVG = OUT / "pipeline-overview.svg"
PPTX = OUT / "pipeline-overview.pptx"
PNG = OUT / "pipeline-overview.png"
REPORT = OUT / "pipeline-overview-report.json"


@dataclass(frozen=True)
class PipelineLayout:
    slide_w: float = 13.333
    slide_h: float = 7.25
    svg_w: int = 1400
    svg_h: int = 760
    export_w: int = 2600
    export_h: int = 1414
    origin_x: int = 68
    origin_y: int = 48
    canvas_x: int = 55
    canvas_y: int = 112
    canvas_w: int = 1330
    canvas_h: int = 600
    scale: float = 1.0
    min_font_px: int = 13
    min_padding_px: int = 8
    icon_text_gap_px: int = 10
    containment_padding_px: int = 8


LAYOUT = PipelineLayout()
TEXT_BOUNDS: list[dict[str, float | str]] = []
BOX_BOUNDS: dict[str, tuple[float, float, float, float]] = {}
ICON_ALIGNMENTS: list[dict[str, float | str]] = []
HIERARCHY: list[dict[str, str]] = []
ARROW_CONNECTIONS: list[dict[str, float | str]] = []
SHADOWS: list[dict[str, float | str]] = []


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def font_size(size: int) -> int:
    return max(LAYOUT.min_font_px, round(size * LAYOUT.scale))


def approx_text_width(value: str, size: int, weight: int = 400) -> float:
    factor = 0.59 if weight >= 700 else 0.55
    return len(value) * size * factor


def fits_inside(inner: tuple[float, float, float, float], outer: tuple[float, float, float, float], padding: float = 0) -> bool:
    ix, iy, iw, ih = inner
    ox, oy, ow, oh = outer
    eps = 0.5
    return (
        ix + eps >= ox + padding
        and iy + eps >= oy + padding
        and ix + iw <= ox + ow - padding + eps
        and iy + ih <= oy + oh - padding + eps
    )


def track_box(name: str, x: float, y: float, w: float, h: float) -> None:
    BOX_BOUNDS[name] = (x, y, w, h)


def track_text(name: str, parent: str, x: float, y: float, w: float, h: float, value: str, size: int, role: str) -> None:
    TEXT_BOUNDS.append(
        {
            "name": name,
            "parent": parent,
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "fontSize": size,
            "text": value,
            "role": role,
        }
    )


def svg_text(
    parts: list[str],
    name: str,
    parent: str,
    x: float,
    y_mid: float,
    value: str,
    size: int,
    fill: str,
    weight: int = 400,
    role: str = "body",
) -> None:
    size = font_size(size)
    width = approx_text_width(value, size, weight)
    height = size * 1.25
    track_text(name, parent, x, y_mid - height / 2, width, height, value, size, role)
    parts.append(
        f'<text id="{name}" x="{x:.1f}" y="{y_mid:.1f}" fill="#{fill}" '
        f'font-family="Inter, Segoe UI, Arial, sans-serif" font-size="{size}" '
        f'font-weight="{weight}" dominant-baseline="middle">{esc(value)}</text>'
    )


def rect(parts: list[str], name: str, x: float, y: float, w: float, h: float, fill: str, stroke: str, rx: float, stroke_width: float = 1.4, shadow: bool = False) -> None:
    track_box(name, x, y, w, h)
    if shadow:
        SHADOWS.append({"name": name, "strategy": "ppt-compatible-svg-rect", "dx": 3, "dy": 6, "opacity": 0.12})
        parts.append(
            f'<rect id="{name}_shadow" x="{x + 3:.1f}" y="{y + 6:.1f}" width="{w:.1f}" height="{h:.1f}" '
            f'rx="{rx:.1f}" fill="#0F172A" opacity="0.12"/>'
        )
    parts.append(
        f'<rect id="{name}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
        f'rx="{rx:.1f}" fill="#{fill}" stroke="#{stroke}" stroke-width="{stroke_width}"/>'
        )


def line(
    parts: list[str],
    name: str,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: str,
    width: float,
    marker: str,
    dashed: bool = False,
    from_box: str = "",
    to_box: str = "",
    connection_level: str = "coordinate",
) -> None:
    del marker
    ARROW_CONNECTIONS.append(
        {
            "name": name,
            "from": from_box,
            "to": to_box,
            "connectionLevel": connection_level,
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
        }
    )
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length == 0:
        return
    ux = dx / length
    uy = dy / length
    arrow_len = min(max(11, width * 6), length * 0.42)
    arrow_w = arrow_len * 0.75
    line_x2 = x2 - ux * arrow_len * 0.82
    line_y2 = y2 - uy * arrow_len * 0.82
    dash = ' stroke-dasharray="14 12"' if dashed else ""
    parts.append(
        f'<path id="{name}" d="M{x1:.1f},{y1:.1f} L{line_x2:.1f},{line_y2:.1f}" fill="none" '
        f'stroke="#{color}" stroke-width="{width}" stroke-linecap="round" '
        f'stroke-linejoin="round"{dash}/>'
    )
    if length >= 16:
        bx = x2 - ux * arrow_len
        by = y2 - uy * arrow_len
        nx = -uy
        ny = ux
        p1 = (x2, y2)
        p2 = (bx + nx * arrow_w / 2, by + ny * arrow_w / 2)
        p3 = (bx - nx * arrow_w / 2, by - ny * arrow_w / 2)
        parts.append(
            f'<polygon id="{name}_head" points="{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}" '
            f'fill="#{color}"/>'
        )


def anchor(box_name: str, side: str, ratio: float = 0.5) -> tuple[float, float]:
    x, y, w, h = BOX_BOUNDS[box_name]
    if side == "left":
        return x, y + h * ratio
    if side == "right":
        return x + w, y + h * ratio
    if side == "top":
        return x + w * ratio, y
    if side == "bottom":
        return x + w * ratio, y + h
    raise ValueError(f"Unsupported side: {side}")


def connect(
    parts: list[str],
    name: str,
    from_box: str,
    from_side: str,
    to_box: str,
    to_side: str,
    color: str,
    width: float,
    marker: str,
    dashed: bool = False,
    connection_level: str = "child",
    from_ratio: float = 0.5,
    to_ratio: float = 0.5,
) -> None:
    x1, y1 = anchor(from_box, from_side, from_ratio)
    x2, y2 = anchor(to_box, to_side, to_ratio)
    line(parts, name, x1, y1, x2, y2, color, width, marker, dashed, from_box, to_box, connection_level)


def panel(parts: list[str], name: str, x: float, y: float, w: float, h: float, title: str, subtitle: str, fill: str, stroke: str, title_color: str) -> None:
    parent = f"{name}_panel"
    rect(parts, parent, x, y, w, h, fill, stroke, 42, 1.5, True)
    svg_text(parts, f"{name}_title", parent, x + 22, y + 42, title, 20, title_color, 700, "zone-title")
    svg_text(parts, f"{name}_subtitle", parent, x + 22, y + 78, subtitle, 17, "64748B", 400, "zone-subtitle")


def card(
    parts: list[str],
    name: str,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    lines: list[str],
    accent: str = "CBD5E1",
    stroke: str = "D7E1EE",
    fill: str = "F8FAFC",
) -> None:
    parent = f"{name}_card"
    rect(parts, parent, x, y, w, h, fill, stroke, 22, 1.5, True)
    icon_cx = x + 29
    title_mid = y + 37
    icon_r = 11
    title_x = x + 53
    ICON_ALIGNMENTS.append(
        {
            "name": f"{name}_icon_title_alignment",
            "iconCy": title_mid,
            "titleMidY": title_mid,
            "gap": title_x - (icon_cx + icon_r),
        }
    )
    parts.append(f'<circle id="{name}_dot" cx="{icon_cx:.1f}" cy="{title_mid:.1f}" r="{icon_r}" fill="#{accent}" stroke="#B7C6D8" stroke-width="1.2"/>')
    svg_text(parts, f"{name}_title", parent, title_x, title_mid, title, 16, "111827", 700, "card-title")
    line_count = max(1, len(lines))
    body_top = y + 70
    line_h = font_size(14) * 1.25
    body_bottom = y + h - LAYOUT.min_padding_px - line_h / 2
    gap = 0 if line_count == 1 else max(18, (body_bottom - body_top) / (line_count - 1))
    for idx, body in enumerate(lines):
        svg_text(parts, f"{name}_line_{idx}", parent, x + 29, body_top + idx * gap, body, 14, "526071", 400, "card-body")


def badge(parts: list[str], name: str, x: float, y: float, w: float, h: float, value: str, fill: str, stroke: str, text_color: str) -> None:
    rect(parts, name, x, y, w, h, fill, stroke, 7, 1.2, True)
    svg_text(parts, f"{name}_text", name, x + 22, y + h / 2 + 1, value, 13, text_color, 700, "badge")


def build_svg(path: Path) -> None:
    TEXT_BOUNDS.clear()
    BOX_BOUNDS.clear()
    ICON_ALIGNMENTS.clear()
    HIERARCHY.clear()
    ARROW_CONNECTIONS.clear()
    SHADOWS.clear()

    p: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{LAYOUT.export_w}" height="{LAYOUT.export_h}" viewBox="0 0 {LAYOUT.svg_w} {LAYOUT.svg_h}" role="img" aria-labelledby="title desc">',
        '  <title id="title">MDPR Design Components Pipeline</title>',
        '  <desc id="desc">A polished overview image showing MDPR content splitting, optional LLM reasoning hints, deterministic design rules, and editable outputs.</desc>',
        f'  <rect id="z00_background" width="{LAYOUT.svg_w}" height="{LAYOUT.svg_h}" fill="#F8FAFC"/>',
    ]

    rect(p, "z01_canvas", LAYOUT.canvas_x, LAYOUT.canvas_y, LAYOUT.canvas_w, LAYOUT.canvas_h, "FFFFFF", "DDE6F3", 84, 1.5, True)
    svg_text(p, "header_title", "", LAYOUT.origin_x, LAYOUT.origin_y + 18, "MDPR Design Components Pipeline", 38, "0F172A", 700, "page-title")
    svg_text(
        p,
        "header_subtitle",
        "",
        LAYOUT.origin_x,
        LAYOUT.origin_y + 58,
        "MDPR splits content. LLM reasoning supplies hints. Deterministic rules own layout, style, z-order, and editable rendering.",
        17,
        "475569",
        400,
        "page-subtitle",
    )

    panel(p, "zone_content", 90, 150, 280, 430, "1. Content Contract", "semantic structure only", "F8FAFC", "D7E1EE", "334155")
    panel(p, "zone_reasoning", 395, 150, 280, 430, "2. LLM Reasoning", "optional intent hints", "EFF6FF", "93C5FD", "1D4ED8")
    panel(p, "zone_rules", 700, 150, 395, 430, "3. Deterministic Design", "final visual choices", "EEF7F1", "86EFAC", "15803D")
    panel(p, "zone_outputs", 1120, 150, 250, 430, "4. Outputs", "PPTX, HTML, PDF", "F8FAFC", "D7E1EE", "334155")

    badge(p, "start_flag", 190, 246, 80, 34, "start", "111827", "111827", "FFFFFF")
    card(p, "markdown", 115, 306, 230, 105, "Markdown", ["text, tables, code", "images and notes"], "CBD5E1")
    card(p, "splitter", 115, 448, 230, 112, "MDPR Splitter", ["slide and object split", "no visual choices"], "CBD5E1")
    connect(p, "main_start_markdown", "start_flag", "bottom", "markdown_card", "top", "111827", 4.2, "arrowDark", connection_level="child")
    connect(p, "main_markdown_splitter", "markdown_card", "bottom", "splitter_card", "top", "475569", 4.0, "arrowSlate", connection_level="child", from_ratio=0.5, to_ratio=0.5)

    card(p, "ir_core", 425, 230, 220, 112, "Slide Element IR", ["content-only contract"], "CBD5E1", "93C5FD", "FFFFFF")
    card(p, "reasoning", 425, 390, 220, 170, "Reasoning Result", ["intent, grouping"], "BFDBFE", "93C5FD", "FFFFFF")
    badge(p, "reasoning_guard", 450, 486, 170, 34, "hints only", "DBEAFE", "93C5FD", "1D4ED8")
    svg_text(p, "reasoning_limit", "reasoning_card", 450, 530, "no coordinates or styles", 13, "64748B", 700, "card-body")
    connect(p, "main_splitter_ir", "splitter_card", "right", "ir_core_card", "left", "475569", 5.0, "arrowSlate", connection_level="child")
    connect(p, "hint_ir_reasoning", "ir_core_card", "bottom", "reasoning_card", "top", "2563EB", 3.2, "arrowBlue", True, connection_level="hint")

    rect(p, "rule_engine_card", 740, 245, 315, 88, "DCFCE7", "86EFAC", 22, 1.5, True)
    svg_text(p, "rule_engine_title", "rule_engine_card", 770, 275, "Rule Engine Boundary", 17, "14532D", 700, "card-title")
    svg_text(p, "rule_engine_body", "rule_engine_card", 770, 311, "recipes, variants, z-order", 14, "166534", 400, "card-body")
    card(p, "features", 735, 346, 145, 108, "Features", ["density, mix", "size risk"], "86EFAC", "BBF7D0")
    card(p, "recipes", 920, 346, 145, 108, "Recipes", ["profile match", "variant"], "86EFAC", "BBF7D0")
    card(p, "compose", 735, 458, 145, 108, "Compose", ["regions, fit", "overflow"], "86EFAC", "BBF7D0")
    card(p, "decorate", 920, 458, 145, 108, "Decorate", ["type, radius", "effects"], "86EFAC", "BBF7D0")
    connect(p, "main_ir_rules", "ir_core_card", "right", "rule_engine_card", "left", "111827", 5.4, "arrowDark", connection_level="child")
    connect(p, "hint_reasoning_rules", "reasoning_card", "right", "features_card", "left", "2563EB", 3.2, "arrowBlue", True, connection_level="hint", from_ratio=0.5, to_ratio=0.45)
    connect(p, "rule_features_recipes", "features_card", "right", "recipes_card", "left", "16A34A", 2.8, "arrowGreen", connection_level="internal")
    connect(p, "rule_features_compose", "features_card", "bottom", "compose_card", "top", "16A34A", 2.4, "arrowGreen", connection_level="internal")
    connect(p, "rule_recipes_decorate", "recipes_card", "bottom", "decorate_card", "top", "16A34A", 2.4, "arrowGreen", connection_level="internal")
    connect(p, "rule_compose_decorate", "compose_card", "right", "decorate_card", "left", "16A34A", 2.8, "arrowGreen", connection_level="internal")

    card(p, "styled_ir", 1145, 235, 200, 105, "Styled Deck IR", ["renderer-neutral", "visual contract"], "CBD5E1")
    card(p, "renderers", 1145, 390, 200, 105, "Renderers", ["editable PPTX", "HTML and PDF"], "CBD5E1")
    badge(p, "visual_check", 1145, 525, 200, 44, "visual validation", "FEF3C7", "F59E0B", "92400E")
    connect(p, "main_rules_styled_ir", "rule_engine_card", "right", "styled_ir_card", "left", "111827", 5.4, "arrowDark", connection_level="child")
    connect(p, "main_styled_renderers", "styled_ir_card", "bottom", "renderers_card", "top", "475569", 4.0, "arrowSlate", connection_level="child")
    connect(p, "validation_loop", "renderers_card", "bottom", "visual_check", "top", "F59E0B", 3.2, "arrowAmber", connection_level="validation")

    rect(p, "coherence_band", 90, 625, 1220, 72, "F8FAFC", "D7E1EE", 18, 1.4, True)
    svg_text(p, "coherence_title", "coherence_band", 122, 662, "Coherence checks", 17, "111827", 700, "card-title")
    svg_text(
        p,
        "coherence_body",
        "coherence_band",
        325,
        662,
        "Hierarchy-scaled type, centered icon labels, bounded text, consistent spacing, aligned starts, and readable minimum sizes.",
        14,
        "526071",
        400,
        "card-body",
    )
    badge(p, "font_badge", 1118, 646, 180, 34, "font scale by role", "111827", "111827", "FFFFFF")

    HIERARCHY.extend(
        [
            {"parent": "z01_canvas", "child": "zone_content_panel"},
            {"parent": "z01_canvas", "child": "zone_reasoning_panel"},
            {"parent": "z01_canvas", "child": "zone_rules_panel"},
            {"parent": "z01_canvas", "child": "zone_outputs_panel"},
            {"parent": "z01_canvas", "child": "coherence_band"},
            {"parent": "zone_content_panel", "child": "start_flag"},
            {"parent": "zone_content_panel", "child": "markdown_card"},
            {"parent": "zone_content_panel", "child": "splitter_card"},
            {"parent": "zone_reasoning_panel", "child": "ir_core_card"},
            {"parent": "zone_reasoning_panel", "child": "reasoning_card"},
            {"parent": "reasoning_card", "child": "reasoning_guard"},
            {"parent": "zone_rules_panel", "child": "rule_engine_card"},
            {"parent": "zone_rules_panel", "child": "features_card"},
            {"parent": "zone_rules_panel", "child": "recipes_card"},
            {"parent": "zone_rules_panel", "child": "compose_card"},
            {"parent": "zone_rules_panel", "child": "decorate_card"},
            {"parent": "zone_outputs_panel", "child": "styled_ir_card"},
            {"parent": "zone_outputs_panel", "child": "renderers_card"},
            {"parent": "zone_outputs_panel", "child": "visual_check"},
            {"parent": "coherence_band", "child": "font_badge"},
        ]
    )

    p.append("</svg>")
    path.write_text("\n".join(p) + "\n", encoding="utf-8")


def create_deck_from_svg(svg_path: Path, pptx_path: Path) -> None:
    import win32com.client  # type: ignore

    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Add(WithWindow=False)
        presentation.PageSetup.SlideWidth = LAYOUT.slide_w * 72
        presentation.PageSetup.SlideHeight = LAYOUT.slide_h * 72
        slide = presentation.Slides.Add(1, 12)
        picture = slide.Shapes.AddPicture(str(svg_path.resolve()), False, True, 0, 0, presentation.PageSetup.SlideWidth, presentation.PageSetup.SlideHeight)
        picture.Name = "pipeline_overview_svg"
        picture.Shadow.Visible = -1
        picture.Shadow.Transparency = 0.88
        picture.Shadow.Blur = 4
        picture.Shadow.OffsetX = 0
        picture.Shadow.OffsetY = 1.5
        presentation.SaveAs(str(pptx_path.resolve()), 24)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()


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


def texts_for_parent(parent: str) -> list[dict[str, float | str]]:
    return [item for item in TEXT_BOUNDS if item["parent"] == parent]


def validate_layout() -> dict[str, Any]:
    overflow: list[dict[str, Any]] = []
    font_violations: list[dict[str, Any]] = []
    icon_violations: list[dict[str, Any]] = []
    hierarchy_violations: list[dict[str, Any]] = []
    containment_violations: list[dict[str, Any]] = []
    arrow_violations: list[dict[str, Any]] = []
    for item in TEXT_BOUNDS:
        parent = str(item["parent"])
        if parent and parent in BOX_BOUNDS:
            text_box = (float(item["x"]), float(item["y"]), float(item["w"]), float(item["h"]))
            if not fits_inside(text_box, BOX_BOUNDS[parent], LAYOUT.min_padding_px):
                overflow.append(item)
        if int(item["fontSize"]) < LAYOUT.min_font_px:
            font_violations.append(item)
    for item in ICON_ALIGNMENTS:
        if abs(float(item["iconCy"]) - float(item["titleMidY"])) > 0.5 or float(item["gap"]) < LAYOUT.icon_text_gap_px:
            icon_violations.append(item)
    for relation in HIERARCHY:
        if relation["parent"] in BOX_BOUNDS and relation["child"] in BOX_BOUNDS:
            if not fits_inside(BOX_BOUNDS[relation["child"]], BOX_BOUNDS[relation["parent"]], LAYOUT.containment_padding_px):
                containment_violations.append(
                    {
                        **relation,
                        "parentBox": BOX_BOUNDS[relation["parent"]],
                        "childBox": BOX_BOUNDS[relation["child"]],
                    }
                )
        parent_fonts = [int(item["fontSize"]) for item in texts_for_parent(relation["parent"])]
        child_fonts = [int(item["fontSize"]) for item in texts_for_parent(relation["child"])]
        if parent_fonts and child_fonts and min(parent_fonts) < max(child_fonts):
            hierarchy_violations.append(
                {
                    **relation,
                    "parentMinFont": min(parent_fonts),
                    "childMaxFont": max(child_fonts),
                }
            )
    for item in ARROW_CONNECTIONS:
        if not item["from"] or not item["to"] or str(item["from"]) not in BOX_BOUNDS or str(item["to"]) not in BOX_BOUNDS:
            arrow_violations.append(item)
    return {
        "source": "svg",
        "svg": str(SVG.relative_to(ROOT)),
        "origin": {"x": LAYOUT.origin_x, "y": LAYOUT.origin_y},
        "slideSize": {"widthIn": LAYOUT.slide_w, "heightIn": LAYOUT.slide_h},
        "svgSize": {"width": LAYOUT.svg_w, "height": LAYOUT.svg_h},
        "exportSize": {"widthPx": LAYOUT.export_w, "heightPx": LAYOUT.export_h},
        "alignment": "left",
        "fontScale": LAYOUT.scale,
        "minFontSizePx": LAYOUT.min_font_px,
        "minPaddingPx": LAYOUT.min_padding_px,
        "iconTextGapPx": LAYOUT.icon_text_gap_px,
        "containmentPaddingPx": LAYOUT.containment_padding_px,
        "trackedTextBoxes": len(TEXT_BOUNDS),
        "trackedShadows": len(SHADOWS),
        "trackedArrows": len(ARROW_CONNECTIONS),
        "arrowConnectionLevels": sorted(set(str(item["connectionLevel"]) for item in ARROW_CONNECTIONS)),
        "shadowStrategy": "PPT-compatible SVG shadow rectangles plus PowerPoint picture shadow",
        "powerPointPictureShadowApplied": True,
        "overflowCount": len(overflow),
        "fontViolationCount": len(font_violations),
        "iconAlignmentViolationCount": len(icon_violations),
        "hierarchyViolationCount": len(hierarchy_violations),
        "containmentViolationCount": len(containment_violations),
        "arrowConnectionViolationCount": len(arrow_violations),
        "overflow": overflow,
        "fontViolations": font_violations,
        "iconAlignmentViolations": icon_violations,
        "hierarchyViolations": hierarchy_violations,
        "containmentViolations": containment_violations,
        "arrowConnectionViolations": arrow_violations,
        "ok": not overflow and not font_violations and not icon_violations and not hierarchy_violations and not containment_violations and not arrow_violations,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    export_dir = OUT / "pipeline-overview-export"
    build_svg(SVG)
    create_deck_from_svg(SVG, PPTX)
    exported = export_with_powerpoint(PPTX, export_dir)
    shutil.copyfile(exported, PNG)
    render = validate_png(PNG)
    layout = validate_layout()
    report = {
        "svg": str(SVG.relative_to(ROOT)),
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
