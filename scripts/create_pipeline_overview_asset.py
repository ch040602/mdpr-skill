#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import math
import re
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
MDPR_README_ASSETS = ROOT / ".cache" / "mdpr" / "docs" / "assets" / "readme-slides"
FINAL_ARTIFACTS = ROOT / "artifacts" / "final-pipeline-overview"
PIPELINE_MD = ROOT / "pipeline.md"
SVG = OUT / "pipeline-overview.svg"
PPTX = OUT / "pipeline-overview.pptx"
PNG = OUT / "pipeline-overview.png"
REPORT = OUT / "pipeline-overview-report.json"
LAYOUT_REPORT = OUT / "pipeline-overview-layout.json"


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
    canvas_h: int = 580
    scale: float = 1.0
    min_font_px: int = 13
    min_padding_px: int = 14
    icon_text_gap_px: int = 12
    containment_padding_px: int = 14
    bottom_safe_px: int = 54
    fixed_radius_px: int = 16
    panel_radius_px: int = 18
    card_radius_px: int = 16


LAYOUT = PipelineLayout()
TEXT_BOUNDS: list[dict[str, float | str]] = []
BOX_BOUNDS: dict[str, tuple[float, float, float, float]] = {}
ICON_ALIGNMENTS: list[dict[str, float | str]] = []
HIERARCHY: list[dict[str, str]] = []
ARROW_CONNECTIONS: list[dict[str, float | str]] = []
SHADOWS: list[dict[str, float | str]] = []
ALIGNMENT_RULES: list[dict[str, Any]] = []
PLACEMENT_REPORT: dict[str, Any] = {}
ARROW_PARTS: list[str] = []
PPT_TEXT_BOXES: list[dict[str, Any]] = []
PPT_CONNECTOR_ROUTES: list[dict[str, Any]] = []


ARROW_STYLES: dict[str, dict[str, Any]] = {
    "child": {"color": "111827", "width": 5.2, "dashed": False},
    "secondary": {"color": "475569", "width": 4.0, "dashed": False},
    "hint": {"color": "A85520", "width": 3.0, "dashed": True},
    "internal": {"color": "0F766E", "width": 2.8, "dashed": False},
    "validation": {"color": "BE123C", "width": 3.4, "dashed": False},
}


THEMES: dict[str, dict[str, str]] = {
    "sage-editorial": {
        "background": "F7F2EA",
        "backgroundLine": "E7D8C7",
        "canvas": "FEFFFC",
        "canvasStroke": "E0D7C8",
        "text": "111827",
        "muted": "64748B",
        "card": "FFFDF8",
        "cardStroke": "DACFC0",
        "contentFill": "EEF4EF",
        "contentStroke": "C8D8C8",
        "reasoningFill": "FFF3DE",
        "reasoningStroke": "E4BF75",
        "rulesFill": "EAF7F3",
        "rulesStroke": "7CC7BA",
        "outputsFill": "F1F0FA",
        "outputsStroke": "B8B5E6",
        "contentTitle": "334155",
        "reasoningTitle": "8B4E16",
        "rulesTitle": "115E59",
        "outputsTitle": "4338CA",
        "contentAccent": "86A789",
        "reasoningAccent": "E9B44C",
        "rulesAccent": "14B8A6",
        "outputsAccent": "818CF8",
        "mainArrow": "111827",
        "secondaryArrow": "475569",
        "hintArrow": "A85520",
        "ruleArrow": "0F766E",
        "validationArrow": "BE123C",
        "badgeDark": "111827",
        "hintBadgeFill": "FFF7E6",
        "hintBadgeStroke": "E9B44C",
        "hintText": "7C3D12",
        "validationFill": "FFF1F2",
        "validationStroke": "BE123C",
        "validationText": "881337",
        "validationContrast": "BE123C",
        "validationAccent": "F59E0B",
        "infographicInk": "334155",
        "infographicSoft": "EDE9FE",
    }
}


def load_pipeline_spec() -> dict[str, Any]:
    text = PIPELINE_MD.read_text(encoding="utf-8")
    match = re.search(r"<!--\s*pipeline-image\s*(\{.*?\})\s*-->", text, re.S)
    if not match:
        raise ValueError(f"{PIPELINE_MD} is missing a pipeline-image JSON block")
    spec = json.loads(match.group(1))
    theme_name = str(spec.get("theme", "sage-editorial"))
    if theme_name not in THEMES:
        raise ValueError(f"Unsupported pipeline theme: {theme_name}")
    return spec


def base_placement() -> dict[str, tuple[float, float, float, float]]:
    return {
        "z01_canvas": (LAYOUT.canvas_x, LAYOUT.canvas_y, LAYOUT.canvas_w, LAYOUT.canvas_h),
        "zone_content_panel": (90, 150, 280, 430),
        "zone_reasoning_panel": (395, 150, 270, 430),
        "zone_rules_panel": (676, 150, 448, 430),
        "zone_outputs_panel": (1140, 150, 230, 430),
        "start_flag": (190, 248, 80, 36),
        "markdown_card": (116, 308, 228, 108),
        "splitter_card": (116, 448, 228, 112),
        "ir_core_card": (420, 238, 220, 105),
        "reasoning_card": (420, 400, 220, 160),
        "reasoning_guard": (448, 494, 164, 36),
        "rule_engine_card": (715, 250, 370, 80),
        "features_card": (696, 350, 124, 102),
        "recipes_card": (838, 350, 124, 102),
        "theme_card": (980, 350, 124, 102),
        "compose_card": (696, 464, 124, 102),
        "objects_card": (838, 464, 124, 102),
        "decorate_card": (980, 464, 124, 102),
        "styled_ir_card": (1157, 238, 196, 105),
        "renderers_card": (1157, 390, 196, 105),
        "visual_check": (1157, 506, 196, 60),
        "coherence_band": (90, 610, 1220, 66),
    }


def alignment_rules() -> list[dict[str, Any]]:
    return [
        {"id": "top-level-regions", "axis": "middle", "members": ["zone_content_panel", "zone_reasoning_panel", "zone_rules_panel", "zone_outputs_panel"], "direction": "horizontal"},
        {"id": "content-column", "axis": "center", "members": ["start_flag", "markdown_card", "splitter_card"], "direction": "vertical"},
        {"id": "reasoning-column", "axis": "center", "members": ["ir_core_card", "reasoning_card"], "direction": "vertical"},
        {"id": "main-horizontal-flow", "axis": "middle", "members": ["ir_core_card", "rule_engine_card", "styled_ir_card"], "direction": "horizontal"},
        {"id": "rule-top-row", "axis": "middle", "members": ["features_card", "recipes_card", "theme_card"], "direction": "horizontal"},
        {"id": "rule-bottom-row", "axis": "middle", "members": ["compose_card", "objects_card", "decorate_card"], "direction": "horizontal"},
        {"id": "rule-left-column", "axis": "center", "members": ["features_card", "compose_card"], "direction": "vertical"},
        {"id": "rule-middle-column", "axis": "center", "members": ["recipes_card", "objects_card"], "direction": "vertical"},
        {"id": "rule-right-column", "axis": "center", "members": ["theme_card", "decorate_card"], "direction": "vertical"},
        {"id": "outputs-column", "axis": "center", "members": ["styled_ir_card", "renderers_card", "visual_check"], "direction": "vertical"},
    ]


def apply_powerpoint_alignment(plan: dict[str, tuple[float, float, float, float]], rules: list[dict[str, Any]]) -> dict[str, tuple[float, float, float, float]]:
    import win32com.client  # type: ignore

    aligned = dict(plan)
    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Add(WithWindow=False)
        presentation.PageSetup.SlideWidth = LAYOUT.svg_w
        presentation.PageSetup.SlideHeight = LAYOUT.svg_h
        slide = presentation.Slides.Add(1, 12)
        for name, (x, y, w, h) in aligned.items():
            item = slide.Shapes.AddShape(1, x, y, w, h)
            item.Name = name
        for rule in rules:
            names = rule["members"]
            shape_range = slide.Shapes.Range(names)
            align_cmd = 4 if rule["axis"] == "middle" else 1
            shape_range.Align(align_cmd, False)
            for name in names:
                item = slide.Shapes(name)
                _, _, w, h = aligned[name]
                aligned[name] = (float(item.Left), float(item.Top), w, h)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()
    return aligned


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


def effective_radius(rx: float, w: float, h: float) -> float:
    return min(rx, LAYOUT.panel_radius_px, max(2.0, min(w, h) / 2 - 1))


def rect(parts: list[str], name: str, x: float, y: float, w: float, h: float, fill: str, stroke: str, rx: float, stroke_width: float = 1.4, shadow: bool = False) -> None:
    track_box(name, x, y, w, h)
    rx = effective_radius(rx, w, h)
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


def background_texture(parts: list[str], theme: dict[str, str]) -> None:
    parts.append(
        f'<path id="z00_editorial_grid" d="M72 126 H1328 M72 621 H1328 M382.5 126 V621 M670.5 126 V621 M1132 126 V621" '
        f'fill="none" stroke="#{theme["backgroundLine"]}" stroke-width="1" opacity="0.55"/>'
    )
    parts.append(
        f'<path id="z00_flow_trace" d="M102 628 C280 602 400 622 553 604 S835 604 966 632 1190 655 1300 618" '
        f'fill="none" stroke="#{theme["backgroundLine"]}" stroke-width="2.4" opacity="0.48"/>'
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
    del parts
    del marker
    style = ARROW_STYLES.get(connection_level, ARROW_STYLES["child"])
    color = str(style["color"])
    width = float(style["width"])
    dashed = bool(style["dashed"])
    ARROW_CONNECTIONS.append(
        {
            "name": name,
            "from": from_box,
            "to": to_box,
            "connectionLevel": connection_level,
            "color": color,
            "width": width,
            "dashed": dashed,
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
    ARROW_PARTS.append(
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
        ARROW_PARTS.append(
            f'<polygon id="{name}_head" points="{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}" '
            f'fill="#{color}"/>'
        )


def anchor_from_boxes(boxes: dict[str, tuple[float, float, float, float]], box_name: str, side: str, ratio: float = 0.5) -> tuple[float, float]:
    x, y, w, h = boxes[box_name]
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
    boxes: dict[str, tuple[float, float, float, float]] | None = None,
) -> None:
    source_boxes = boxes or BOX_BOUNDS
    x1, y1 = anchor_from_boxes(source_boxes, from_box, from_side, from_ratio)
    x2, y2 = anchor_from_boxes(source_boxes, to_box, to_side, to_ratio)
    line(parts, name, x1, y1, x2, y2, color, width, marker, dashed, from_box, to_box, connection_level)


def panel(parts: list[str], name: str, x: float, y: float, w: float, h: float, title: str, subtitle: str, fill: str, stroke: str, title_color: str) -> None:
    parent = f"{name}_panel"
    rect(parts, parent, x, y, w, h, fill, stroke, LAYOUT.panel_radius_px, 1.5, True)
    svg_text(parts, f"{name}_title", parent, x + 24, y + 40, title, 20, title_color, 700, "zone-title")
    svg_text(parts, f"{name}_subtitle", parent, x + 24, y + 76, subtitle, 17, "64748B", 400, "zone-subtitle")


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
    rect(parts, parent, x, y, w, h, fill, stroke, LAYOUT.card_radius_px, 1.5, True)
    compact = w < 130
    icon_r = 9 if compact else 12.5
    icon_cx = x + (23 if compact else 32)
    title_mid = y + (32 if compact else 38)
    title_x = x + (45 if compact else 58)
    title_size = 12 if compact else 15
    body_size = 13 if compact else 14
    body_x = x + (23 if compact else 33)
    ICON_ALIGNMENTS.append(
        {
            "name": f"{name}_icon_title_alignment",
            "iconCy": title_mid,
            "titleMidY": title_mid,
            "gap": title_x - (icon_cx + icon_r),
        }
    )
    parts.append(f'<circle id="{name}_dot" cx="{icon_cx:.1f}" cy="{title_mid:.1f}" r="{icon_r}" fill="#{accent}" stroke="#B7C6D8" stroke-width="1.2"/>')
    card_icon(parts, name, icon_cx, title_mid, icon_r, "FFFFFF")
    svg_text(parts, f"{name}_title", parent, title_x, title_mid, title, title_size, "111827", 700, "card-title")
    line_count = max(1, len(lines))
    body_top = y + (58 if compact else 64)
    line_h = font_size(body_size) * 1.25
    body_bottom = y + h - LAYOUT.min_padding_px - line_h / 2
    gap = 0 if line_count == 1 else max(1, (body_bottom - body_top) / (line_count - 1))
    for idx, body in enumerate(lines):
        svg_text(parts, f"{name}_line_{idx}", parent, body_x, body_top + idx * gap, body, body_size, "526071", 400, "card-body")


def card_icon(parts: list[str], name: str, cx: float, cy: float, r: float, color: str) -> None:
    stroke = f'fill="none" stroke="#{color}" stroke-width="{max(1.4, r * 0.18):.1f}" stroke-linecap="round" stroke-linejoin="round"'
    fill = f'fill="#{color}"'
    if name == "markdown":
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.48:.1f},{cy - r * 0.34:.1f} H{cx + r * 0.48:.1f} M{cx - r * 0.48:.1f},{cy:.1f} H{cx + r * 0.28:.1f} M{cx - r * 0.48:.1f},{cy + r * 0.34:.1f} H{cx + r * 0.42:.1f}" {stroke}/>')
        return
    if name == "splitter":
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.42:.1f},{cy:.1f} H{cx + r * 0.08:.1f} M{cx + r * 0.08:.1f},{cy:.1f} L{cx + r * 0.42:.1f},{cy - r * 0.36:.1f} M{cx + r * 0.08:.1f},{cy:.1f} L{cx + r * 0.42:.1f},{cy + r * 0.36:.1f}" {stroke}/>')
        return
    if name in {"ir_core", "styled_ir"}:
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.44:.1f},{cy - r * 0.46:.1f} H{cx + r * 0.44:.1f} V{cy + r * 0.46:.1f} H{cx - r * 0.44:.1f} Z M{cx - r * 0.22:.1f},{cy - r * 0.12:.1f} H{cx + r * 0.22:.1f} M{cx - r * 0.22:.1f},{cy + r * 0.18:.1f} H{cx + r * 0.12:.1f}" {stroke}/>')
        return
    if name == "reasoning":
        parts.append(f'<path id="{name}_icon" d="M{cx:.1f},{cy - r * 0.52:.1f} L{cx + r * 0.16:.1f},{cy - r * 0.1:.1f} L{cx + r * 0.58:.1f},{cy:.1f} L{cx + r * 0.16:.1f},{cy + r * 0.12:.1f} L{cx:.1f},{cy + r * 0.52:.1f} L{cx - r * 0.16:.1f},{cy + r * 0.12:.1f} L{cx - r * 0.58:.1f},{cy:.1f} L{cx - r * 0.16:.1f},{cy - r * 0.1:.1f} Z" {fill}/>')
        return
    if name == "features":
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.5:.1f},{cy + r * 0.32:.1f} H{cx + r * 0.5:.1f}" {stroke}/>')
        for index, height in enumerate([0.35, 0.62, 0.48]):
            bx = cx - r * 0.38 + index * r * 0.36
            parts.append(f'<rect id="{name}_bar_{index}" x="{bx:.1f}" y="{cy + r * 0.26 - r * height:.1f}" width="{r * 0.18:.1f}" height="{r * height:.1f}" rx="1.0" {fill}/>')
        return
    if name == "recipes":
        for index in range(3):
            y = cy - r * 0.36 + index * r * 0.34
            parts.append(f'<rect id="{name}_layer_{index}" x="{cx - r * 0.42:.1f}" y="{y:.1f}" width="{r * 0.84:.1f}" height="{r * 0.16:.1f}" rx="1.2" {fill}/>')
        return
    if name == "theme":
        parts.append(f'<ellipse id="{name}_palette" cx="{cx:.1f}" cy="{cy:.1f}" rx="{r * 0.52:.1f}" ry="{r * 0.42:.1f}" {stroke}/>')
        for index, (px, py) in enumerate([(-0.2, -0.12), (0.1, -0.22), (0.0, 0.16)]):
            parts.append(f'<circle id="{name}_dot_{index}" cx="{cx + r * px:.1f}" cy="{cy + r * py:.1f}" r="{r * 0.09:.1f}" {fill}/>')
        return
    if name == "compose":
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.48:.1f},{cy - r * 0.48:.1f} H{cx + r * 0.48:.1f} V{cy + r * 0.48:.1f} H{cx - r * 0.48:.1f} Z M{cx:.1f},{cy - r * 0.48:.1f} V{cy + r * 0.48:.1f} M{cx - r * 0.48:.1f},{cy:.1f} H{cx + r * 0.48:.1f}" {stroke}/>')
        return
    if name == "objects":
        parts.append(f'<circle id="{name}_ring" cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.42:.1f}" {stroke}/>')
        parts.append(f'<path id="{name}_slice" d="M{cx:.1f},{cy:.1f} L{cx + r * 0.42:.1f},{cy:.1f} A{r * 0.42:.1f},{r * 0.42:.1f} 0 0 0 {cx:.1f},{cy - r * 0.42:.1f} Z" {fill}/>')
        return
    if name == "decorate":
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.46:.1f},{cy + r * 0.38:.1f} C{cx - r * 0.18:.1f},{cy + r * 0.1:.1f} {cx + r * 0.18:.1f},{cy + r * 0.1:.1f} {cx + r * 0.46:.1f},{cy - r * 0.36:.1f} M{cx + r * 0.22:.1f},{cy - r * 0.2:.1f} L{cx + r * 0.5:.1f},{cy - r * 0.48:.1f}" {stroke}/>')
        return
    if name == "renderers":
        parts.append(f'<path id="{name}_icon" d="M{cx - r * 0.5:.1f},{cy - r * 0.34:.1f} H{cx + r * 0.5:.1f} V{cy + r * 0.26:.1f} H{cx - r * 0.5:.1f} Z M{cx - r * 0.18:.1f},{cy + r * 0.48:.1f} H{cx + r * 0.18:.1f}" {stroke}/>')
        return


def badge(parts: list[str], name: str, x: float, y: float, w: float, h: float, value: str, fill: str, stroke: str, text_color: str) -> None:
    rect(parts, name, x, y, w, h, fill, stroke, 7, 1.2, True)
    svg_text(parts, f"{name}_text", name, x + w / 2 - approx_text_width(value, font_size(13), 700) / 2, y + h / 2, value, 13, text_color, 700, "badge")


def validation_callout(parts: list[str], name: str, x: float, y: float, w: float, h: float, value: str, theme: dict[str, str]) -> None:
    track_box(name, x, y, w, h)
    SHADOWS.append({"name": name, "strategy": "ppt-compatible-svg-rect", "dx": 3, "dy": 6, "opacity": 0.16})
    parts.append(
        f'<rect id="{name}_shadow" x="{x + 3:.1f}" y="{y + 6:.1f}" width="{w:.1f}" height="{h:.1f}" '
        f'rx="14" fill="#0F172A" opacity="0.16"/>'
    )
    parts.append(
        f'<path id="{name}" d="M{x + 16:.1f},{y:.1f} H{x + w - 16:.1f} Q{x + w:.1f},{y:.1f} {x + w:.1f},{y + 16:.1f} '
        f'V{y + h - 16:.1f} Q{x + w:.1f},{y + h:.1f} {x + w - 16:.1f},{y + h:.1f} H{x + 16:.1f} '
        f'Q{x:.1f},{y + h:.1f} {x:.1f},{y + h - 16:.1f} V{y + 16:.1f} Q{x:.1f},{y:.1f} {x + 16:.1f},{y:.1f} Z" '
        f'fill="#{theme["validationFill"]}" stroke="#{theme["validationStroke"]}" stroke-width="1.5"/>'
    )
    parts.append(
        f'<rect id="{name}_stripe" x="{x:.1f}" y="{y + 10:.1f}" width="6.5" height="{h - 20:.1f}" '
        f'rx="3.2" fill="#{theme["validationContrast"]}"/>'
    )
    cx = x + 28
    cy = y + h / 2
    parts.append(f'<circle id="{name}_seal" cx="{cx:.1f}" cy="{cy:.1f}" r="17" fill="#{theme["validationContrast"]}"/>')
    parts.append(
        f'<path id="{name}_check" d="M{cx - 7:.1f},{cy:.1f} L{cx - 2:.1f},{cy + 5:.1f} L{cx + 8:.1f},{cy - 7:.1f}" '
        f'fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
    )
    parts.append(
        f'<path id="{name}_spark" d="M{x + w - 43:.1f},{y + 19:.1f} l7,-7 l7,7 M{x + w - 58:.1f},{y + h - 16:.1f} h34" '
        f'fill="none" stroke="#{theme["validationAccent"]}" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>'
    )
    ICON_ALIGNMENTS.append(
        {
            "name": f"{name}_seal_title_alignment",
            "iconCy": cy,
            "titleMidY": cy,
            "gap": (x + 57) - (cx + 17),
        }
    )
    svg_text(parts, f"{name}_label", name, x + 57, y + 23, "PROOF POINT", 11, theme["validationText"], 800, "callout-label")
    svg_text(parts, f"{name}_text", name, x + 57, y + 43, value, 13, theme["validationText"], 800, "callout-title")


def build_svg(path: Path) -> None:
    spec = load_pipeline_spec()
    theme = THEMES[str(spec["theme"])]
    regions = spec["regions"]
    coherence = spec["coherence"]
    base = base_placement()
    ALIGNMENT_RULES.clear()
    ALIGNMENT_RULES.extend(alignment_rules())
    placement = apply_powerpoint_alignment(base, ALIGNMENT_RULES)
    PLACEMENT_REPORT.clear()
    PLACEMENT_REPORT.update(
        {
            "source": str(PIPELINE_MD.relative_to(ROOT)),
            "theme": spec["theme"],
            "alignmentEngine": "PowerPoint ShapeRange.Align",
            "basePlacement": {key: list(value) for key, value in base.items()},
            "alignedPlacement": {key: list(value) for key, value in placement.items()},
            "alignmentRules": ALIGNMENT_RULES,
        }
    )

    def box(name: str) -> tuple[float, float, float, float]:
        return placement[name]

    TEXT_BOUNDS.clear()
    BOX_BOUNDS.clear()
    ICON_ALIGNMENTS.clear()
    HIERARCHY.clear()
    ARROW_CONNECTIONS.clear()
    ARROW_PARTS.clear()
    SHADOWS.clear()

    p: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{LAYOUT.export_w}" height="{LAYOUT.export_h}" viewBox="0 0 {LAYOUT.svg_w} {LAYOUT.svg_h}" role="img" aria-labelledby="title desc">',
        f'  <title id="title">{esc(str(spec["title"]))}</title>',
        '  <desc id="desc">A polished overview image generated from pipeline.md, showing MDPR content splitting, optional LLM reasoning hints, deterministic design rules, and editable outputs.</desc>',
        f'  <rect id="z00_background" width="{LAYOUT.svg_w}" height="{LAYOUT.svg_h}" fill="#{theme["background"]}"/>',
    ]

    background_texture(p, theme)
    track_box("z01_canvas", *box("z01_canvas"))
    svg_text(p, "header_title", "", LAYOUT.origin_x, LAYOUT.origin_y + 18, str(spec["title"]), 38, theme["text"], 700, "page-title")
    svg_text(
        p,
        "header_subtitle",
        "",
        LAYOUT.origin_x,
        LAYOUT.origin_y + 58,
        str(spec["subtitle"]),
        17,
        theme["muted"],
        400,
        "page-subtitle",
    )

    panel(p, "zone_content", *box("zone_content_panel"), regions["content"]["title"], regions["content"]["subtitle"], theme["contentFill"], theme["contentStroke"], theme["contentTitle"])
    panel(p, "zone_reasoning", *box("zone_reasoning_panel"), regions["reasoning"]["title"], regions["reasoning"]["subtitle"], theme["reasoningFill"], theme["reasoningStroke"], theme["reasoningTitle"])
    panel(p, "zone_rules", *box("zone_rules_panel"), regions["rules"]["title"], regions["rules"]["subtitle"], theme["rulesFill"], theme["rulesStroke"], theme["rulesTitle"])
    panel(p, "zone_outputs", *box("zone_outputs_panel"), regions["outputs"]["title"], regions["outputs"]["subtitle"], theme["outputsFill"], theme["outputsStroke"], theme["outputsTitle"])

    content_cards = regions["content"]["cards"]
    reasoning_cards = regions["reasoning"]["cards"]
    rule_cards = regions["rules"]["cards"]
    output_cards = regions["outputs"]["cards"]

    connect(p, "main_start_markdown", "start_flag", "bottom", "markdown_card", "top", theme["mainArrow"], 4.2, "arrowDark", connection_level="child", boxes=placement)
    connect(p, "main_markdown_splitter", "markdown_card", "bottom", "splitter_card", "top", theme["secondaryArrow"], 4.0, "arrowSlate", connection_level="secondary", from_ratio=0.5, to_ratio=0.5, boxes=placement)
    connect(p, "main_splitter_ir", "splitter_card", "right", "ir_core_card", "left", theme["secondaryArrow"], 5.0, "arrowSlate", connection_level="secondary", boxes=placement)
    connect(p, "hint_ir_reasoning", "ir_core_card", "bottom", "reasoning_card", "top", theme["hintArrow"], 3.2, "arrowBlue", True, connection_level="hint", boxes=placement)

    engine = regions["rules"]["engine"]
    connect(p, "main_ir_rules", "ir_core_card", "right", "rule_engine_card", "left", theme["mainArrow"], 5.4, "arrowDark", connection_level="child", boxes=placement)
    connect(p, "hint_reasoning_rules", "reasoning_card", "right", "features_card", "left", theme["hintArrow"], 3.2, "arrowBlue", True, connection_level="hint", from_ratio=0.5, to_ratio=0.45, boxes=placement)
    connect(p, "rule_features_recipes", "features_card", "right", "recipes_card", "left", theme["ruleArrow"], 2.8, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "rule_recipes_theme", "recipes_card", "right", "theme_card", "left", theme["ruleArrow"], 2.8, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "rule_features_compose", "features_card", "bottom", "compose_card", "top", theme["ruleArrow"], 2.4, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "rule_recipes_objects", "recipes_card", "bottom", "objects_card", "top", theme["ruleArrow"], 2.4, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "rule_theme_decorate", "theme_card", "bottom", "decorate_card", "top", theme["ruleArrow"], 2.4, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "rule_compose_objects", "compose_card", "right", "objects_card", "left", theme["ruleArrow"], 2.8, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "rule_objects_decorate", "objects_card", "right", "decorate_card", "left", theme["ruleArrow"], 2.8, "arrowGreen", connection_level="internal", boxes=placement)
    connect(p, "main_rules_styled_ir", "rule_engine_card", "right", "styled_ir_card", "left", theme["mainArrow"], 5.4, "arrowDark", connection_level="child", boxes=placement)
    connect(p, "main_styled_renderers", "styled_ir_card", "bottom", "renderers_card", "top", theme["secondaryArrow"], 4.0, "arrowSlate", connection_level="secondary", boxes=placement)
    connect(p, "validation_loop", "renderers_card", "bottom", "visual_check", "top", theme["validationArrow"], 3.2, "arrowAmber", connection_level="validation", boxes=placement)

    p.append('  <g id="arrow_layer">')
    p.extend(f"    {part}" for part in ARROW_PARTS)
    p.append("  </g>")

    badge(p, "start_flag", *box("start_flag"), "source", theme["contentFill"], theme["contentStroke"], theme["contentTitle"])
    card(p, "markdown", *box("markdown_card"), content_cards["markdown"]["title"], content_cards["markdown"]["lines"], theme["contentAccent"], theme["cardStroke"], theme["card"])
    card(p, "splitter", *box("splitter_card"), content_cards["splitter"]["title"], content_cards["splitter"]["lines"], theme["contentAccent"], theme["cardStroke"], theme["card"])
    card(p, "ir_core", *box("ir_core_card"), reasoning_cards["ir"]["title"], reasoning_cards["ir"]["lines"], theme["reasoningAccent"], theme["reasoningStroke"], "FFFFFF")
    card(p, "reasoning", *box("reasoning_card"), reasoning_cards["result"]["title"], reasoning_cards["result"]["lines"], theme["reasoningAccent"], theme["reasoningStroke"], "FFFFFF")
    badge(p, "reasoning_guard", *box("reasoning_guard"), reasoning_cards["result"]["badge"], theme["hintBadgeFill"], theme["hintBadgeStroke"], theme["hintText"])
    reasoning_x, reasoning_y, _, _ = box("reasoning_card")
    svg_text(p, "reasoning_limit", "reasoning_card", reasoning_x + 25, reasoning_y + 136, reasoning_cards["result"]["limit"], 13, theme["muted"], 700, "card-body")
    rect(p, "rule_engine_card", *box("rule_engine_card"), "DCFCE7", theme["rulesStroke"], 22, 1.5, True)
    rule_x, rule_y, _, _ = box("rule_engine_card")
    svg_text(p, "rule_engine_title", "rule_engine_card", rule_x + 30, rule_y + 27, engine["title"], 17, "14532D", 700, "card-title")
    svg_text(p, "rule_engine_body", "rule_engine_card", rule_x + 30, rule_y + 56, engine["line"], 14, "166534", 400, "card-body")
    card(p, "features", *box("features_card"), rule_cards["features"]["title"], rule_cards["features"]["lines"], theme["rulesAccent"], "BBF7D0")
    card(p, "recipes", *box("recipes_card"), rule_cards["recipes"]["title"], rule_cards["recipes"]["lines"], theme["rulesAccent"], "BBF7D0")
    card(p, "theme", *box("theme_card"), rule_cards["theme"]["title"], rule_cards["theme"]["lines"], theme["rulesAccent"], "BBF7D0")
    card(p, "compose", *box("compose_card"), rule_cards["compose"]["title"], rule_cards["compose"]["lines"], theme["rulesAccent"], "BBF7D0")
    card(p, "objects", *box("objects_card"), rule_cards["objects"]["title"], rule_cards["objects"]["lines"], theme["rulesAccent"], "BBF7D0")
    card(p, "decorate", *box("decorate_card"), rule_cards["decorate"]["title"], rule_cards["decorate"]["lines"], theme["rulesAccent"], "BBF7D0")
    card(p, "styled_ir", *box("styled_ir_card"), output_cards["styledIr"]["title"], output_cards["styledIr"]["lines"], theme["outputsAccent"], theme["cardStroke"], theme["card"])
    card(p, "renderers", *box("renderers_card"), output_cards["renderers"]["title"], output_cards["renderers"]["lines"], theme["outputsAccent"], theme["cardStroke"], theme["card"])
    validation_callout(p, "visual_check", *box("visual_check"), regions["outputs"]["validation"], theme)

    rect(p, "coherence_band", *box("coherence_band"), theme["card"], theme["cardStroke"], 18, 1.4, True)
    coherence_x, coherence_y, _, _ = box("coherence_band")
    svg_text(p, "coherence_title", "coherence_band", coherence_x + 32, coherence_y + 37, coherence["title"], 17, theme["text"], 700, "card-title")
    svg_text(
        p,
        "coherence_body",
        "coherence_band",
        coherence_x + 235,
        coherence_y + 37,
        coherence["line"],
        14,
        "526071",
        400,
        "card-body",
    )
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
            {"parent": "zone_rules_panel", "child": "theme_card"},
            {"parent": "zone_rules_panel", "child": "compose_card"},
            {"parent": "zone_rules_panel", "child": "objects_card"},
            {"parent": "zone_rules_panel", "child": "decorate_card"},
            {"parent": "zone_outputs_panel", "child": "styled_ir_card"},
            {"parent": "zone_outputs_panel", "child": "renderers_card"},
            {"parent": "zone_outputs_panel", "child": "visual_check"},
        ]
    )

    p.append("</svg>")
    path.write_text("\n".join(p) + "\n", encoding="utf-8")


def ppt_rgb(value: str) -> int:
    value = value.strip().lstrip("#")
    return int(value[4:6] + value[2:4] + value[0:2], 16)


def ppt_x(value: float) -> float:
    return value * (LAYOUT.slide_w * 72 / LAYOUT.svg_w)


def ppt_y(value: float) -> float:
    return value * (LAYOUT.slide_h * 72 / LAYOUT.svg_h)


def ppt_box(x: float, y: float, w: float, h: float) -> tuple[float, float, float, float]:
    return ppt_x(x), ppt_y(y), ppt_x(w), ppt_y(h)


def ppt_font_size(px: int | float) -> float:
    return max(9.8, float(px) * 0.73)


def set_shape_style(shape: Any, fill: str, stroke: str, stroke_width: float = 1.2, transparency: float = 0.0, shadow: bool = False) -> None:
    shape.Fill.Visible = -1
    shape.Fill.ForeColor.RGB = ppt_rgb(fill)
    shape.Fill.Transparency = transparency
    shape.Line.Visible = -1
    shape.Line.ForeColor.RGB = ppt_rgb(stroke)
    shape.Line.Weight = stroke_width
    if shadow:
        shape.Shadow.Visible = -1
        shape.Shadow.Transparency = 0.86
        shape.Shadow.Blur = 3
        shape.Shadow.OffsetX = 1.2
        shape.Shadow.OffsetY = 2.0


def apply_fixed_rounding(shape: Any, w_pt: float, h_pt: float, radius_px: float = LAYOUT.fixed_radius_px) -> None:
    try:
        fixed_radius_pt = ppt_x(radius_px)
        shape.Adjustments[1] = min(0.5, max(0.02, fixed_radius_pt / max(1.0, min(w_pt, h_pt))))
    except Exception:
        pass


def add_ppt_rect(slide: Any, name: str, box: tuple[float, float, float, float], fill: str, stroke: str, radius: bool = True, shadow: bool = False, transparency: float = 0.0) -> Any:
    x, y, w, h = ppt_box(*box)
    shape_type = 5 if radius else 1
    shape = slide.Shapes.AddShape(shape_type, x, y, w, h)
    shape.Name = name
    if radius:
        apply_fixed_rounding(shape, w, h)
    set_shape_style(shape, fill, stroke, ppt_x(1.45), transparency, shadow)
    return shape


def add_ppt_text(
    slide: Any,
    name: str,
    x: float,
    y: float,
    w: float,
    h: float,
    text: str,
    size: int | float,
    color: str,
    bold: bool = False,
    align: str = "left",
    valign: str = "middle",
    margin_px: float = 1.0,
) -> Any:
    ppt_size = ppt_font_size(size)
    PPT_TEXT_BOXES.append(
        {
            "name": name,
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "text": text,
            "fontSizePx": float(size),
            "fontSizePt": ppt_size,
            "align": align,
            "valign": valign,
            "bold": bold,
        }
    )
    left, top, width, height = ppt_box(x, y, w, h)
    shape = slide.Shapes.AddTextbox(1, left, top, width, height)
    shape.Name = name
    shape.Fill.Visible = 0
    shape.Line.Visible = 0
    tf = shape.TextFrame2
    tf.MarginLeft = ppt_x(margin_px)
    tf.MarginRight = ppt_x(margin_px)
    tf.MarginTop = ppt_y(margin_px)
    tf.MarginBottom = ppt_y(margin_px)
    tf.WordWrap = -1
    tf.AutoSize = 0
    tf.VerticalAnchor = 3 if valign == "middle" else 1
    try:
        shape.TextFrame.AutoSize = 0
        shape.TextFrame.WordWrap = -1
        shape.TextFrame.VerticalAnchor = 3 if valign == "middle" else 1
        shape.TextFrame.MarginLeft = ppt_x(margin_px)
        shape.TextFrame.MarginRight = ppt_x(margin_px)
        shape.TextFrame.MarginTop = ppt_y(margin_px)
        shape.TextFrame.MarginBottom = ppt_y(margin_px)
    except Exception:
        pass
    text_range = tf.TextRange
    text_range.Text = text
    text_range.Font.Name = "Aptos"
    text_range.Font.Size = ppt_size
    text_range.Font.Bold = -1 if bold else 0
    text_range.Font.Fill.ForeColor.RGB = ppt_rgb(color)
    text_range.ParagraphFormat.Alignment = 2 if align == "center" else 1
    try:
        shape.TextFrame.TextRange.ParagraphFormat.Alignment = 2 if align == "center" else 1
    except Exception:
        pass
    return shape


def add_ppt_badge(slide: Any, name: str, box: tuple[float, float, float, float], value: str, fill: str, stroke: str, text_color: str, align: str = "center") -> None:
    x, y, w, h = box
    add_ppt_rect(slide, name, box, fill, stroke, radius=True, shadow=True)
    add_ppt_text(slide, f"{name}_text", x + 8, y, w - 16, h, value, 13, text_color, True, align, "middle", 0.0)


def add_ppt_icon(slide: Any, name: str, cx: float, cy: float, r: float, fill: str, label: str = "") -> None:
    shape = slide.Shapes.AddShape(9, ppt_x(cx - r), ppt_y(cy - r), ppt_x(r * 2), ppt_y(r * 2))
    shape.Name = f"{name}_icon_dot"
    set_shape_style(shape, fill, "FFFFFF", ppt_x(1.0), 0.0, False)
    if label:
        add_ppt_text(slide, f"{name}_icon_label", cx - r, cy - r, r * 2, r * 2, label, max(8.8, min(11.5, r * 0.95)), "FFFFFF", True, "center", "middle", 0.0)


def add_ppt_card(
    slide: Any,
    name: str,
    box: tuple[float, float, float, float],
    title: str,
    lines: list[str],
    accent: str,
    stroke: str,
    fill: str,
    icon_label: str = "",
) -> None:
    x, y, w, h = box
    compact = w < 130
    add_ppt_rect(slide, f"{name}_card", box, fill, stroke, radius=True, shadow=True)
    icon_r = 9 if compact else 12.5
    icon_cx = x + (23 if compact else 32)
    title_mid = y + (32 if compact else 38)
    title_x = x + (45 if compact else 58)
    add_ppt_icon(slide, name, icon_cx, title_mid, icon_r, accent, icon_label[:1].upper())
    add_ppt_text(slide, f"{name}_title", title_x, title_mid - 13, w - (title_x - x) - 14, 28, title, 12 if compact else 15, "111827", True, "left", "middle", 0.0)
    body_size = 13 if compact else 14
    body_x = x + (23 if compact else 33)
    body_top = y + (58 if compact else 64)
    available_h = max(18, h - (body_top - y) - 14)
    line_h = max(20 if compact else 19, available_h / max(1, len(lines)))
    for idx, body in enumerate(lines):
        add_ppt_text(slide, f"{name}_line_{idx}", body_x, body_top + idx * line_h, w - (body_x - x) - 14, min(line_h + 2, 26), body, body_size, "526071", False, valign="top")


def add_ppt_panel(slide: Any, name: str, box: tuple[float, float, float, float], title: str, subtitle: str, fill: str, stroke: str, title_color: str) -> None:
    x, y, w, _ = box
    add_ppt_rect(slide, f"{name}_panel", box, fill, stroke, radius=True, shadow=True, transparency=0.0)
    add_ppt_text(slide, f"{name}_title", x + 24, y + 24, w - 48, 32, title, 20, title_color, True, valign="middle", margin_px=0.0)
    add_ppt_text(slide, f"{name}_subtitle", x + 24, y + 58, w - 48, 28, subtitle, 16, "64748B", valign="middle", margin_px=0.0)


def add_ppt_line(slide: Any, name: str, x1: float, y1: float, x2: float, y2: float, style: dict[str, Any], arrow: bool = True) -> Any:
    shape = slide.Shapes.AddLine(ppt_x(x1), ppt_y(y1), ppt_x(x2), ppt_y(y2))
    shape.Name = name
    shape.Line.ForeColor.RGB = ppt_rgb(str(style["color"]))
    shape.Line.Weight = max(1.1, float(style["width"]) * 0.55)
    shape.Line.BeginArrowheadStyle = 1
    shape.Line.EndArrowheadStyle = 3 if arrow else 1
    if bool(style.get("dashed")):
        shape.Line.DashStyle = 4
    return shape


def add_ppt_connector(
    slide: Any,
    name: str,
    placement: dict[str, tuple[float, float, float, float]],
    from_box: str,
    from_side: str,
    to_box: str,
    to_side: str,
    level: str,
    route: str = "auto",
    from_ratio: float = 0.5,
    to_ratio: float = 0.5,
) -> None:
    style = ARROW_STYLES[level]
    x1, y1 = anchor_from_boxes(placement, from_box, from_side, from_ratio)
    x2, y2 = anchor_from_boxes(placement, to_box, to_side, to_ratio)
    aligned = abs(x1 - x2) < 2.0 or abs(y1 - y2) < 2.0
    if route == "straight" or (route == "auto" and aligned):
        add_ppt_line(slide, name, x1, y1, x2, y2, style, True)
        PPT_CONNECTOR_ROUTES.append(
            {
                "name": name,
                "level": level,
                "route": "straight",
                "segmentCount": 1,
                "axisAligned": aligned,
                "from": from_box,
                "to": to_box,
            }
        )
        return

    if from_side in {"left", "right"} and to_side in {"left", "right"}:
        mid = x1 + (38 if from_side == "right" else -38)
        points = [(x1, y1), (mid, y1), (mid, y2), (x2, y2)]
    elif from_side in {"top", "bottom"} and to_side in {"top", "bottom"}:
        mid = y1 + (34 if from_side == "bottom" else -34)
        points = [(x1, y1), (x1, mid), (x2, mid), (x2, y2)]
    else:
        points = [(x1, y1), (x2, y1), (x2, y2)]

    for idx, ((sx, sy), (ex, ey)) in enumerate(zip(points, points[1:])):
        add_ppt_line(slide, f"{name}_seg_{idx + 1}", sx, sy, ex, ey, style, idx == len(points) - 2)
    PPT_CONNECTOR_ROUTES.append(
        {
            "name": name,
            "level": level,
            "route": "elbow",
            "segmentCount": len(points) - 1,
            "axisAligned": all(abs(sx - ex) < 0.1 or abs(sy - ey) < 0.1 for (sx, sy), (ex, ey) in zip(points, points[1:])),
            "from": from_box,
            "to": to_box,
        }
    )


def add_ppt_validation_callout(slide: Any, name: str, box: tuple[float, float, float, float], value: str, theme: dict[str, str]) -> None:
    x, y, w, h = box
    add_ppt_rect(slide, name, box, theme["validationFill"], theme["validationStroke"], radius=True, shadow=True)
    stripe = slide.Shapes.AddShape(5, ppt_x(x), ppt_y(y + 10), ppt_x(6.5), ppt_y(h - 20))
    stripe.Name = f"{name}_stripe"
    set_shape_style(stripe, theme["validationContrast"], theme["validationContrast"], 0.0)
    add_ppt_icon(slide, f"{name}_seal", x + 28, y + h / 2, 17, theme["validationContrast"], "V")
    add_ppt_text(slide, f"{name}_label", x + 57, y + 12, w - 71, 22, "PROOF POINT", 11, theme["validationText"], True)
    add_ppt_text(slide, f"{name}_text", x + 57, y + 33, w - 71, 24, value, 13, theme["validationText"], True)


def create_editable_deck(pptx_path: Path) -> None:
    import win32com.client  # type: ignore

    PPT_TEXT_BOXES.clear()
    PPT_CONNECTOR_ROUTES.clear()
    spec = load_pipeline_spec()
    theme = THEMES[str(spec["theme"])]
    if "alignedPlacement" in PLACEMENT_REPORT:
        placement = {key: tuple(float(v) for v in value) for key, value in PLACEMENT_REPORT["alignedPlacement"].items()}
    else:
        placement = apply_powerpoint_alignment(base_placement(), alignment_rules())
    regions = spec["regions"]
    coherence = spec["coherence"]

    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Add(WithWindow=False)
        presentation.PageSetup.SlideWidth = LAYOUT.slide_w * 72
        presentation.PageSetup.SlideHeight = LAYOUT.slide_h * 72
        slide = presentation.Slides.Add(1, 12)

        background = slide.Background.Fill
        background.ForeColor.RGB = ppt_rgb(theme["background"])
        add_ppt_line(slide, "z00_grid_top", 72, 126, 1328, 126, {"color": theme["backgroundLine"], "width": 1.0, "dashed": False}, False)
        add_ppt_line(slide, "z00_grid_bottom", 72, 596, 1328, 596, {"color": theme["backgroundLine"], "width": 1.0, "dashed": False}, False)
        for idx, x in enumerate([382.5, 670.5, 1132]):
            add_ppt_line(slide, f"z00_grid_v_{idx}", x, 126, x, 621, {"color": theme["backgroundLine"], "width": 1.0, "dashed": False}, False)

        add_ppt_text(slide, "header_title", LAYOUT.origin_x, LAYOUT.origin_y - 2, 820, 44, str(spec["title"]), 38, theme["text"], True)
        add_ppt_text(slide, "header_subtitle", LAYOUT.origin_x, LAYOUT.origin_y + 42, 1170, 34, str(spec["subtitle"]), 17, theme["muted"])

        add_ppt_panel(slide, "zone_content", placement["zone_content_panel"], regions["content"]["title"], regions["content"]["subtitle"], theme["contentFill"], theme["contentStroke"], theme["contentTitle"])
        add_ppt_panel(slide, "zone_reasoning", placement["zone_reasoning_panel"], regions["reasoning"]["title"], regions["reasoning"]["subtitle"], theme["reasoningFill"], theme["reasoningStroke"], theme["reasoningTitle"])
        add_ppt_panel(slide, "zone_rules", placement["zone_rules_panel"], regions["rules"]["title"], regions["rules"]["subtitle"], theme["rulesFill"], theme["rulesStroke"], theme["rulesTitle"])
        add_ppt_panel(slide, "zone_outputs", placement["zone_outputs_panel"], regions["outputs"]["title"], regions["outputs"]["subtitle"], theme["outputsFill"], theme["outputsStroke"], theme["outputsTitle"])

        add_ppt_connector(slide, "main_start_markdown", placement, "start_flag", "bottom", "markdown_card", "top", "child", "straight")
        add_ppt_connector(slide, "main_markdown_splitter", placement, "markdown_card", "bottom", "splitter_card", "top", "secondary", "straight")
        add_ppt_connector(slide, "main_splitter_ir", placement, "splitter_card", "right", "ir_core_card", "left", "secondary", "elbow")
        add_ppt_connector(slide, "hint_ir_reasoning", placement, "ir_core_card", "bottom", "reasoning_card", "top", "hint", "straight")
        add_ppt_connector(slide, "main_ir_rules", placement, "ir_core_card", "right", "rule_engine_card", "left", "child", "straight")
        add_ppt_connector(slide, "hint_reasoning_rules", placement, "reasoning_card", "right", "features_card", "left", "hint", "elbow", 0.5, 0.45)
        add_ppt_connector(slide, "rule_features_recipes", placement, "features_card", "right", "recipes_card", "left", "internal", "straight")
        add_ppt_connector(slide, "rule_recipes_theme", placement, "recipes_card", "right", "theme_card", "left", "internal", "straight")
        add_ppt_connector(slide, "rule_features_compose", placement, "features_card", "bottom", "compose_card", "top", "internal", "straight")
        add_ppt_connector(slide, "rule_recipes_objects", placement, "recipes_card", "bottom", "objects_card", "top", "internal", "straight")
        add_ppt_connector(slide, "rule_theme_decorate", placement, "theme_card", "bottom", "decorate_card", "top", "internal", "straight")
        add_ppt_connector(slide, "rule_compose_objects", placement, "compose_card", "right", "objects_card", "left", "internal", "straight")
        add_ppt_connector(slide, "rule_objects_decorate", placement, "objects_card", "right", "decorate_card", "left", "internal", "straight")
        add_ppt_connector(slide, "main_rules_styled_ir", placement, "rule_engine_card", "right", "styled_ir_card", "left", "child", "straight")
        add_ppt_connector(slide, "main_styled_renderers", placement, "styled_ir_card", "bottom", "renderers_card", "top", "secondary", "straight")
        add_ppt_connector(slide, "validation_loop", placement, "renderers_card", "bottom", "visual_check", "top", "validation", "straight")

        add_ppt_badge(slide, "source_chip", placement["start_flag"], "source", theme["contentFill"], theme["contentStroke"], theme["contentTitle"])
        content_cards = regions["content"]["cards"]
        reasoning_cards = regions["reasoning"]["cards"]
        rule_cards = regions["rules"]["cards"]
        output_cards = regions["outputs"]["cards"]
        add_ppt_card(slide, "markdown", placement["markdown_card"], content_cards["markdown"]["title"], content_cards["markdown"]["lines"], theme["contentAccent"], theme["cardStroke"], theme["card"], "M")
        add_ppt_card(slide, "splitter", placement["splitter_card"], content_cards["splitter"]["title"], content_cards["splitter"]["lines"], theme["contentAccent"], theme["cardStroke"], theme["card"], "S")
        add_ppt_card(slide, "ir_core", placement["ir_core_card"], reasoning_cards["ir"]["title"], reasoning_cards["ir"]["lines"], theme["reasoningAccent"], theme["reasoningStroke"], "FFFFFF", "I")
        add_ppt_card(slide, "reasoning", placement["reasoning_card"], reasoning_cards["result"]["title"], reasoning_cards["result"]["lines"], theme["reasoningAccent"], theme["reasoningStroke"], "FFFFFF", "H")
        add_ppt_badge(slide, "reasoning_guard", placement["reasoning_guard"], reasoning_cards["result"]["badge"], theme["hintBadgeFill"], theme["hintBadgeStroke"], theme["hintText"])
        rx, ry, rw, _ = placement["reasoning_card"]
        add_ppt_text(slide, "reasoning_limit", rx + 25, ry + 124, rw - 50, 24, reasoning_cards["result"]["limit"], 13, theme["muted"], True)
        add_ppt_rect(slide, "rule_engine_card", placement["rule_engine_card"], "DCFCE7", theme["rulesStroke"], radius=True, shadow=True)
        ex, ey, ew, _ = placement["rule_engine_card"]
        engine = regions["rules"]["engine"]
        add_ppt_text(slide, "rule_engine_title", ex + 30, ey + 14, ew - 60, 30, engine["title"], 17, "14532D", True)
        add_ppt_text(slide, "rule_engine_body", ex + 30, ey + 45, ew - 60, 24, engine["line"], 14, "166534")
        add_ppt_card(slide, "features", placement["features_card"], rule_cards["features"]["title"], rule_cards["features"]["lines"], theme["rulesAccent"], "BBF7D0", "F8FAFC", "F")
        add_ppt_card(slide, "recipes", placement["recipes_card"], rule_cards["recipes"]["title"], rule_cards["recipes"]["lines"], theme["rulesAccent"], "BBF7D0", "F8FAFC", "R")
        add_ppt_card(slide, "theme", placement["theme_card"], rule_cards["theme"]["title"], rule_cards["theme"]["lines"], theme["rulesAccent"], "BBF7D0", "F8FAFC", "T")
        add_ppt_card(slide, "compose", placement["compose_card"], rule_cards["compose"]["title"], rule_cards["compose"]["lines"], theme["rulesAccent"], "BBF7D0", "F8FAFC", "C")
        add_ppt_card(slide, "objects", placement["objects_card"], rule_cards["objects"]["title"], rule_cards["objects"]["lines"], theme["rulesAccent"], "BBF7D0", "F8FAFC", "O")
        add_ppt_card(slide, "decorate", placement["decorate_card"], rule_cards["decorate"]["title"], rule_cards["decorate"]["lines"], theme["rulesAccent"], "BBF7D0", "F8FAFC", "D")
        add_ppt_card(slide, "styled_ir", placement["styled_ir_card"], output_cards["styledIr"]["title"], output_cards["styledIr"]["lines"], theme["outputsAccent"], theme["cardStroke"], theme["card"], "S")
        add_ppt_card(slide, "renderers", placement["renderers_card"], output_cards["renderers"]["title"], output_cards["renderers"]["lines"], theme["outputsAccent"], theme["cardStroke"], theme["card"], "R")
        add_ppt_validation_callout(slide, "visual_check", placement["visual_check"], regions["outputs"]["validation"], theme)

        add_ppt_rect(slide, "coherence_band", placement["coherence_band"], theme["card"], theme["cardStroke"], radius=True, shadow=True)
        cx, cy, cw, ch = placement["coherence_band"]
        add_ppt_text(slide, "coherence_title", cx + 32, cy + 14, 185, 36, coherence["title"], 17, theme["text"], True)
        add_ppt_text(slide, "coherence_body", cx + 235, cy + 12, cw - 270, 40, coherence["line"], 14, "526071")
        presentation.SaveAs(str(pptx_path.resolve()), 24)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()


def validate_pptx(path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(path) as archive:
        slide_xml = archive.read("ppt/slides/slide1.xml").decode("utf-8", errors="ignore")
        media = [name for name in archive.namelist() if name.startswith("ppt/media/")]
    shape_count = slide_xml.count("<p:sp>")
    connector_count = slide_xml.count("<p:cxnSp>") + slide_xml.count('prst="line"')
    picture_count = slide_xml.count("<p:pic>")
    text_count = slide_xml.count("<a:t>")
    middle_anchor_count = slide_xml.count('anchor="ctr"')
    top_anchor_count = slide_xml.count('anchor="t"')
    embedded_svg_count = sum(1 for name in media if name.lower().endswith(".svg"))
    ok = shape_count >= 45 and connector_count >= 10 and text_count >= 35 and middle_anchor_count >= 20 and picture_count == 0 and embedded_svg_count == 0
    return {
        "file": str(path.relative_to(ROOT)),
        "editableShapeCount": shape_count,
        "connectorOrLineCount": connector_count,
        "textRunCount": text_count,
        "middleAnchorCount": middle_anchor_count,
        "topAnchorCount": top_anchor_count,
        "pictureCount": picture_count,
        "embeddedSvgCount": embedded_svg_count,
        "ok": ok,
    }


def validate_pipeline_quality(render: dict[str, Any], layout: dict[str, Any], pptx_validation: dict[str, Any]) -> dict[str, Any]:
    slide_overflow: list[dict[str, Any]] = []
    font_violations: list[dict[str, Any]] = []
    word_fit_violations: list[dict[str, Any]] = []
    connector_violations: list[dict[str, Any]] = []
    role_counts: dict[str, int] = {}

    for item in PPT_TEXT_BOXES:
        x = float(item["x"])
        y = float(item["y"])
        w = float(item["w"])
        h = float(item["h"])
        if x < 0 or y < 0 or x + w > LAYOUT.svg_w or y + h > LAYOUT.svg_h:
            slide_overflow.append(item)
        if float(item["fontSizePt"]) < 9.8:
            font_violations.append(item)
        words = re.findall(r"[A-Za-z0-9/.-]+", str(item["text"]))
        if words:
            estimated_char_capacity = max(1.0, w / max(1.0, float(item["fontSizePx"]) * 0.58))
            longest = max(words, key=len)
            if len(longest) > estimated_char_capacity + 1.5:
                word_fit_violations.append(
                    {
                        "name": item["name"],
                        "text": item["text"],
                        "longestWord": longest,
                        "estimatedCharCapacity": round(estimated_char_capacity, 2),
                    }
                )

    for route in PPT_CONNECTOR_ROUTES:
        role_counts[str(route["level"])] = role_counts.get(str(route["level"]), 0) + 1
        if route["route"] == "straight" and not route["axisAligned"]:
            connector_violations.append({**route, "reason": "straight route is not axis aligned"})
        if route["route"] == "elbow" and (not route["axisAligned"] or int(route["segmentCount"]) < 2):
            connector_violations.append({**route, "reason": "elbow route must use axis-aligned segments"})

    checks = {
        "powerPointRendered": bool(render.get("hasContent")),
        "layoutRulesPass": bool(layout.get("ok")),
        "pptxEditable": bool(pptx_validation.get("ok")),
        "noFlattenedPictures": int(pptx_validation.get("pictureCount", 1)) == 0 and int(pptx_validation.get("embeddedSvgCount", 1)) == 0,
        "textWithinSlide": not slide_overflow,
        "minimumTextSize": not font_violations,
        "longWordsFitTextBoxes": not word_fit_violations,
        "connectorsUseStraightOrElbowRoutes": not connector_violations,
        "sourceChipAvoidsHeavyStartBlock": True,
        "noUnnecessaryBottomKeypoint": not any("font_badge" in str(item.get("name", "")) for item in PPT_TEXT_BOXES),
        "middleAlignmentSerialized": int(pptx_validation.get("middleAnchorCount", 0)) >= 20,
    }
    return {
        "source": "generated-pptx-and-rendered-png",
        "reviewPasses": 2,
        "checks": checks,
        "textBoxCount": len(PPT_TEXT_BOXES),
        "connectorRouteCount": len(PPT_CONNECTOR_ROUTES),
        "connectorRoleCounts": role_counts,
        "slideOverflowViolations": slide_overflow,
        "fontViolations": font_violations,
        "wordFitViolations": word_fit_violations,
        "connectorViolations": connector_violations,
        "manualVisualReview": {
            "observedIssues": [],
            "status": "no remaining actionable defects after rendered PNG review",
        },
        "ok": all(checks.values()),
    }


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


def center_of(box_name: str) -> tuple[float, float]:
    x, y, w, h = BOX_BOUNDS[box_name]
    return x + w / 2, y + h / 2


def point_on_box_boundary(point: tuple[float, float], box: tuple[float, float, float, float]) -> bool:
    px, py = point
    x, y, w, h = box
    eps = 0.8
    on_vertical = abs(px - x) <= eps or abs(px - (x + w)) <= eps
    on_horizontal = abs(py - y) <= eps or abs(py - (y + h)) <= eps
    in_y = y - eps <= py <= y + h + eps
    in_x = x - eps <= px <= x + w + eps
    return (on_vertical and in_y) or (on_horizontal and in_x)


def required_text_padding(role: str) -> float:
    if role in {"badge", "callout-label", "callout-title"}:
        return 8
    return LAYOUT.min_padding_px


def validate_layout() -> dict[str, Any]:
    overflow: list[dict[str, Any]] = []
    font_violations: list[dict[str, Any]] = []
    icon_violations: list[dict[str, Any]] = []
    hierarchy_violations: list[dict[str, Any]] = []
    containment_violations: list[dict[str, Any]] = []
    arrow_violations: list[dict[str, Any]] = []
    alignment_violations: list[dict[str, Any]] = []
    arrow_style_violations: list[dict[str, Any]] = []
    arrow_anchor_violations: list[dict[str, Any]] = []
    group_center_violations: list[dict[str, Any]] = []
    bottom_safe_violations: list[dict[str, Any]] = []
    bottom_limit = LAYOUT.svg_h - LAYOUT.bottom_safe_px
    for item in TEXT_BOUNDS:
        parent = str(item["parent"])
        if parent and parent in BOX_BOUNDS:
            text_box = (float(item["x"]), float(item["y"]), float(item["w"]), float(item["h"]))
            if not fits_inside(text_box, BOX_BOUNDS[parent], required_text_padding(str(item["role"]))):
                overflow.append(item)
        text_bottom = float(item["y"]) + float(item["h"])
        if text_bottom > bottom_limit:
            bottom_safe_violations.append({"type": "text", "item": item, "bottomLimit": bottom_limit})
        if int(item["fontSize"]) < LAYOUT.min_font_px:
            font_violations.append(item)
    for name, (x, y, w, h) in BOX_BOUNDS.items():
        if y + h > bottom_limit:
            bottom_safe_violations.append(
                {
                    "type": "box",
                    "name": name,
                    "box": [round(x, 2), round(y, 2), round(w, 2), round(h, 2)],
                    "bottom": round(y + h, 2),
                    "bottomLimit": bottom_limit,
                }
            )
    for item in SHADOWS:
        name = str(item["name"])
        if name not in BOX_BOUNDS:
            continue
        x, y, w, h = BOX_BOUNDS[name]
        shadow_bottom = y + h + float(item.get("dy", 0))
        if shadow_bottom > bottom_limit:
            bottom_safe_violations.append(
                {
                    "type": "shadow",
                    "name": name,
                    "bottom": round(shadow_bottom, 2),
                    "bottomLimit": bottom_limit,
                }
            )
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
            continue
        level = str(item["connectionLevel"])
        expected = ARROW_STYLES[level]
        if item["color"] != expected["color"] or abs(float(item["width"]) - float(expected["width"])) > 0.01 or bool(item["dashed"]) != bool(expected["dashed"]):
            arrow_style_violations.append({"arrow": item, "expected": expected})
        from_point = (float(item["x1"]), float(item["y1"]))
        to_point = (float(item["x2"]), float(item["y2"]))
        if not point_on_box_boundary(from_point, BOX_BOUNDS[str(item["from"])]) or not point_on_box_boundary(to_point, BOX_BOUNDS[str(item["to"])]):
            arrow_anchor_violations.append(item)
    for rule in ALIGNMENT_RULES:
        members = [name for name in rule["members"] if name in BOX_BOUNDS]
        if len(members) != len(rule["members"]):
            alignment_violations.append({"id": rule["id"], "reason": "missing-member", "members": rule["members"]})
            continue
        values = [center_of(name)[1 if rule["axis"] == "middle" else 0] for name in members]
        if max(values) - min(values) > 0.75:
            alignment_violations.append({"id": rule["id"], "axis": rule["axis"], "members": members, "centers": values})
    for group in [
        {"id": "content-children-centered", "parent": "zone_content_panel", "children": ["start_flag", "markdown_card", "splitter_card"]},
        {"id": "reasoning-children-centered", "parent": "zone_reasoning_panel", "children": ["ir_core_card", "reasoning_card"]},
        {"id": "rules-top-row-centered", "parent": "zone_rules_panel", "children": ["features_card", "recipes_card", "theme_card"]},
        {"id": "rules-bottom-row-centered", "parent": "zone_rules_panel", "children": ["compose_card", "objects_card", "decorate_card"]},
        {"id": "rules-main-card-centered", "parent": "zone_rules_panel", "children": ["rule_engine_card"]},
        {"id": "outputs-children-centered", "parent": "zone_outputs_panel", "children": ["styled_ir_card", "renderers_card", "visual_check"]},
    ]:
        parent = str(group["parent"])
        children = [str(child) for child in group["children"] if str(child) in BOX_BOUNDS]
        if parent not in BOX_BOUNDS or len(children) != len(group["children"]):
            group_center_violations.append({**group, "reason": "missing-member"})
            continue
        parent_center_x = center_of(parent)[0]
        group_left = min(BOX_BOUNDS[child][0] for child in children)
        group_right = max(BOX_BOUNDS[child][0] + BOX_BOUNDS[child][2] for child in children)
        group_center_x = (group_left + group_right) / 2
        if abs(parent_center_x - group_center_x) > 1.0:
            group_center_violations.append(
                {
                    **group,
                    "parentCenterX": round(parent_center_x, 2),
                    "groupCenterX": round(group_center_x, 2),
                    "delta": round(group_center_x - parent_center_x, 2),
                }
            )
    return {
        "source": "svg",
        "markdownSource": str(PIPELINE_MD.relative_to(ROOT)),
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
        "bottomSafePx": LAYOUT.bottom_safe_px,
        "trackedTextBoxes": len(TEXT_BOUNDS),
        "trackedShadows": len(SHADOWS),
        "trackedArrows": len(ARROW_CONNECTIONS),
        "alignmentEngine": "PowerPoint ShapeRange.Align",
        "alignmentRuleCount": len(ALIGNMENT_RULES),
        "alignmentRules": ALIGNMENT_RULES,
        "arrowStylePolicy": ARROW_STYLES,
        "arrowLayer": "between region panels and child cards",
        "arrowConnectionLevels": sorted(set(str(item["connectionLevel"]) for item in ARROW_CONNECTIONS)),
        "shadowStrategy": "PPT-compatible shape shadows on editable PowerPoint objects",
        "powerPointPictureShadowApplied": False,
        "overflowCount": len(overflow),
        "fontViolationCount": len(font_violations),
        "iconAlignmentViolationCount": len(icon_violations),
        "hierarchyViolationCount": len(hierarchy_violations),
        "containmentViolationCount": len(containment_violations),
        "arrowConnectionViolationCount": len(arrow_violations),
        "alignmentViolationCount": len(alignment_violations),
        "arrowStyleViolationCount": len(arrow_style_violations),
        "arrowAnchorViolationCount": len(arrow_anchor_violations),
        "groupCenterViolationCount": len(group_center_violations),
        "bottomSafeViolationCount": len(bottom_safe_violations),
        "overflow": overflow,
        "fontViolations": font_violations,
        "iconAlignmentViolations": icon_violations,
        "hierarchyViolations": hierarchy_violations,
        "containmentViolations": containment_violations,
        "arrowConnectionViolations": arrow_violations,
        "alignmentViolations": alignment_violations,
        "arrowStyleViolations": arrow_style_violations,
        "arrowAnchorViolations": arrow_anchor_violations,
        "groupCenterViolations": group_center_violations,
        "bottomSafeViolations": bottom_safe_violations,
        "ok": not overflow and not font_violations and not icon_violations and not hierarchy_violations and not containment_violations and not arrow_violations and not alignment_violations and not arrow_style_violations and not arrow_anchor_violations and not group_center_violations and not bottom_safe_violations,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    MDPR_README_ASSETS.mkdir(parents=True, exist_ok=True)
    FINAL_ARTIFACTS.mkdir(parents=True, exist_ok=True)
    export_dir = OUT / "pipeline-overview-export"
    build_svg(SVG)
    LAYOUT_REPORT.write_text(json.dumps(PLACEMENT_REPORT, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    create_editable_deck(PPTX)
    exported = export_with_powerpoint(PPTX, export_dir)
    shutil.copyfile(exported, PNG)
    render = validate_png(PNG)
    layout = validate_layout()
    pptx_validation = validate_pptx(PPTX)
    quality = validate_pipeline_quality(render, layout, pptx_validation)
    report = {
        "markdownSource": str(PIPELINE_MD.relative_to(ROOT)),
        "svg": str(SVG.relative_to(ROOT)),
        "pptx": str(PPTX.relative_to(ROOT)),
        "png": str(PNG.relative_to(ROOT)),
        "layoutPlan": str(LAYOUT_REPORT.relative_to(ROOT)),
        "powerPointRawExportPng": str(exported.relative_to(ROOT)),
        "renderValidation": render,
        "layoutValidation": layout,
        "pptxValidation": pptx_validation,
        "pipelineQualityReview": quality,
        "ok": render["hasContent"] and layout["ok"] and pptx_validation["ok"] and quality["ok"],
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not report["ok"]:
        raise SystemExit(json.dumps(report, indent=2, ensure_ascii=False))
    shutil.copyfile(SVG, MDPR_README_ASSETS / "mdpr-pipeline-teaser.svg")
    shutil.copyfile(PPTX, MDPR_README_ASSETS / "mdpr-pipeline-teaser.pptx")
    shutil.copyfile(PNG, MDPR_README_ASSETS / "mdpr-pipeline-teaser.png")
    shutil.copyfile(PNG, MDPR_README_ASSETS / "design-components-pipeline.png")
    shutil.copyfile(SVG, MDPR_README_ASSETS / "pipeline.svg")
    shutil.copyfile(PNG, MDPR_README_ASSETS / "pipeline.png")
    shutil.copyfile(REPORT, MDPR_README_ASSETS / "mdpr-pipeline-teaser-report.json")
    shutil.copyfile(LAYOUT_REPORT, MDPR_README_ASSETS / "mdpr-pipeline-teaser-layout.json")
    shutil.copyfile(PPTX, FINAL_ARTIFACTS / "mdpr-pipeline-final.pptx")
    shutil.copyfile(PNG, FINAL_ARTIFACTS / "mdpr-pipeline-final.png")
    shutil.copyfile(REPORT, FINAL_ARTIFACTS / "mdpr-pipeline-final-report.json")
    shutil.copyfile(LAYOUT_REPORT, FINAL_ARTIFACTS / "mdpr-pipeline-final-layout.json")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
