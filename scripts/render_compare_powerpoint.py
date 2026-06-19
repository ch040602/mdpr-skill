#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageStat

from create_and_verify_pptx import PIXEL_SAMPLES, ROOT, OUT, main as create_and_verify


def export_with_powerpoint(pptx_path: Path, output_dir: Path) -> Path:
    import win32com.client  # type: ignore

    output_dir.mkdir(parents=True, exist_ok=True)
    app = win32com.client.DispatchEx("PowerPoint.Application")
    presentation = None
    try:
        app.Visible = 1
        presentation = app.Presentations.Open(str(pptx_path.resolve()), WithWindow=False)
        presentation.Export(str(output_dir.resolve()), "PNG", 1280, 720)
    finally:
        if presentation is not None:
            presentation.Close()
        app.Quit()

    candidates = sorted(output_dir.glob("*.PNG")) + sorted(output_dir.glob("*.png"))
    if not candidates:
        raise FileNotFoundError(f"PowerPoint did not export PNG files to {output_dir}")
    return candidates[0]


def compare_images(expected_path: Path, actual_path: Path) -> dict[str, Any]:
    expected = Image.open(expected_path).convert("RGB")
    actual = Image.open(actual_path).convert("RGB")
    if expected.size != actual.size:
        actual = actual.resize(expected.size)
    diff = ImageChops.difference(expected, actual)
    stat = ImageStat.Stat(diff)
    mean_abs = sum(stat.mean) / 3
    max_abs = max(channel[1] for channel in stat.extrema)
    changed_pixels = 0
    total_pixels = expected.size[0] * expected.size[1]
    diff_pixels = diff.load()
    for y in range(expected.size[1]):
        for x in range(expected.size[0]):
            if diff_pixels[x, y] != (0, 0, 0):
                changed_pixels += 1
    return {
        "expected": str(expected_path.relative_to(ROOT)),
        "actual": str(actual_path.relative_to(ROOT)),
        "size": expected.size,
        "meanAbsDiff": mean_abs,
        "maxAbsDiff": max_abs,
        "changedPixelRatio": changed_pixels / total_pixels,
        "comparisonOk": mean_abs <= 3.5 and max_abs <= 255,
    }


def sample_actual_render(actual_path: Path) -> list[dict[str, Any]]:
    image = Image.open(actual_path).convert("RGB")
    results = []
    for sample in PIXEL_SAMPLES:
        actual = image.getpixel(tuple(sample["point"]))
        expected = tuple(sample["expected"])
        ok = sum(abs(a - b) for a, b in zip(actual, expected)) <= 24
        results.append({**sample, "actualPowerPoint": actual, "ok": ok})
    return results


def main() -> None:
    create_and_verify()
    pptx_path = OUT / "design_components_z_order_validation.pptx"
    xml_png = OUT / "design_components_z_order_validation.png"
    export_dir = OUT / "powerpoint-export"
    actual_png = export_with_powerpoint(pptx_path, export_dir)
    stable_actual_png = OUT / "powerpoint_render.png"
    shutil.copyfile(actual_png, stable_actual_png)
    comparison = compare_images(xml_png, stable_actual_png)
    samples = sample_actual_render(stable_actual_png)
    report = {
        "pptx": str(pptx_path.relative_to(ROOT)),
        "xmlProofPng": str(xml_png.relative_to(ROOT)),
        "powerPointPng": str(stable_actual_png.relative_to(ROOT)),
        "powerPointRawExportPng": str(actual_png.relative_to(ROOT)),
        "imageComparison": comparison,
        "actualRenderPixelSamples": samples,
        "actualRenderOk": comparison["comparisonOk"] and all(item["ok"] for item in samples),
        "note": "This report uses Microsoft PowerPoint COM export for the actual rendered PNG, then compares it with the XML-derived visual proof and overlap sample colors.",
    }
    report_path = OUT / "powerpoint_render_compare.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not report["actualRenderOk"]:
        raise SystemExit(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
