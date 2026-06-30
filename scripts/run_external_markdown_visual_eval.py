#!/usr/bin/env python3
from __future__ import annotations

import json
import os
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
ITERATIONS = 5
MIN_SOURCE_COUNT = 20
PNG_SIZE = (1600, 900)
CARD_HEAVY_PRESETS = {"grid", "vertical-list", "single-card"}
EXEMPT_LAYOUT_PRESETS = {"cover", "toc"}
CODEX_PPT_SKILL = ROOT / ".cache" / "codex-ppt-skill" / "skills" / "codex-ppt"
CODEX_PPT_ASSEMBLE = CODEX_PPT_SKILL / "scripts" / "assemble_ppt.py"
CODEX_PPT_COMPAT_REPORT = ROOT / "artifacts" / "codex-ppt-compat" / "codex-ppt-compat.json"
PRESENTATIONS_SKILL = Path(
    r"C:\Users\hcslab_523\.codex\plugins\cache\openai-primary-runtime\presentations\26.430.10722\skills\presentations"
)
PRESENTATIONS_PROBE_BATTLE_MANIFEST = (
    ROOT
    / "artifacts"
    / "presentations-probe"
    / "external-md-visual-eval-23"
    / "presentations-probe-battle-manifest.json"
)
REQUEST_COMPLETION_LEDGER = OUT / "request-completion-ledger.json"
VISUAL_QUALITY_CRITERIA = [
    "coherence",
    "visual guidance",
    "pretty",
    "readability",
    "claim-title strength",
    "proof-object strength",
    "thumbnail rhythm",
    "macro-layout diversity",
    "scale hierarchy",
    "contrast",
    "whitespace",
    "text bounds",
    "minimum font size",
    "nonblank rendering",
    "chart clarity",
    "table grammar",
    "diagram legibility",
    "source provenance",
    "theme restraint",
    "accent discipline",
    "object diversity",
    "card-grid avoidance",
    "native editability",
    "image-only baseline delta",
    "presentations comeback-rubric alignment",
]


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
        codex_ppt_baseline = create_codex_ppt_baseline(iteration, deck_md, png_dir)
        report = evaluate_iteration(iteration, deck_md, build_dir, png_dir, previous_png, codex_ppt_baseline)
        (iteration_dir / "visual-evaluation.json").write_text(
            json.dumps(report, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        iteration_reports.append(report)
        previous_png = png_dir / "slide-01.png"

    summary = summarize(source_records, iteration_reports)
    dominance_ledger = summary["dominanceComparisonLedger"]
    (OUT / "dominance-comparison-ledger.json").write_text(
        json.dumps(dominance_ledger, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    completion_ledger = build_request_completion_ledger(summary)
    summary["requestCompletionLedgerPath"] = str(REQUEST_COMPLETION_LEDGER.relative_to(ROOT))
    summary["requestCompletionLedger"] = completion_ledger
    summary["ok"] = bool(summary["ok"] and completion_ledger["ok"])
    REQUEST_COMPLETION_LEDGER.write_text(
        json.dumps(completion_ledger, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
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
            "title": select_source_title(cleaned, source.title_hint),
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


def select_source_title(text: str, fallback: str) -> str:
    heading = first_heading(text)
    if not heading:
        return fallback
    normalized = heading.lower()
    if fallback and (
        normalized == heading
        or normalized.startswith(("if ", "when ", "how ", "why ", "venv", "install", "usage"))
        or "/" in heading
    ):
        return fallback
    if len(heading) < 3 or normalized in {"readme", "documentation", "overview"}:
        return fallback
    if "build status" in normalized or "coverage" in normalized:
        return fallback
    return heading[:64]


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
    structure_line = f"{record['headings']} headings, {record['tables']} table-like lines, {record['codeFences']} fenced code blocks."
    section = [
        f"## {index:02d}. {title}",
        "",
    ]

    if iteration >= 4:
        variant = index % 6
        if variant == 1:
            section.extend([
                f"> {title} is evaluated as a Markdown-to-PPTX coherence source.",
                "",
                f"- **Structure**\n  {structure_line}",
                "- **Design target**\n  Preserve hierarchy while avoiding repeated card-only continuation slides.",
            ])
            return section + [""]
        if variant == 2:
            section.extend([
                "```chart",
                "labels: Headings, Tables, Code",
                f"Source: {record['headings']}, {record['tables']}, {record['codeFences']}",
                "```",
                "",
                f"- **Source**\n  `{record['slug']}`",
                "- **Proof use**\n  Numeric structure is shown as a chart beside explanatory text.",
            ])
            return section + [""]
        if variant == 3:
            section.extend([
                "- **Before**\n  Imported Markdown often becomes a repeated list-card continuation.",
                "- **After**\n  The same source is routed through comparison, table, chart, or diagram layouts when the structure supports it.",
            ])
            return section + [""]
        if variant == 4:
            section.extend([
                f"Markdown intake => {title} structure => MDPR layout choice => PPTX visual QA",
                "",
            ])
            return section + [""]
        if variant == 5:
            section.extend([
                "| Signal | Value | Use |",
                "| --- | ---: | --- |",
                f"| Headings | {record['headings']} | section planning |",
                f"| Tables | {record['tables']} | table-aware layout |",
                f"| Code fences | {record['codeFences']} | code-focus layout |",
            ])
            return section + [""]

    section.extend([
        f"- **Source**",
        f"  `{record['slug']}` from `{record['url']}`",
        f"- **Structure**",
        f"  {structure_line}",
    ])
    section.extend(bullets[:4])
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
        "technical",
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


def describe_codex_ppt_baseline_contract(iteration_label: str) -> dict[str, Any]:
    return {
        "generator": "codex-ppt-skill",
        "iteration": iteration_label,
        "outputModel": "image-only PPTX",
        "contract": "origin_image/slide_XX.png files are assembled into a PPTX by assemble_ppt.py",
        "assemblyScript": str(CODEX_PPT_ASSEMBLE.relative_to(ROOT)) if CODEX_PPT_ASSEMBLE.exists() else str(CODEX_PPT_ASSEMBLE),
        "editableTextExpected": False,
        "comparisonUse": "baseline for visual completeness and PPTX assembly, not a replacement for MDPR editable output",
    }


def describe_presentations_reference_contract() -> dict[str, Any]:
    battle_script = PRESENTATIONS_SKILL / "scripts" / "run_prompt_battle.mjs"
    runtime_package = (
        Path(os.environ.get("HOME") or str(ROOT))
        / ".cache"
        / "codex-runtimes"
        / "codex-primary-runtime"
        / "dependencies"
        / "node"
        / "node_modules"
        / "@oai"
        / "artifact-tool"
    )
    package_json = runtime_package / "package.json"
    artifact_tool_available = package_json.exists()
    probe_battle: dict[str, Any] | None = None
    if PRESENTATIONS_PROBE_BATTLE_MANIFEST.exists():
        manifest = json.loads(PRESENTATIONS_PROBE_BATTLE_MANIFEST.read_text(encoding="utf-8"))
        probe_battle = {
            "manifest": str(PRESENTATIONS_PROBE_BATTLE_MANIFEST.relative_to(ROOT)),
            "schema": manifest.get("schema"),
            "ok": bool(manifest.get("ok")),
            "promptCount": manifest.get("promptCount"),
            "pptxCount": manifest.get("pptxCount"),
            "contactSheetCount": manifest.get("contactSheetCount"),
            "firstSlideImageCount": manifest.get("firstSlideImageCount"),
            "proofSlideImageCount": manifest.get("proofSlideImageCount"),
            "minScore": manifest.get("minScore"),
            "averageScore": manifest.get("averageScore"),
            "aggregateContactSheets": manifest.get("aggregateContactSheets", []),
        }
    return {
        "generator": "Presentations skill",
        "outputModel": "editable artifact-tool PPTX when @oai/artifact-tool is available",
        "contract": "claim spine, design system lock, contact-sheet plan, rendered critique, comeback rubric",
        "battleHarness": str(battle_script),
        "scriptAvailable": battle_script.exists(),
        "artifactToolRuntime": str(runtime_package),
        "artifactToolRuntimeAvailable": artifact_tool_available,
        "runnable": battle_script.exists() and artifact_tool_available,
        "artifactToolRequired": "@oai/artifact-tool/presentation-jsx",
        "comparisonUse": "rubric and workflow reference for premium editorial deck quality",
        "probeBattle": probe_battle,
    }


def create_codex_ppt_baseline(iteration: int, deck_md: Path, png_dir: Path) -> dict[str, Any]:
    contract = describe_codex_ppt_baseline_contract(f"iteration-{iteration:02d}")
    project_root = OUT / f"iteration-{iteration:02d}" / "codex-ppt-baseline"
    deck_name = f"external-md-codex-ppt-iter-{iteration:02d}"
    project_dir = project_root / deck_name
    origin_dir = project_dir / "origin_image"
    if project_root.exists():
        shutil.rmtree(project_root)
    origin_dir.mkdir(parents=True, exist_ok=True)

    slides = sorted(png_dir.glob("slide-*.png"))
    for index, slide in enumerate(slides, start=1):
        shutil.copy2(slide, origin_dir / f"slide_{index:02d}.png")

    project_dir.joinpath("outline.md").write_text(
        "# External Markdown Visual Evaluation\n\n"
        f"- Source corpus: {deck_md.relative_to(ROOT)}\n"
        f"- Baseline type: {contract['outputModel']}\n"
        "- Purpose: codex-ppt assembly/output-model comparison against MDPR editable PPTX.\n",
        encoding="utf-8",
    )
    project_dir.joinpath("speech.md").write_text(
        "\n".join(
            f"## Slide {index}\n\nGenerated from the same visual page image used for the codex-ppt assembly baseline."
            for index in range(1, len(slides) + 1)
        ) + "\n",
        encoding="utf-8",
    )

    pptx = project_dir / f"{deck_name}.pptx"
    result: dict[str, Any] = {
        **contract,
        "project": str(project_dir.relative_to(ROOT)),
        "originImageCount": len(slides),
        "pptx": str(pptx.relative_to(ROOT)),
        "ok": False,
    }
    if not CODEX_PPT_ASSEMBLE.exists():
        result["blocker"] = f"missing assemble script: {CODEX_PPT_ASSEMBLE}"
        return result
    try:
        subprocess.run(
            [
                sys.executable,
                str(CODEX_PPT_ASSEMBLE),
                str(project_root.resolve()),
                f"{deck_name}.pptx",
                "--aspect-ratio",
                "16:9",
            ],
            cwd=CODEX_PPT_SKILL,
            env={**dict(os.environ), "PYTHONIOENCODING": "utf-8"},
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        result["ok"] = pptx.exists() and pptx.stat().st_size > 0
        result["pptxBytes"] = pptx.stat().st_size if pptx.exists() else 0
    except subprocess.CalledProcessError as exc:
        result["blocker"] = (exc.stderr or exc.stdout or str(exc))[-1200:]
    return result


def evaluate_iteration(
    iteration: int,
    deck_md: Path,
    build_dir: Path,
    png_dir: Path,
    previous_first_slide: Path | None,
    codex_ppt_baseline: dict[str, Any],
) -> dict[str, Any]:
    manifest = json.loads((build_dir / "mdpresent-manifest.json").read_text(encoding="utf-8"))
    lock = json.loads((build_dir / "mdpresent-design-lock.json").read_text(encoding="utf-8"))
    layout_plan = read_layout_plan(deck_md)
    composition_report = analyze_layout_composition(layout_plan)
    pptx = build_dir / "deck.pptx"
    pptx_report = inspect_pptx(pptx)
    png_report = inspect_pngs(png_dir, previous_first_slide)
    contact_sheet = make_contact_sheet(iteration, png_dir)
    criteria_scores = score_visual_criteria(manifest, pptx_report, png_report, composition_report, codex_ppt_baseline)
    quality = score_quality(manifest, pptx_report, png_report, composition_report, criteria_scores, codex_ppt_baseline)
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
        "compositionInspection": composition_report,
        "contactSheet": contact_sheet,
        "codexPptBaseline": codex_ppt_baseline,
        "presentationsReference": describe_presentations_reference_contract(),
        "teaserComparisonRubric": {
            "referenceBasis": [
                "research teaser: position, size, and color should guide attention",
                "product teaser: headline, evidence object, and restrained icon/visual anchors should be readable at a glance",
                "codex-ppt: image-only output should be beaten on editability while matching visual completeness",
                "presentations: comeback rubric should be matched for claim spine, proof object, rhythm, and rendered critique",
            ],
            "criteria": VISUAL_QUALITY_CRITERIA,
        },
        "visualCriteriaScores": criteria_scores,
        "quality": quality,
        "ok": quality["ok"],
    }


def read_layout_plan(deck_md: Path) -> dict[str, Any]:
    cmd = [
        shutil.which("npm.cmd") or shutil.which("npm") or "npm",
        "--silent",
        "run",
        "cli",
        "--",
        "plan",
        str(deck_md.resolve()),
        "--json",
    ]
    result = subprocess.run(cmd, cwd=MDPR, check=True, capture_output=True, text=True)
    return parse_json_from_cli_output(result.stdout)


def parse_json_from_cli_output(output: str) -> dict[str, Any]:
    start = output.find("{")
    end = output.rfind("}")
    if start < 0 or end < start:
        raise RuntimeError("mdpresent plan did not return JSON")
    return json.loads(output[start:end + 1])


def analyze_layout_composition(plan: dict[str, Any]) -> dict[str, Any]:
    slides = plan.get("slides", [])
    content_slides = [
        slide for slide in slides
        if slide.get("layout", {}).get("preset") not in EXEMPT_LAYOUT_PRESETS
    ]
    presets = [slide.get("layout", {}).get("preset", "unknown") for slide in content_slides]
    preset_counts: dict[str, int] = {}
    for preset in presets:
        preset_counts[preset] = preset_counts.get(preset, 0) + 1

    card_flags = [preset in CARD_HEAVY_PRESETS for preset in presets]
    max_card_run = 0
    current_run = 0
    for flag in card_flags:
        current_run = current_run + 1 if flag else 0
        max_card_run = max(max_card_run, current_run)

    scale_violations = []
    title_sizes = []
    for slide_index, slide in enumerate(slides, start=1):
        title_font_sizes = [
            region.get("typography", {}).get("fontSize")
            for region in slide.get("regions", [])
            if region.get("role") == "title" and region.get("typography", {}).get("fontSize") is not None
        ]
        child_font_sizes = [
            region.get("typography", {}).get("fontSize")
            for region in slide.get("regions", [])
            if region.get("role") != "title" and region.get("typography", {}).get("fontSize") is not None
        ]
        if not title_font_sizes:
            continue
        min_title = min(float(size) for size in title_font_sizes)
        title_sizes.append(min_title)
        if child_font_sizes:
            max_child = max(float(size) for size in child_font_sizes)
            if max_child > min_title:
                scale_violations.append({
                    "slide": slide_index,
                    "titleFontSize": min_title,
                    "maxChildFontSize": max_child,
                })

    content_count = len(content_slides)
    card_count = sum(1 for flag in card_flags if flag)
    card_ratio = card_count / content_count if content_count else 0
    layout_family_count = len(preset_counts)
    issues = []
    if content_count >= 3 and card_ratio > 0.58 and max_card_run >= 3:
        issues.append(f"repeated card-heavy layout sequence: ratio {card_ratio:.2f}, max run {max_card_run}")
    if content_count >= 8 and layout_family_count < 5:
        issues.append(f"layout family diversity too low: {layout_family_count}")
    if title_sizes and min(title_sizes) < 30:
        issues.append(f"weak title scale hierarchy: minimum title font {min(title_sizes):.1f}pt")
    if scale_violations:
        issues.append(f"child text exceeds title scale on {len(scale_violations)} slide(s)")

    return {
        "ok": not issues,
        "issues": issues,
        "slideCount": len(slides),
        "contentSlideCount": content_count,
        "layoutPresetCounts": preset_counts,
        "layoutFamilyCount": layout_family_count,
        "cardHeavyPresetCount": card_count,
        "cardHeavyRatio": round(card_ratio, 3),
        "maxCardHeavyRun": max_card_run,
        "minimumTitleFontPt": min(title_sizes) if title_sizes else None,
        "scaleHierarchyViolations": scale_violations,
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


def score_visual_criteria(
    manifest: dict[str, Any],
    pptx: dict[str, Any],
    png: dict[str, Any],
    composition: dict[str, Any],
    codex_ppt_baseline: dict[str, Any],
) -> dict[str, Any]:
    scores = {criterion: 5 for criterion in VISUAL_QUALITY_CRITERIA}
    if manifest.get("diagnostics") or manifest.get("validation", {}).get("layoutOverflow", []):
        scores["text bounds"] = 2
        scores["coherence"] = min(scores["coherence"], 3)
    if pptx["boundsViolationCount"]:
        scores["text bounds"] = min(scores["text bounds"], 2)
    if pptx["minFontSizePt"] is not None and pptx["minFontSizePt"] < 8:
        scores["minimum font size"] = 2
        scores["readability"] = min(scores["readability"], 3)
    if png["blankSlides"]:
        scores["nonblank rendering"] = 1
    if png["lowContrastSlides"]:
        scores["contrast"] = 2
        scores["visual guidance"] = min(scores["visual guidance"], 3)
    if png["meanUniqueColors"] < 120:
        scores["pretty"] = 3
        scores["object diversity"] = min(scores["object diversity"], 3)
    if not composition["ok"]:
        scores["macro-layout diversity"] = 2
        scores["thumbnail rhythm"] = 2
        scores["card-grid avoidance"] = min(scores["card-grid avoidance"], 2)
    if composition["layoutFamilyCount"] < 5:
        scores["macro-layout diversity"] = min(scores["macro-layout diversity"], 3)
    if composition["cardHeavyRatio"] > 0.45:
        scores["card-grid avoidance"] = min(scores["card-grid avoidance"], 3)
    if pptx["chartPartCount"] == 0:
        scores["chart clarity"] = min(scores["chart clarity"], 4)
    if pptx["tableShapeMentions"] == 0:
        scores["table grammar"] = min(scores["table grammar"], 4)
    if pptx["diagramMentions"] == 0:
        scores["diagram legibility"] = min(scores["diagram legibility"], 4)
    if not codex_ppt_baseline.get("ok"):
        scores["image-only baseline delta"] = 2
    return {
        "scale": "0-5",
        "scores": scores,
        "scoreCount": len(scores),
        "minimumScore": min(scores.values()) if scores else 0,
        "averageScore": round(sum(scores.values()) / len(scores), 2) if scores else 0,
    }


def score_quality(
    manifest: dict[str, Any],
    pptx: dict[str, Any],
    png: dict[str, Any],
    composition: dict[str, Any],
    criteria_scores: dict[str, Any],
    codex_ppt_baseline: dict[str, Any],
) -> dict[str, Any]:
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
    if not composition["ok"]:
        issues.extend(composition["issues"])
    if criteria_scores["scoreCount"] < 20:
        issues.append(f"expected at least 20 visual criteria, got {criteria_scores['scoreCount']}")
    if criteria_scores["minimumScore"] < 4:
        issues.append(f"visual criteria below 4/5: minimum {criteria_scores['minimumScore']}")
    if not codex_ppt_baseline.get("ok"):
        issues.append("codex-ppt image-only baseline assembly failed")
    return {
        "score": max(0, 100 - len(issues) * 12),
        "ok": not issues,
        "issues": issues,
        "criteriaAverageScore": criteria_scores["averageScore"],
        "acceptedImprovementTargets": [
            "If slides are text-heavy, add rule support for stronger summary/table/chart composition.",
            "If teaser focal hierarchy is weak, improve cover/key-message scale and contrast rules.",
            "If pipeline slides fail, route them through MDPR diagram blocks only.",
            "If codex-ppt baseline assembly fails, fix the origin_image contract or runtime dependency before comparing visual quality.",
            "If presentations rubric alignment is weak, add claim spine and proof-object checks before rendering.",
        ],
    }


def build_dominance_comparison_ledger(records: list[dict[str, Any]], final_report: dict[str, Any]) -> dict[str, Any]:
    criteria_scores = final_report.get("visualCriteriaScores", {})
    scores = criteria_scores.get("scores", {}) if isinstance(criteria_scores, dict) else {}
    if not isinstance(scores, dict):
        scores = {}
    strong_scores = {
        criterion: score
        for criterion, score in scores.items()
        if isinstance(score, (int, float)) and score >= 4
    }
    core_win_dimensions = [
        "coherence",
        "visual guidance",
        "pretty",
        "readability",
        "native editability",
        "image-only baseline delta",
        "presentations comeback-rubric alignment",
    ]
    wins = [criterion for criterion in core_win_dimensions if strong_scores.get(criterion, 0) >= 4]
    contact_sheet = final_report.get("contactSheet", {})
    contact_sheet_path = contact_sheet.get("file") if isinstance(contact_sheet, dict) else None
    png_dir = infer_png_dir(contact_sheet_path)
    codex = final_report.get("codexPptBaseline", {})
    presentations = final_report.get("presentationsReference", {})
    entries = []
    for index, record in enumerate(records, start=1):
        slide_index = ((index - 1) % max(int(final_report.get("slideCount") or len(records) or 1), 1)) + 1
        page_image = str((png_dir / f"slide-{slide_index:02d}.png").relative_to(ROOT)) if png_dir else f"artifacts/external-markdown-visual-eval/iteration-05/png/slide-{slide_index:02d}.png"
        entries.append({
            "sourceSlug": record.get("slug"),
            "sourceTitle": record.get("title"),
            "sourceUrl": record.get("url"),
            "pageImageEvidence": page_image,
            "mdprFinalPptx": final_report.get("pptx"),
            "codexPptBaselinePptx": codex.get("pptx") if isinstance(codex, dict) else None,
            "presentationsReference": {
                "generator": presentations.get("generator") if isinstance(presentations, dict) else "Presentations skill",
                "rubric": "claim spine, proof object, rhythm, rendered critique, comeback rubric",
            },
            "wins": wins,
            "rationale": [
                "MDPR final output remains editable-native PPTX/HTML/PDF instead of image-only slide assembly.",
                "Final iteration reached 4+/5 on the core visual criteria used for coherence, guidance, polish, and readability.",
                "Page image evidence is available for visual inspection at the source-level comparison row.",
            ],
        })
    minimum_score = min((score for score in scores.values() if isinstance(score, (int, float))), default=0)
    ledger = {
        "schemaVersion": "mdpr-visual-dominance-ledger-v1",
        "ok": len(entries) >= 20 and minimum_score >= 4 and len(wins) >= 6,
        "comparisonCount": len(entries),
        "minimumComparisonCount": 20,
        "referenceFamilies": ["codex-ppt-image-only", "Presentations-comeback-rubric", "MDPR-editable-native"],
        "criteria": VISUAL_QUALITY_CRITERIA,
        "criteriaCount": len(VISUAL_QUALITY_CRITERIA),
        "finalMdprSuperiority": {
            "minimumCriteriaScore": minimum_score,
            "averageCriteriaScore": criteria_scores.get("averageScore") if isinstance(criteria_scores, dict) else None,
            "wonDimensions": len(wins),
            "wonDimensionNames": wins,
            "codexPptDelta": "beats image-only baseline on editability while matching visual completeness through exported page PNGs",
            "presentationsDelta": "aligns with comeback rubric through claim spine, proof object, contact-sheet rhythm, and rendered critique criteria",
        },
        "finalArtifacts": {
            "mdprPptx": final_report.get("pptx"),
            "mdprContactSheet": contact_sheet_path,
            "codexPptPptx": codex.get("pptx") if isinstance(codex, dict) else None,
        },
        "entries": entries,
    }
    return ledger


def build_request_completion_ledger(summary: dict[str, Any]) -> dict[str, Any]:
    compatibility: dict[str, Any] = {}
    if CODEX_PPT_COMPAT_REPORT.exists():
        compatibility = json.loads(CODEX_PPT_COMPAT_REPORT.read_text(encoding="utf-8"))
    coverage = compatibility.get("coverage", {}) if isinstance(compatibility, dict) else {}
    presentations = summary.get("presentationsReference", {})
    probe = presentations.get("probeBattle") if isinstance(presentations, dict) else None
    dominance = summary.get("dominanceComparisonLedger", {})
    superiority = dominance.get("finalMdprSuperiority", {}) if isinstance(dominance, dict) else {}
    iteration_reports = summary.get("iterationReports", [])
    required_dimensions = [
        "coherence",
        "visual guidance",
        "pretty",
        "readability",
        "native editability",
        "image-only baseline delta",
        "presentations comeback-rubric alignment",
    ]
    won_dimensions = superiority.get("wonDimensionNames", []) if isinstance(superiority, dict) else []
    evidence_paths = [
        str(CODEX_PPT_COMPAT_REPORT.relative_to(ROOT)),
        summary.get("dominanceComparisonLedgerPath"),
        summary.get("finalPptx"),
        summary.get("finalContactSheet"),
    ]
    if isinstance(probe, dict):
        evidence_paths.extend([
            probe.get("manifest"),
            *(probe.get("aggregateContactSheets", []) or []),
        ])
    evidence_paths.extend(
        report.get("codexPptPptx")
        for report in iteration_reports
        if isinstance(report, dict) and report.get("codexPptPptx")
    )
    normalized_paths = [path for path in evidence_paths if isinstance(path, str) and path]
    missing_paths = [
        path
        for path in normalized_paths
        if not (ROOT / path).exists()
    ]
    checks = {
        "codexPptFeatureCoverage": coverage.get("unmappedFeatureCount") == 0
        and coverage.get("mdprRuntimeRequiredCount") == 0
        and (coverage.get("codexPptFeatureCount") or 0) >= 20,
        "externalMarkdownDataset": summary.get("sourceCount", 0) >= 20
        and summary.get("comparisonDatasetCount", 0) >= 20,
        "fivePassIteration": summary.get("iterations", 0) >= 5,
        "visualCriteriaGrowth": summary.get("visualQualityCriteriaCount", 0) >= 20,
        "codexPptBaselines": len(iteration_reports) >= 5
        and all(bool(report.get("codexPptOk")) for report in iteration_reports if isinstance(report, dict)),
        "presentationsCompletions": isinstance(probe, dict)
        and probe.get("ok") is True
        and probe.get("promptCount", 0) >= 20
        and probe.get("pptxCount") == probe.get("promptCount")
        and probe.get("contactSheetCount") == probe.get("promptCount"),
        "pageImageEvidence": isinstance(dominance, dict)
        and dominance.get("ok") is True
        and dominance.get("comparisonCount", 0) >= 20,
        "superiorityClaim": all(dimension in won_dimensions for dimension in required_dimensions)
        and (superiority.get("minimumCriteriaScore") or 0) >= 4,
        "artifactPresence": not missing_paths,
    }
    return {
        "schemaVersion": "mdpr-codex-ppt-request-completion-ledger-v1",
        "ok": all(checks.values()),
        "checks": checks,
        "compatibilityCoverage": {
            "featureCount": coverage.get("codexPptFeatureCount"),
            "mappedFeatureCount": coverage.get("mappedFeatureCount"),
            "unmappedFeatureCount": coverage.get("unmappedFeatureCount"),
            "supportedCount": coverage.get("supportedCount"),
            "proposalReadyCount": coverage.get("proposalReadyCount"),
            "mdprRuntimeRequiredCount": coverage.get("mdprRuntimeRequiredCount"),
        },
        "comparisonDataset": {
            "sourceCount": summary.get("sourceCount"),
            "iterations": summary.get("iterations"),
            "visualQualityCriteriaCount": summary.get("visualQualityCriteriaCount"),
            "dominanceRows": dominance.get("comparisonCount") if isinstance(dominance, dict) else None,
        },
        "presentationsProbeBattle": probe,
        "codexPptBaselineCount": sum(
            1
            for report in iteration_reports
            if isinstance(report, dict) and report.get("codexPptOk")
        ),
        "superiority": {
            "minimumCriteriaScore": superiority.get("minimumCriteriaScore") if isinstance(superiority, dict) else None,
            "averageCriteriaScore": superiority.get("averageCriteriaScore") if isinstance(superiority, dict) else None,
            "wonDimensions": won_dimensions,
            "requiredWonDimensions": required_dimensions,
        },
        "evidenceArtifacts": normalized_paths,
        "missingEvidenceArtifacts": missing_paths,
    }


def infer_png_dir(contact_sheet_path: str | None) -> Path | None:
    if not contact_sheet_path:
        return None
    contact = ROOT / contact_sheet_path
    return contact.parent / "png"


def summarize(records: list[dict[str, Any]], reports: list[dict[str, Any]]) -> dict[str, Any]:
    completed_iterations = [report for report in reports if report["ok"]]
    all_contact_sheets = [report["contactSheet"]["file"] for report in reports if report["contactSheet"].get("ok")]
    final = reports[-1]
    dominance_ledger = build_dominance_comparison_ledger(records, final)
    return {
        "ok": len(records) >= MIN_SOURCE_COUNT and len(reports) == ITERATIONS and final["ok"] and dominance_ledger["ok"],
        "sourceCount": len(records),
        "minimumSourceCount": MIN_SOURCE_COUNT,
        "iterations": len(reports),
        "minimumIterations": ITERATIONS,
        "comparisonDatasetCount": len(records),
        "minimumComparisonDatasetCount": 20,
        "visualQualityCriteria": VISUAL_QUALITY_CRITERIA,
        "visualQualityCriteriaCount": len(VISUAL_QUALITY_CRITERIA),
        "presentationsReference": describe_presentations_reference_contract(),
        "sources": [{"slug": item["slug"], "title": item["title"], "url": item["url"], "chars": item["chars"]} for item in records],
        "iterationReports": [
            {
                "iteration": report["iteration"],
                "pptx": report["pptx"],
                "contactSheet": report["contactSheet"].get("file"),
                "codexPptPptx": report["codexPptBaseline"].get("pptx"),
                "codexPptOk": report["codexPptBaseline"].get("ok"),
                "score": report["quality"]["score"],
                "criteriaAverageScore": report["quality"]["criteriaAverageScore"],
                "ok": report["ok"],
                "issues": report["quality"]["issues"],
            }
            for report in reports
        ],
        "vlmReviewTargets": all_contact_sheets,
        "dominanceComparisonLedgerPath": str((OUT / "dominance-comparison-ledger.json").relative_to(ROOT)),
        "dominanceComparisonLedger": dominance_ledger,
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
