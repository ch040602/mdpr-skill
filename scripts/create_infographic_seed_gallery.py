#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import math
import shutil
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
SVG = OUT / "infographic-seed-gallery.svg"
PPTX = OUT / "infographic-seed-gallery.pptx"
PNG = OUT / "infographic-seed-gallery.png"
REPORT = OUT / "infographic-seed-gallery-report.json"
W = 1400
H = 760
EXPORT_W = 2600
EXPORT_H = 1414

PALETTE = {
    "paper": "F7F2EA",
    "ink": "111827",
    "muted": "64748B",
    "line": "D8CCBC",
    "card": "FFFDF8",
    "teal": "14B8A6",
    "indigo": "818CF8",
    "rose": "BE123C",
    "amber": "F59E0B",
    "softTeal": "EAF7F3",
    "softIndigo": "F1F0FA",
    "softAmber": "FFF3DE",
    "softRose": "FFF1F2",
}

TEXT_BOUNDS: list[dict[str, Any]] = []
BOXES: dict[str, tuple[float, float, float, float]] = {}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def approx_width(value: str, size: int, weight: int = 400) -> float:
    return len(value) * size * (0.59 if weight >= 700 else 0.55)


def track_box(name: str, x: float, y: float, w: float, h: float) -> None:
    BOXES[name] = (x, y, w, h)


def text(parts: list[str], name: str, parent: str, x: float, y_mid: float, value: str, size: int, fill: str, weight: int = 400) -> None:
    TEXT_BOUNDS.append(
        {
            "name": name,
            "parent": parent,
            "x": x,
            "y": y_mid - size * 0.62,
            "w": approx_width(value, size, weight),
            "h": size * 1.25,
            "text": value,
            "fontSize": size,
        }
    )
    parts.append(
        f'<text id="{name}" x="{x:.1f}" y="{y_mid:.1f}" fill="#{fill}" '
        f'font-family="Inter, Segoe UI, Arial, sans-serif" font-size="{size}" '
        f'font-weight="{weight}" dominant-baseline="middle">{esc(value)}</text>'
    )


def multiline(parts: list[str], name: str, parent: str, x: float, y: float, lines: list[str], size: int, fill: str, weight: int = 400) -> None:
    for i, line in enumerate(lines):
        text(parts, f"{name}_{i}", parent, x, y + i * (size + 8), line, size, fill, weight)


def rect(parts: list[str], name: str, x: float, y: float, w: float, h: float, fill: str, stroke: str, rx: float = 18, sw: float = 1.4) -> None:
    track_box(name, x, y, w, h)
    parts.append(f'<rect id="{name}_shadow" x="{x + 3:.1f}" y="{y + 6:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="#0F172A" opacity="0.10"/>')
    parts.append(f'<rect id="{name}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="#{fill}" stroke="#{stroke}" stroke-width="{sw}"/>')


def arrow(parts: list[str], name: str, x1: float, y1: float, x2: float, y2: float, color: str, width: float = 3.0) -> None:
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length == 0:
        return
    ux = dx / length
    uy = dy / length
    head = 12
    line_x2 = x2 - ux * head
    line_y2 = y2 - uy * head
    parts.append(f'<path id="{name}" d="M{x1:.1f},{y1:.1f} L{line_x2:.1f},{line_y2:.1f}" fill="none" stroke="#{color}" stroke-width="{width}" stroke-linecap="round"/>')
    nx = -uy
    ny = ux
    p1 = (x2, y2)
    p2 = (x2 - ux * head + nx * head * 0.46, y2 - uy * head + ny * head * 0.46)
    p3 = (x2 - ux * head - nx * head * 0.46, y2 - uy * head - ny * head * 0.46)
    parts.append(f'<polygon id="{name}_head" points="{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}" fill="#{color}"/>')


def panel_header(parts: list[str], x: float, y: float, title: str, subtitle: str, index: str, color: str) -> None:
    parts.append(f'<circle cx="{x + 24:.1f}" cy="{y + 28:.1f}" r="16" fill="#{color}"/>')
    text(parts, f"panel_{index}_num", "", x + 18, y + 28, index, 15, "FFFFFF", 800)
    text(parts, f"panel_{index}_title", "", x + 52, y + 24, title, 22, PALETTE["ink"], 800)
    text(parts, f"panel_{index}_subtitle", "", x + 52, y + 52, subtitle, 13, PALETTE["muted"], 500)


def draw_cycle(parts: list[str], x: float, y: float, w: float, h: float) -> dict[str, Any]:
    rect(parts, "cycle_panel", x, y, w, h, PALETTE["card"], PALETTE["line"], 30)
    panel_header(parts, x + 24, y + 22, "Cycle Loop", "short labels, closed feedback", "1", PALETTE["teal"])
    cx, cy, rx, ry = x + w / 2, y + 205, 135, 96
    items = [("observe", "Observe", 4), ("adapt", "Adapt", 5), ("render", "Render", 4), ("verify", "Verify", 3)]
    points: list[tuple[float, float]] = []
    sizes: list[float] = []
    for i, (key, label, importance) in enumerate(items):
        angle = -math.pi / 2 + i * 2 * math.pi / len(items)
        points.append((cx + math.cos(angle) * rx, cy + math.sin(angle) * ry))
        sizes.append(94 if importance == 5 else 84)
    for i, start in enumerate(points):
        end = points[(i + 1) % len(points)]
        start_r = sizes[i] / 2
        end_r = sizes[(i + 1) % len(points)] / 2
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        length = math.hypot(dx, dy)
        ux = dx / length
        uy = dy / length
        arrow(
            parts,
            f"cycle_arrow_{i}",
            start[0] + ux * start_r,
            start[1] + uy * start_r,
            end[0] - ux * end_r,
            end[1] - uy * end_r,
            PALETTE["teal"],
            2.8,
        )
    for i, (key, label, importance) in enumerate(items):
        size = sizes[i]
        rect(parts, f"cycle_{key}", points[i][0] - size / 2, points[i][1] - size / 2, size, size, PALETTE["softRose"] if importance == 5 else PALETTE["softTeal"], PALETTE["rose"] if importance == 5 else PALETTE["teal"], size / 2, 1.8)
        text(parts, f"cycle_text_{i}", f"cycle_{key}", points[i][0] - approx_width(label, 13, 800) / 2, points[i][1], label, 13, PALETTE["ink"], 800)
    text(parts, "cycle_center_title", "cycle_panel", cx - 66, cy - 8, "importance", 14, PALETTE["muted"], 700)
    text(parts, "cycle_center_body", "cycle_panel", cx - 56, cy + 15, "sets entry", 18, PALETTE["ink"], 800)
    return {"family": "cycle-loop", "items": len(items), "maxImportance": 5}


def draw_sequence(parts: list[str], x: float, y: float, w: float, h: float) -> dict[str, Any]:
    rect(parts, "sequence_panel", x, y, w, h, PALETTE["card"], PALETTE["line"], 30)
    panel_header(parts, x + 24, y + 22, "Ordered Rail", "steps scale by importance", "2", PALETTE["amber"])
    rail_y = y + 190
    parts.append(f'<path id="sequence_rail" d="M{x + 75:.1f},{rail_y:.1f} H{x + w - 75:.1f}" stroke="#{PALETTE["ink"]}" stroke-width="5" stroke-linecap="round"/>')
    items = [("Split", 4), ("Hint", 2), ("Select", 5), ("Compose", 4), ("Export", 3)]
    for i, (label, importance) in enumerate(items):
        px = x + 75 + i * ((w - 150) / (len(items) - 1))
        r = 20 + importance * 2.8
        parts.append(f'<circle id="sequence_node_{i}" cx="{px:.1f}" cy="{rail_y:.1f}" r="{r:.1f}" fill="#{PALETTE["softRose"] if importance == 5 else PALETTE["softAmber"]}" stroke="#{PALETTE["rose"] if importance == 5 else PALETTE["amber"]}" stroke-width="2"/>')
        text(parts, f"sequence_num_{i}", "", px - 5, rail_y, str(i + 1), 14, PALETTE["ink"], 800)
        label_y = rail_y - 62 if i % 2 == 0 else rail_y + 63
        rect(parts, f"sequence_label_{i}", px - 54, label_y - 18, 108, 36, PALETTE["card"], "E5D9CA", 10, 1.0)
        text(parts, f"sequence_text_{i}", f"sequence_label_{i}", px - 31, label_y, label, 13, PALETTE["ink"], 800 if importance >= 4 else 600)
    return {"family": "ordered-rail", "items": len(items), "maxImportance": 5}


def draw_ranked(parts: list[str], x: float, y: float, w: float, h: float) -> dict[str, Any]:
    rect(parts, "ranked_panel", x, y, w, h, PALETTE["card"], PALETTE["line"], 30)
    panel_header(parts, x + 24, y + 22, "Ranked Stack", "long text gets a lead tile", "3", PALETTE["indigo"])
    rect(parts, "ranked_lead", x + 36, y + 118, 160, 190, PALETTE["softRose"], PALETTE["rose"], 24, 1.8)
    text(parts, "ranked_lead_kicker", "ranked_lead", x + 58, y + 154, "TOP INSIGHT", 12, PALETTE["rose"], 800)
    multiline(parts, "ranked_lead_text", "ranked_lead", x + 58, y + 190, ["Longer text", "receives", "larger slot"], 20, PALETTE["ink"], 800)
    rows = [("Coherent arrows", 4), ("Readable type floor", 4), ("Bounded labels", 3), ("Low-noise background", 2)]
    for i, (label, importance) in enumerate(rows):
        yy = y + 124 + i * 48
        rect(parts, f"ranked_row_{i}", x + 212, yy, 178, 38, PALETTE["softIndigo"] if importance >= 4 else PALETTE["card"], PALETTE["line"], 12, 1.0)
        parts.append(f'<rect x="{x + 212:.1f}" y="{yy + 8:.1f}" width="5" height="22" rx="2.5" fill="#{PALETTE["indigo"]}"/>')
        text(parts, f"ranked_row_num_{i}", f"ranked_row_{i}", x + 230, yy + 19, f"0{i + 2}", 11, PALETTE["muted"], 800)
        text(parts, f"ranked_row_label_{i}", f"ranked_row_{i}", x + 260, yy + 19, label, 12 if len(label) < 18 else 10, PALETTE["ink"], 800 if importance >= 4 else 600)
    return {"family": "ranked-stack", "items": len(rows) + 1, "maxImportance": 5}


def validate_layout() -> dict[str, Any]:
    overflow = []
    for item in TEXT_BOUNDS:
        parent = item["parent"]
        if parent in BOXES:
            x, y, w, h = BOXES[parent]
            if item["x"] < x + 8 or item["y"] < y + 8 or item["x"] + item["w"] > x + w - 8 or item["y"] + item["h"] > y + h - 8:
                overflow.append(item)
    return {"trackedTextBoxes": len(TEXT_BOUNDS), "trackedBoxes": len(BOXES), "overflowCount": len(overflow), "overflow": overflow, "ok": not overflow}


def validate_png(path: Path) -> dict[str, Any]:
    image = Image.open(path).convert("RGB")
    colors = image.getcolors(maxcolors=5_000_000) or []
    non_white = sum(count for count, color in colors if color != (255, 255, 255))
    return {"file": str(path.relative_to(ROOT)), "size": image.size, "uniqueColors": len(colors), "nonWhitePixels": non_white, "hasContent": len(colors) > 80 and non_white > 100_000}


def create_svg(path: Path) -> dict[str, Any]:
    TEXT_BOUNDS.clear()
    BOXES.clear()
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{EXPORT_W}" height="{EXPORT_H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
        '<title id="title">Infographic Seed Gallery</title>',
        '<desc id="desc">SVG gallery for cycle, sequence, and ranked list infographic seeds driven by text length and importance.</desc>',
        f'<rect width="{W}" height="{H}" fill="#{PALETTE["paper"]}"/>',
        f'<path d="M82 130 H1318 M82 610 H1318" stroke="#{PALETTE["line"]}" stroke-width="1.2" opacity="0.8"/>',
    ]
    text(parts, "title", "", 82, 62, "Infographic Seeds for Teaser-Grade Slides", 35, PALETTE["ink"], 800)
    text(parts, "subtitle", "", 82, 103, "Cycle, ordered, and ranked layouts are selected from item count, text length, relation, and importance.", 17, PALETTE["muted"], 500)
    summaries = [
        draw_cycle(parts, 82, 155, 390, 395),
        draw_sequence(parts, 505, 155, 390, 395),
        draw_ranked(parts, 928, 155, 390, 395),
    ]
    rect(parts, "policy_band", 82, 588, 1236, 92, PALETTE["card"], PALETTE["line"], 24)
    text(parts, "policy_title", "policy_band", 112, 625, "Selection policy", 18, PALETTE["ink"], 800)
    text(parts, "policy_body", "policy_band", 300, 625, "Short cyclical content gets an orbit; ordered steps get one rail; long or uneven importance gets a ranked stack.", 15, PALETTE["muted"], 500)
    text(parts, "policy_badge", "policy_band", 1132, 625, "importance -> scale", 15, PALETTE["rose"], 800)
    parts.append("</svg>")
    path.write_text("\n".join(parts) + "\n", encoding="utf-8")
    return {"families": summaries, "layoutValidation": validate_layout()}


def create_deck_from_svg(svg_path: Path, pptx_path: Path) -> None:
    import win32com.client  # type: ignore

    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Add(WithWindow=False)
        presentation.PageSetup.SlideWidth = 13.333 * 72
        presentation.PageSetup.SlideHeight = 7.25 * 72
        slide = presentation.Slides.Add(1, 12)
        slide.Shapes.AddPicture(str(svg_path.resolve()), False, True, 0, 0, presentation.PageSetup.SlideWidth, presentation.PageSetup.SlideHeight)
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
        presentation.Export(str(output_dir.resolve()), "PNG", EXPORT_W, EXPORT_H)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()
    candidates = sorted(output_dir.glob("*.PNG")) + sorted(output_dir.glob("*.png"))
    if not candidates:
        raise FileNotFoundError(f"PowerPoint did not export PNG files to {output_dir}")
    return candidates[0]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    svg_report = create_svg(SVG)
    create_deck_from_svg(SVG, PPTX)
    exported = export_with_powerpoint(PPTX, OUT / "infographic-seed-gallery-export")
    shutil.copyfile(exported, PNG)
    render = validate_png(PNG)
    report = {
        "svg": str(SVG.relative_to(ROOT)),
        "pptx": str(PPTX.relative_to(ROOT)),
        "png": str(PNG.relative_to(ROOT)),
        "renderValidation": render,
        **svg_report,
        "ok": render["hasContent"] and svg_report["layoutValidation"]["ok"],
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not report["ok"]:
        raise SystemExit(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
