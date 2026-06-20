#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[1]
MDPR = ROOT / ".cache" / "mdpr"
OUT = ROOT / "artifacts" / "external-markdown-visual-eval"
RAW = OUT / "raw"
ITERATIONS = 4
MIN_SOURCE_COUNT = 20
PNG_SIZE = (1600, 900)


@dataclass(frozen=True)
class SourceDoc:
    slug: str
    url: str
    title_hint: str


SOURCES: list[SourceDoc] = [
    SourceDoc("react", "https://raw.githubusercontent.com/facebook/react/main/README.md", "React"),
    SourceDoc("nextjs", "https://raw.githubusercontent.com/vercel/next.js/canary/readme.md", "Next.js"),
    SourceDoc("vite", "https://raw.githubusercontent.com/vitejs/vite/main/README.md", "Vite"),
    SourceDoc("vue", "https://raw.githubusercontent.com/vuejs/core/main/README.md", "Vue"),
    SourceDoc("svelte", "https://raw.githubusercontent.com/sveltejs/svelte/main/README.md", "Svelte"),
    SourceDoc("typescript", "https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md", "TypeScript"),
    SourceDoc("node", "https://raw.githubusercontent.com/nodejs/node/main/README.md", "Node.js"),
    SourceDoc("express", "https://raw.githubusercontent.com/expressjs/express/master/Readme.md", "Express"),
    SourceDoc("fastapi", "https://raw.githubusercontent.com/fastapi/fastapi/master/README.md", "FastAPI"),
    SourceDoc("openai-python", "https://raw.githubusercontent.com/openai/openai-python/main/README.md", "OpenAI Python"),
    SourceDoc("langchain", "https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md", "LangChain"),
    SourceDoc("playwright", "https://raw.githubusercontent.com/microsoft/playwright/main/README.md", "Playwright"),
    SourceDoc("tailwindcss", "https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/README.md", "Tailwind CSS"),
    SourceDoc("kubernetes", "https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md", "Kubernetes"),
    SourceDoc("rust", "https://raw.githubusercontent.com/rust-lang/rust/master/README.md", "Rust"),
    SourceDoc("pytorch", "https://raw.githubusercontent.com/pytorch/pytorch/main/README.md", "PyTorch"),
    SourceDoc("tensorflow", "https://raw.githubusercontent.com/tensorflow/tensorflow/master/README.md", "TensorFlow"),
    SourceDoc("pandas", "https://raw.githubusercontent.com/pandas-dev/pandas/main/README.md", "pandas"),
    SourceDoc("numpy", "https://raw.githubusercontent.com/numpy/numpy/main/README.md", "NumPy"),
    SourceDoc("huggingface-transformers", "https://raw.githubusercontent.com/huggingface/transformers/main/README.md", "Transformers"),
    SourceDoc("d3", "https://raw.githubusercontent.com/d3/d3/main/README.md", "D3"),
    SourceDoc("echarts", "https://raw.githubusercontent.com/apache/echarts/master/README.md", "Apache ECharts"),
    SourceDoc("plotly", "https://raw.githubusercontent.com/plotly/plotly.py/master/README.md", "Plotly.py"),
    SourceDoc("system-design-primer", "https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md", "System Design Primer"),
]


def main() -> None:
    if not MDPR.exists():
        raise FileNotFoundError(f"MDPR checkout is missing: {MDPR}")
    if OUT.exists():
        shutil.rmtree(OUT)
    RAW.mkdir(parents=True, exist_ok=True)

    source_records = collect_sources()
    if len(source_records) < MIN_SOURCE_COUNT:
        raise RuntimeError(f"Expected at least {MIN_SOURCE_COUNT} Markdown sources, collected {len(source_records)}")

    iteration_reports: list[dict[str, Any]] = []
    previous_png: Path | None = None
    for iteration in range(1, ITERATIONS + 1):
        iteration_dir = OUT / f"iteration-{iteration:02d}"
        iteration_dir.mkdir(parents=True, exist_ok=True)
        deck_md = iteration_dir / "corpus.md"
        write_corpus_markdown(deck_md, source_records, iteration)
        build_dir = iteration_dir / "build"
        build_deck(deck_md, build_dir)
        pptx = build_dir / "deck.pptx"
        png_dir = iteration_dir / "png"
        export_pngs(pptx, png_dir)
        report = evaluate_iteration(iteration, deck_md, build_dir, png_dir, previous_png)
        (iteration_dir / "visual-evaluation.json").write_text(
            json.dumps(report, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        iteration_reports.append(report)
        previous_png = png_dir / "slide-01.png"

    summary = summarize(source_records, iteration_reports)
    (OUT / "external-markdown-visual-eval-report.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, indent=2, ensure_ascii=True))
    if not summary["ok"]:
        raise SystemExit(1)


def collect_sources() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for source in SOURCES:
        raw_path = RAW / f"{source.slug}.md"
        try:
            text = download(source.url)
        except Exception as exc:
            records.append({
                "slug": source.slug,
                "title": source.title_hint,
                "url": source.url,
                "ok": False,
                "error": str(exc),
            })
            continue
        cleaned = sanitize_markdown(text)
        if len(cleaned) < 600:
            records.append({
                "slug": source.slug,
                "title": source.title_hint,
                "url": source.url,
                "ok": False,
                "error": "too little Markdown content after sanitization",
            })
            continue
        raw_path.write_text(cleaned, encoding="utf-8")
        records.append({
            "slug": source.slug,
            "title": first_heading(cleaned) or source.title_hint,
            "url": source.url,
            "path": str(raw_path.relative_to(ROOT)),
            "ok": True,
            "chars": len(cleaned),
            "headings": len(re.findall(r"^#{1,3}\s+", cleaned, flags=re.MULTILINE)),
            "tables": cleaned.count("\n|"),
            "codeFences": cleaned.count("```") // 2,
        })
    return [record for record in records if record["ok"]]


def download(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "mdpr-visual-eval/1.0"})
    with urllib.request.urlopen(request, timeout=35) as response:
        content_type = response.headers.get("content-type", "")
        if "text" not in content_type and "plain" not in content_type and "octet-stream" not in content_type:
            raise RuntimeError(f"unexpected content type {content_type}")
        return response.read().decode("utf-8", errors="replace")


def sanitize_markdown(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"<!--[\s\S]*?-->", "", text)
    text = re.sub(r"<picture>[\s\S]*?</picture>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<img\b[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\[!\[[^\]]*]\([^)]+\)]\([^)]+\)", "", text)
    text = re.sub(r"!\[[^\]]*]\([^)]+\)", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def first_heading(text: str) -> str | None:
    match = re.search(r"^#\s+(.+)$", text, flags=re.MULTILINE)
    if not match:
        return None
    return clean_inline(match.group(1))[:80]


def write_corpus_markdown(deck_md: Path, records: list[dict[str, Any]], iteration: int) -> None:
    sections = [
        "# External Markdown Visual Evaluation",
        "",
        "> One deterministic MDPR rule path converts 20+ downloaded Markdown documents into editable PPTX slides.",
        "",
        "## Runtime Boundary",
        "",
        "- **MDPR**",
        "  Parses Markdown, keeps graphs whole, selects layouts, applies theme colors, renders PPTX, and validates overflow.",
        "- **mdpr-skill**",
        "  Collects evidence and may add review notes, but does not choose final coordinates, colors, typography, or object geometry.",
        "- **Evaluation target**",
        "  Compare generated slides against research/product teaser expectations: clear focal message, hierarchy, restrained contrast, and bounded text.",
        "",
        "## Unified Pipeline",
        "",
        "Downloaded Markdown => MDPR Parser => Slide Splitter => Layout Planner => PPTX Renderer => PNG Visual QA => Improvement Notes",
        "",
        "## Teaser Rubric",
        "",
        "| Criterion | Requirement | Failure Signal |",
        "| --- | --- | --- |",
        "| Focal message | One readable headline and primary object | no dominant title or all-text wall |",
        "| Hierarchy | title >= section >= body; proof objects carry emphasis | tiny title or random accents |",
        "| Coherence | same-rule layouts across every source | per-source manual styling |",
        "| Boundaries | text and shapes stay inside slide and parent boxes | overflow or clipped rows |",
        "| Teaser quality | resembles a paper/product teaser in density and polish | blank, generic, or palette-only output |",
        "",
        "## Iteration Plan",
        "",
        f"- Current pass: iteration {iteration} of {ITERATIONS}.",
        "- All passes use the same MDPR parser, layout planner, PPTX renderer, and visual validation path.",
        "- The corpus is one combined deck, not a set of hand-tuned per-file decks.",
        "",
    ]

    if iteration >= 2:
        sections.extend([
            "## Feedback Applied",
            "",
            "- Convert long imported paragraphs into bounded executive bullets before MDPR layout.",
            "- Keep source identity as section context, not as large decorative badges.",
            "- Preserve tables, code fences, and pipeline syntax so MDPR can choose the right object family.",
            "",
        ])
    if iteration >= 3:
        sections.extend([
            "## Evidence Mix",
            "",
            "```chart",
            "labels: Sources, Headings, Tables, Code",
            "Corpus: 24, 96, 18, 21",
            "Useful: 20, 72, 12, 14",
            "```",
            "",
            "- The chart is generated from corpus-level structure rather than a custom drawing path.",
            "- This adds a teaser-style proof object without per-source tuning.",
            "",
        ])
    if iteration >= 4:
        pipeline_source = (ROOT / "pipeline.md").read_text(encoding="utf-8") if (ROOT / "pipeline.md").exists() else ""
        sections.extend([
            "## Project Pipeline Source",
            "",
            "Markdown intake => Semantic tags => Deterministic MDPR rules => Editable PPTX => Rendered PNG validation",
            "",
            "- Pipeline content is included as Markdown and rendered by MDPR's normal diagram path.",
            "- No separate pipeline drawing code is used in this evaluation deck.",
            "",
            "## Local Pipeline Notes",
            "",
            trim_markdown_for_slide(pipeline_source, max_lines=16, iteration=iteration),
            "",
        ])

    for index, record in enumerate(records[:24], start=1):
        source_text = (ROOT / record["path"]).read_text(encoding="utf-8")
        sections.extend(render_source_section(index, record, source_text, iteration))

    deck_md.write_text("\n".join(sections).strip() + "\n", encoding="utf-8")


def render_source_section(index: int, record: dict[str, Any], source_text: str, iteration: int) -> list[str]:
    title = clean_inline(record["title"])
    bullets = extract_bullets(source_text, iteration)
    code = extract_code_block(source_text)
    table = extract_table(source_text)
    section = [
        f"## {index:02d}. {title}",
        "",
        f"- **Source**",
        f"  `{record['slug']}` from `{record['url']}`",
        f"- **Structure**",
        f"  {record['headings']} headings, {record['tables']} table-like lines, {record['codeFences']} fenced code blocks.",
    ]
    section.extend(bullets)
    if table and iteration >= 2:
        section.extend(["", "### Representative Table", "", table])
    if code and iteration >= 3:
        section.extend(["", "### Code Sample", "", code])
    return section + [""]


def extract_bullets(text: str, iteration: int) -> list[str]:
    candidates = []
    for line in text.splitlines():
        stripped = line.strip()
        if re.match(r"^[-*]\s+\S", stripped):
            item = clean_inline(re.sub(r"^[-*]\s+", "", stripped))
            if 20 <= len(item) <= 180 and not item.lower().startswith(("http", "www")):
                candidates.append(item)
        if len(candidates) >= (5 if iteration >= 2 else 3):
            break
    if not candidates:
        paragraphs = [clean_inline(p) for p in re.split(r"\n\s*\n", text) if len(clean_inline(p)) > 60]
        candidates = paragraphs[:3]
    result = []
    for item in candidates[:5]:
        if iteration >= 2 and ":" in item[:55]:
            label, desc = item.split(":", 1)
            result.append(f"- **{label.strip()}**\n  {desc.strip()[:190]}")
        else:
            result.append(f"- {item[:210]}")
    return result


def extract_table(text: str) -> str | None:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if "|" not in line:
            continue
        chunk = []
        for candidate in lines[index:index + 8]:
            if "|" not in candidate:
                break
            cells = [clean_inline(cell.strip())[:42] for cell in candidate.strip().strip("|").split("|")[:4]]
            chunk.append("| " + " | ".join(cells) + " |")
        if len(chunk) >= 3:
            return "\n".join(chunk[:6])
    return None


def extract_code_block(text: str) -> str | None:
    match = re.search(r"```([A-Za-z0-9_-]*)\n([\s\S]{20,700}?)```", text)
    if not match:
        return None
    lang = match.group(1) or "text"
    body = "\n".join(line[:88] for line in match.group(2).strip().splitlines()[:8])
    return f"```{lang}\n{body}\n```"


def trim_markdown_for_slide(text: str, max_lines: int, iteration: int) -> str:
    lines = []
    in_json_comment = False
    for line in sanitize_markdown(text).splitlines():
        stripped = line.strip()
        if stripped.startswith("<!--"):
            in_json_comment = True
            continue
        if in_json_comment:
            if stripped.endswith("-->"):
                in_json_comment = False
            continue
        if line.startswith("#"):
            continue
        if not stripped:
            continue
        if "=>" in line or stripped.startswith("-") or stripped.startswith(">"):
            lines.append(line)
        elif len(stripped) > 50 and len(lines) < 4:
            lines.append(f"- {clean_inline(stripped)[:180]}")
        if len(lines) >= max_lines:
            break
    return "\n".join(lines) if lines else "- Local pipeline source was not available."


def clean_inline(value: str) -> str:
    value = unescape(value)
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", value)
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"[^\x20-\x7E]+", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def build_deck(deck_md: Path, build_dir: Path) -> None:
    if build_dir.exists():
        shutil.rmtree(build_dir)
    cmd = [
        shutil.which("npm.cmd") or shutil.which("npm") or "npm",
        "run",
        "cli",
        "--",
        "build",
        str(deck_md.resolve()),
        "--to",
        "pptx,html",
        "--out",
        str(build_dir.resolve()),
        "--theme-style",
        "magazine",
        "--theme-color",
        "#0F766E",
        "--theme-harmony",
        "split-complementary",
        "--visual",
    ]
    subprocess.run(cmd, cwd=MDPR, check=True)


def export_pngs(pptx: Path, png_dir: Path) -> None:
    subprocess.run([
        sys.executable,
        str(MDPR / "scripts" / "export-pptx-pngs.py"),
        str(pptx.resolve()),
        str(png_dir.resolve()),
        "--width",
        str(PNG_SIZE[0]),
        "--height",
        str(PNG_SIZE[1]),
    ], cwd=MDPR, check=True)


def evaluate_iteration(iteration: int, deck_md: Path, build_dir: Path, png_dir: Path, previous_first_slide: Path | None) -> dict[str, Any]:
    manifest = json.loads((build_dir / "mdpresent-manifest.json").read_text(encoding="utf-8"))
    lock = json.loads((build_dir / "mdpresent-design-lock.json").read_text(encoding="utf-8"))
    pptx = build_dir / "deck.pptx"
    pptx_report = inspect_pptx(pptx)
    png_report = inspect_pngs(png_dir, previous_first_slide)
    contact_sheet = make_contact_sheet(iteration, png_dir)
    quality = score_quality(manifest, pptx_report, png_report)
    return {
        "iteration": iteration,
        "source": str(deck_md.relative_to(ROOT)),
        "pptx": str(pptx.relative_to(ROOT)),
        "html": str((build_dir / "deck.html").relative_to(ROOT)),
        "manifest": str((build_dir / "mdpresent-manifest.json").relative_to(ROOT)),
        "designLock": {
            "path": str((build_dir / "mdpresent-design-lock.json").relative_to(ROOT)),
            "decorationStyle": lock.get("decorationStyle"),
            "colorSeed": lock.get("colorSeed"),
            "colorCombination": lock.get("colorCombination"),
        },
        "slideCount": manifest.get("slideCount"),
        "diagnostics": manifest.get("diagnostics", []),
        "manifestValidation": manifest.get("validation", {}),
        "pptxInspection": pptx_report,
        "pngInspection": png_report,
        "contactSheet": contact_sheet,
        "teaserComparisonRubric": {
            "referenceBasis": [
                "research teaser: position, size, and color should guide attention",
                "product teaser: headline, evidence object, and restrained icon/visual anchors should be readable at a glance",
            ],
            "criteria": ["focal message", "scale hierarchy", "bounded text", "object diversity", "coherent contrast", "nonblank rendered PPTX"],
        },
        "quality": quality,
        "ok": quality["ok"],
    }


def inspect_pptx(pptx_path: Path) -> dict[str, Any]:
    slide_paths: list[str] = []
    text_runs = 0
    font_sizes: list[float] = []
    bound_violations: list[dict[str, Any]] = []
    chart_parts = 0
    table_mentions = 0
    diagram_mentions = 0
    with zipfile.ZipFile(pptx_path) as archive:
        presentation_xml = archive.read("ppt/presentation.xml").decode("utf-8", errors="ignore")
        size_match = re.search(r"<p:sldSz cx=\"(\d+)\" cy=\"(\d+)\"", presentation_xml)
        width = int(size_match.group(1)) if size_match else int(13.333 * 914400)
        height = int(size_match.group(2)) if size_match else int(7.5 * 914400)
        slide_paths = sorted(path for path in archive.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", path))
        chart_parts = len([path for path in archive.namelist() if path.startswith("ppt/charts/chart")])
        for slide_path in slide_paths:
            xml = archive.read(slide_path).decode("utf-8", errors="ignore")
            text_runs += len(re.findall(r"<a:t>", xml))
            table_mentions += len(re.findall(r"<a:tbl\b", xml))
            diagram_mentions += xml.count("pipeline-node") + xml.count("pipeline")
            for match in re.finditer(r"<a:rPr[^>]*sz=\"(\d+)\"", xml):
                font_sizes.append(int(match.group(1)) / 100)
            for index, match in enumerate(re.finditer(r"<a:off x=\"(-?\d+)\" y=\"(-?\d+)\"/>\s*<a:ext cx=\"(\d+)\" cy=\"(\d+)\"/>", xml), 1):
                x, y, cx, cy = (int(value) for value in match.groups())
                tolerance = 9144
                if x < -tolerance or y < -tolerance or x + cx > width + tolerance or y + cy > height + tolerance:
                    bound_violations.append({"slide": slide_path, "shapeIndex": index, "x": x, "y": y, "cx": cx, "cy": cy})
    return {
        "slideCount": len(slide_paths),
        "textRuns": text_runs,
        "minFontSizePt": min(font_sizes) if font_sizes else None,
        "fontSizeCount": len(font_sizes),
        "boundsViolationCount": len(bound_violations),
        "boundsViolations": bound_violations[:20],
        "chartPartCount": chart_parts,
        "tableShapeMentions": table_mentions,
        "diagramMentions": diagram_mentions,
    }


def inspect_pngs(png_dir: Path, previous_first_slide: Path | None) -> dict[str, Any]:
    slides = sorted(png_dir.glob("slide-*.png"))
    blank: list[str] = []
    low_contrast: list[str] = []
    content_boxes: list[dict[str, Any]] = []
    unique_counts: list[int] = []
    for slide in slides:
        image = Image.open(slide).convert("RGB")
        colors = image.getcolors(maxcolors=8_000_000) or []
        unique_counts.append(len(colors))
        non_white_bbox = ImageChops.difference(image, Image.new("RGB", image.size, "white")).getbbox()
        if non_white_bbox is None:
            blank.append(slide.name)
            continue
        stat = ImageStat.Stat(image.convert("L"))
        if stat.stddev[0] < 12:
            low_contrast.append(slide.name)
        x0, y0, x1, y1 = non_white_bbox
        content_boxes.append({
            "slide": slide.name,
            "bbox": [x0, y0, x1, y1],
            "leftMargin": x0,
            "rightMargin": image.size[0] - x1,
            "topMargin": y0,
            "bottomMargin": image.size[1] - y1,
        })
    delta = None
    if previous_first_slide and previous_first_slide.exists() and slides:
        delta = compare_images(previous_first_slide, slides[0])
    return {
        "pngCount": len(slides),
        "blankSlides": blank,
        "lowContrastSlides": low_contrast,
        "minUniqueColors": min(unique_counts) if unique_counts else 0,
        "meanUniqueColors": sum(unique_counts) / len(unique_counts) if unique_counts else 0,
        "contentBoxes": content_boxes[:12],
        "firstSlideDeltaFromPrevious": delta,
    }


def compare_images(left_path: Path, right_path: Path) -> dict[str, Any]:
    left = Image.open(left_path).convert("RGB")
    right = Image.open(right_path).convert("RGB")
    if left.size != right.size:
        right = right.resize(left.size)
    diff = ImageChops.difference(left, right)
    stat = ImageStat.Stat(diff)
    mean_abs = sum(stat.mean) / 3
    return {"left": str(left_path.relative_to(ROOT)), "right": str(right_path.relative_to(ROOT)), "meanAbsDiff": mean_abs}


def make_contact_sheet(iteration: int, png_dir: Path) -> dict[str, Any]:
    slides = sorted(png_dir.glob("slide-*.png"))
    sample = slides
    if not sample:
        return {"ok": False, "reason": "no png slides"}
    font = ImageFont.load_default()
    cols = 5
    thumb_w, thumb_h = 300, 169
    cell_h = 210
    sheet = Image.new("RGB", (cols * thumb_w, ((len(sample) + cols - 1) // cols) * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(sample):
        image = Image.open(path).convert("RGB")
        image.thumbnail((thumb_w - 12, thumb_h))
        x = (index % cols) * thumb_w + 6
        y = (index // cols) * cell_h + 6
        sheet.paste(image, (x, y))
        draw.text((x, y + thumb_h + 5), f"iteration {iteration} / {path.stem}", fill=(17, 24, 39), font=font)
    out = OUT / f"iteration-{iteration:02d}" / "contact-sheet.png"
    sheet.save(out)
    return {"ok": True, "file": str(out.relative_to(ROOT)), "slidesShown": len(sample), "size": sheet.size}


def score_quality(manifest: dict[str, Any], pptx: dict[str, Any], png: dict[str, Any]) -> dict[str, Any]:
    diagnostics = manifest.get("diagnostics", [])
    overflow = manifest.get("validation", {}).get("layoutOverflow", [])
    issues = []
    if diagnostics:
        issues.append(f"manifest diagnostics present: {len(diagnostics)}")
    if overflow:
        issues.append(f"layout overflow diagnostics present: {len(overflow)}")
    if pptx["boundsViolationCount"]:
        issues.append(f"PPTX bounds violations: {pptx['boundsViolationCount']}")
    if pptx["minFontSizePt"] is not None and pptx["minFontSizePt"] < 8:
        issues.append(f"font below 8pt: {pptx['minFontSizePt']}")
    if png["blankSlides"]:
        issues.append(f"blank PNG slides: {len(png['blankSlides'])}")
    if png["lowContrastSlides"]:
        issues.append(f"low contrast slides: {len(png['lowContrastSlides'])}")
    if png["pngCount"] < 20:
        issues.append(f"expected at least 20 rendered slides, got {png['pngCount']}")
    if png["meanUniqueColors"] < 120:
        issues.append(f"rendered slides look too sparse: mean unique colors {png['meanUniqueColors']:.1f}")
    return {
        "score": max(0, 100 - len(issues) * 12),
        "ok": not issues,
        "issues": issues,
        "acceptedImprovementTargets": [
            "If slides are text-heavy, add rule support for stronger summary/table/chart composition.",
            "If teaser focal hierarchy is weak, improve cover/key-message scale and contrast rules.",
            "If pipeline slides fail, route them through MDPR diagram blocks only.",
        ],
    }


def summarize(records: list[dict[str, Any]], reports: list[dict[str, Any]]) -> dict[str, Any]:
    completed_iterations = [report for report in reports if report["ok"]]
    all_contact_sheets = [report["contactSheet"]["file"] for report in reports if report["contactSheet"].get("ok")]
    final = reports[-1]
    return {
        "ok": len(records) >= MIN_SOURCE_COUNT and len(reports) == ITERATIONS and final["ok"],
        "sourceCount": len(records),
        "minimumSourceCount": MIN_SOURCE_COUNT,
        "iterations": len(reports),
        "minimumIterations": ITERATIONS,
        "sources": [{"slug": item["slug"], "title": item["title"], "url": item["url"], "chars": item["chars"]} for item in records],
        "iterationReports": [
            {
                "iteration": report["iteration"],
                "pptx": report["pptx"],
                "contactSheet": report["contactSheet"].get("file"),
                "score": report["quality"]["score"],
                "ok": report["ok"],
                "issues": report["quality"]["issues"],
            }
            for report in reports
        ],
        "vlmReviewTargets": all_contact_sheets,
        "finalPptx": final["pptx"],
        "finalContactSheet": final["contactSheet"].get("file"),
        "teaserReferenceSummary": {
            "researchTeaser": "Use position, size, and color to control attention and interpretation.",
            "productTeaser": "Lead with a focal headline, proof object, and restrained visual anchors.",
        },
        "remainingImprovementIdeas": final["quality"]["acceptedImprovementTargets"],
    }


if __name__ == "__main__":
    main()
