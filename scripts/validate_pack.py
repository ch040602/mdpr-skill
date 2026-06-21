#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "README.md",
    "pipeline.md",
    "SOURCES.md",
    "todo.json",
    "schemas/slide-element-ir.schema.json",
    "schemas/styled-deck-ir.schema.json",
    "schemas/rulebook.schema.json",
    "schemas/agent-hint.schema.json",
    "schemas/element-variant.schema.json",
    "schemas/slide-recipe.schema.json",
    "packages/core/src/buildSlideElementIR.ts",
    "packages/core/src/computeContentMetrics.ts",
    "packages/element-ir/src/schema.ts",
    "packages/element-ir/src/validators.ts",
    "packages/element-ir/src/normalize.ts",
    "packages/element-ir/src/metrics.ts",
    "packages/element-ir/fixtures/sample-slide-element-ir.json",
    "design_components/rule-engine/src/features/extractFeatures.ts",
    "design_components/rule-engine/src/profiles/selectProfile.ts",
    "design_components/rule-engine/src/rules/evaluateCondition.ts",
    "design_components/rule-engine/src/select/selectRecipe.ts",
    "design_components/rule-engine/src/select/selectVariant.ts",
    "design_components/rule-engine/src/trace/stableSort.ts",
    "design_components/composition/src/regionSolver.ts",
    "design_components/composition/src/fit.ts",
    "design_components/composition/src/infographicPlanner.ts",
    "design_components/decoration/src/decorators/buildDecoration.ts",
    "design_components/decoration/src/lint/coherenceLint.ts",
    "design_components/decoration/src/tokens/colorHarmony.ts",
    "design_components/design-source-adapter/src/upstream.ts",
    "design_components/design-source-adapter/src/tokenMapper.ts",
    "design_components/pptx/src/renderStyledDeck.ts",
    "design_components/pptx/src/themeColors.ts",
    "packages/render-html/src/renderStyledDeck.ts",
    "packages/render-pdf/src/renderStyledDeck.ts",
    "packages/cli/src/commands/inspectStyle.ts",
    "packages/cli/src/commands/lintStyle.ts",
    "packages/cli/src/commands/buildStyleGallery.ts",
    "examples/style-gallery/manifest.json",
    "examples/style-gallery/friendly-dashboard.inspect.json",
    "examples/style-gallery/sharp-technical.inspect.json",
    "third_party/design-source/UPSTREAM.md",
    "third_party/design-source/LICENSE",
    "design_components/README.md",
    "design_components/design-source-adapter/port-manifest.json",
    "design_components/design-source-adapter/reference/DESIGN-LANGUAGE.md",
    "design_components/design-source-adapter/reference/VISUAL-CRAFT.md",
    "design_components/design-source-adapter/tokens/semantic-tokens.json",
    "design_components/design-source-adapter/motion/motion-map.json",
    "design_components/design-source-adapter/skins/arc.json",
    "design_components/design-source-adapter/skins/linear.json",
    "design_components/design-source-adapter/skins/notion.json",
    "design_components/design-source-adapter/skins/raycast.json",
    "design_components/design-source-adapter/skins/stripe.json",
    "design_components/design-source-adapter/skins/toss.json",
    "design_components/design-source-adapter/skins/vercel.json",
    "design_components/design-source-adapter/seeds/visual-diversification-seeds.json",
    "design_components/pptx/src/renderStyledElement.ts",
    "docs/rulebook-authoring-guide.md",
    "docs/profile-authoring-guide.md",
    "docs/renderer-capability-guide.md",
    "docs/ppt-theme-color-guide.md",
    "docs/agent-hint-guide.md",
    "docs/migration-guide.md",
    "docs/release-notes.md",
    "docs/release-checklist.md",
    "docs/infographic-seed-guide.md",
    "docs/design-source-port-coverage.md",
    "docs/ppt-visual-validation.md",
    "docs/component-showcase.md",
    "docs/component-showcase.html",
    "docs/assets/pipeline-overview.svg",
    "docs/assets/pipeline-overview.pptx",
    "docs/assets/pipeline-overview.png",
    "docs/assets/pipeline-overview-layout.json",
    "docs/assets/pipeline-overview-report.json",
    "docs/assets/infographic-seed-gallery.svg",
    "docs/assets/infographic-seed-gallery.pptx",
    "docs/assets/infographic-seed-gallery.png",
    "docs/assets/infographic-seed-gallery-report.json",
    "reports/design-source-inventory.json",
    "artifacts/ppt/design_components_z_order_validation.pptx",
    "artifacts/ppt/design_components_z_order_validation.png",
    "artifacts/ppt/z_order_report.json",
    "artifacts/ppt/powerpoint_render.png",
    "artifacts/ppt/powerpoint_render_compare.json",
    "scripts/create_pipeline_overview_asset.py",
    "scripts/create_infographic_seed_gallery.py",
    "scripts/build_reference_object_rules.py",
    "scripts/create_release_check_deck.py",
    "scripts/install_mdpr.py",
    "docs/mdpr-installation.md",
    "docs/mdpr-pandoc-integration.md",
    "docs/monotone-icon-slot-guide.md",
    "docs/mdpr-vs-skill-results.md",
    "scripts/check_mdpr_pandoc_update.py",
    "scripts/create_design_showcase_deck.py",
    "scripts/create_mdpr_vs_skill_decks.py",
    "artifacts/design-showcase/design_components_showcase.pptx",
    "artifacts/design-showcase/showcase_slide_1.png",
    "artifacts/design-showcase/showcase_slide_2.png",
    "artifacts/design-showcase/showcase_slide_3.png",
    "artifacts/design-showcase/showcase_slide_4.png",
    "artifacts/design-showcase/showcase_slide_5.png",
    "artifacts/design-showcase/assets/mixed_object_reference.png",
    "artifacts/design-showcase/design_showcase_report.json",
    "artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx",
    "artifacts/mdpr-vs-skill/mdpr-skill-result.pptx",
    "artifacts/mdpr-vs-skill/mdpr-source-corpus.md",
    "artifacts/mdpr-vs-skill/source-manifest.json",
    "artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json",
    "artifacts/reference-pattern-analysis/derived-object-rules.json",
    "artifacts/reference-pattern-analysis/structural-summary.json",
    "artifacts/release-check/mdpr-skill-release-check.md",
    "artifacts/release-check/mdpr-skill-release-check.pptx",
    "artifacts/release-check/mdpr-skill-release-check-report.json",
]

REQUIRED_TEXT = {
    "README.md": [
        "https://github.com/ch040602/mdpr",
        "thin Codex skill companion",
        "Difference from MDPR",
        "Installation",
        "npm install",
        "npm run install:mdpr",
        "npm run check:mdpr",
        "npm run check:mdpr-pandoc",
        "npm run validate",
        "docs/mdpr-installation.md",
        "Repository Structure",
        "Forbidden skill outputs",
        "artifacts/release-check/mdpr-skill-release-check.md",
        "artifacts/release-check/mdpr-skill-release-check.pptx",
        "artifacts/release-check/mdpr-skill-release-check-report.json",
        "docs/assets/pipeline-overview.pptx",
        "docs/assets/pipeline-overview.png",
        "artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx",
        "artifacts/mdpr-vs-skill/mdpr-skill-result.pptx",
    ],
    "docs/ppt-theme-color-guide.md": [
        "Adobe Color Wheel",
        "monochromatic",
        "analogous",
        "complementary",
        "split-complementary",
        "triadic",
        "WCAG contrast ratio",
        "ThemeColorRef",
    ],
    "docs/mdpr-pandoc-integration.md": [
        "MDPR parser(simple or Pandoc)",
        "MDPR Presentation IR",
        "Design Components skill starts after that content contract",
        "mdpresent build deck.md --parser pandoc",
        "npm run check:mdpr-pandoc",
    ],
    "docs/monotone-icon-slot-guide.md": [
        "monotone-icon-aside",
        "PowerPoint built-in icon",
        "Free SVG icon",
        "Use one icon only",
        "icon.monotoneAside",
    ],
    "docs/mdpr-vs-skill-results.md": [
        "MDPR baseline PPTX",
        "Current skill PPTX",
        "artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx",
        "artifacts/mdpr-vs-skill/mdpr-skill-result.pptx",
        "npm run compare:mdpr-skill",
    ],
    "docs/mdpr-installation.md": [
        "optional visual-review skill pack",
        "MDPR_SOURCE_DIR",
        "MDPR_INSTALL_DIR",
        "npm run install:mdpr",
        ".cache/mdpr",
        "This repository only adds",
    ],
    "docs/infographic-seed-guide.md": [
        "cycle-loop",
        "ordered-rail",
        "ranked-stack",
        "contentMetrics.textChars",
        "pictorial-metaphor-chart",
        "line-graph-background",
        "npm run infographic:gallery",
    ],
    "pipeline.md": [
        "pipeline-image",
        "sage-editorial",
        "proof-callout pattern",
        "Optional agent tags",
        "Deterministic rules own layout",
    ],
    "design_components/design-source-adapter/seeds/visual-diversification-seeds.json": [
        "proof-point-callout",
        "cycle-loop",
        "ordered-rail",
        "ranked-stack",
        "arc-ring-chart",
        "line-graph-background",
        "pictorial-metaphor-chart",
        "monotone-icon-aside",
        "ppt-builtin-icon",
        "free-svg-icon",
        "contrast-chip",
        "metric-swatch",
        "flow",
        "contrast",
        "Adobe Color Wheel harmony rules",
        "monochromatic",
        "split-complementary",
        "triadic",
        "WCAG contrast ratio",
        "derivedObjectPatterns",
        "referenceRulePolicy",
    ],
    "SOURCES.md": [
        "34e9fcf2d3da69355defad7afa5e50ff15ed8cb2",
        "4c9559cb34d1e539226449c1298dc2248a89ac98",
        "MIT",
    ],
    "third_party/design-source/UPSTREAM.md": [
        "external-design-source",
        "34e9fcf2d3da69355defad7afa5e50ff15ed8cb2",
        "MIT",
    ],
}


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def check_required_files() -> None:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    if missing:
        fail("missing required files: " + ", ".join(missing))


def check_json_files() -> None:
    for path in ROOT.rglob("*.json"):
        if ".codex" in path.parts or ".cache" in path.parts:
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            fail(f"invalid JSON {path.relative_to(ROOT)}: {exc}")


def check_required_text() -> None:
    for path, needles in REQUIRED_TEXT.items():
        text = read(path)
        for needle in needles:
            if needle not in text:
                fail(f"{path} missing required text: {needle}")


def check_no_unchecked_boxes() -> None:
    offenders: list[str] = []
    for path in ROOT.rglob("*.md"):
        if ".codex" in path.parts or ".cache" in path.parts:
            continue
        for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if re.search(r"- \[ \]", line):
                offenders.append(f"{path.relative_to(ROOT)}:{line_no}:{line.strip()}")
    if offenders:
        fail("unchecked boxes remain:\n" + "\n".join(offenders[:50]))


def check_no_reference_source_leaks() -> None:
    terms = [
        bytes([112, 112, 116, 98, 105, 122, 99, 97, 109]),
        bytes([112, 112, 116, 98, 105, 122]),
        bytes([112, 112, 116, 32, 98, 105, 122]),
    ]
    tracked = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
    ).stdout.decode("utf-8", errors="replace").split("\0")
    offenders: list[str] = []
    for rel in tracked:
        if not rel:
            continue
        path = ROOT / rel
        if not path.is_file():
            continue
        data = path.read_bytes().lower()
        if any(term in data for term in terms):
            offenders.append(rel)
    if offenders:
        fail("source-specific reference identifiers found in tracked files:\n" + "\n".join(offenders[:50]))


def check_catalog_coverage() -> None:
    recipe_catalog = read("examples/recipe-catalog.sample.yaml")
    for recipe in [
        "cover.heroMinimal",
        "section.bigNumber",
        "content.cardStack",
        "content.textWithMonotoneIcon",
        "data.kpiRailChart",
        "comparison.twoColumnCards",
        "process.horizontalSteps",
        "timeline.roadmap",
        "code.windowFocus",
        "summary.keyTakeaways",
    ]:
        if recipe not in recipe_catalog:
            fail(f"recipe catalog missing {recipe}")
    variant_catalog = read("examples/element-variant-catalog.sample.yaml")
    for variant in ["title.hero", "paragraph.body", "list.checklist", "icon.monotoneAside", "kpi.heroNumber", "chart.cardWithContext", "table.compactGrid", "code.window", "callout.insight", "image.cardFrame"]:
        if variant not in variant_catalog:
            fail(f"variant catalog missing {variant}")


def check_reference_object_rules() -> None:
    seeds = json.loads(read("design_components/design-source-adapter/seeds/visual-diversification-seeds.json"))
    analysis = seeds.get("observedReferenceAnalysis", {})
    if analysis.get("sourceClass") != "approved presentation reference corpus; source identities omitted":
        fail("reference analysis must omit source identities")
    patterns = seeds.get("derivedObjectPatterns", [])
    if len(patterns) < 50:
        fail(f"expected at least 50 derived object patterns, found {len(patterns)}")
    report = json.loads(read("artifacts/reference-pattern-analysis/derived-object-rules.json"))
    if report.get("sourceClass") != "approved presentation reference corpus; source identities omitted":
        fail("reference object report must omit source identities")
    if report.get("pptDownloaded", 0) < 80:
        fail("expected at least 80 downloaded PPT files in reference report")
    if report.get("slidesAnalyzed", 0) < 700:
        fail("expected at least 700 analyzed slides in reference report")
    if report.get("renderedPngSlides", 0) < 1200:
        fail("expected at least 1200 rendered PowerPoint PNG slides in reference report")
    if report.get("pngSamplesAnalyzed", 0) < 120:
        fail("expected at least 120 PNG samples analyzed in reference report")
    if report.get("derivedObjectPatternCount", 0) < 60:
        fail("expected at least 60 derived object patterns in reference report")


def check_theme_decoration_coverage() -> None:
    catalog = json.loads(read("design_components/decoration/src/decorators/objectShapeCatalog.json"))
    patterns = catalog.get("patterns", [])
    unique_kinds = {pattern.get("kind") for pattern in patterns}
    archetypes = {pattern.get("archetype") or f"{pattern.get('family')}:{pattern.get('shapeGrammar')}" for pattern in patterns}
    families = {pattern.get("family") for pattern in patterns}
    card_ratio = sum(1 for pattern in patterns if pattern.get("family") == "card") / len(patterns) if patterns else 1
    token_ready = [
        pattern for pattern in patterns
        if {"surface", "line", "text"}.issubset(set(pattern.get("themeBindings", [])))
        or {"line", "accent", "text"}.issubset(set(pattern.get("themeBindings", [])))
    ]
    if len(patterns) < 50 or len(unique_kinds) < 50 or len(archetypes) < 50:
        fail(f"expected at least 50 distinct structural object patterns, found {len(patterns)} patterns / {len(unique_kinds)} kinds / {len(archetypes)} archetypes")
    if len(families) < 12:
        fail(f"expected at least 12 object families, found {len(families)}")
    if card_ratio > 0.4:
        fail(f"card-like object ratio is too high: {card_ratio:.2f}")
    if len(token_ready) < 50:
        fail(f"expected at least 50 theme-token-ready object patterns, found {len(token_ready)}")
    report_path = ROOT / "artifacts/theme-decoration-review/theme-decoration-coverage-report.json"
    if report_path.exists():
        report = json.loads(report_path.read_text(encoding="utf-8"))
        if not report.get("ok"):
            fail("theme decoration coverage report is not ok")


def check_release_check_deck() -> None:
    report = json.loads(read("artifacts/release-check/mdpr-skill-release-check-report.json"))
    if not report.get("ok"):
        fail("release check deck report is not ok")
    pptx_validation = report.get("pptxValidation", {})
    min_font = pptx_validation.get("minFontSizePt")
    if min_font is None or float(min_font) < 14.0:
        fail(f"release check deck font floor failed: {min_font}")
    png_validation = report.get("pngValidation", [])
    if not png_validation:
        fail("release check deck has no PowerPoint PNG validation entries")
    if not all(item.get("hasContent") for item in png_validation):
        fail("release check deck has blank or unreadable PowerPoint PNG export")


def main() -> None:
    check_required_files()
    check_json_files()
    check_required_text()
    check_catalog_coverage()
    check_reference_object_rules()
    check_theme_decoration_coverage()
    check_release_check_deck()
    check_no_reference_source_leaks()
    check_no_unchecked_boxes()
    print("mdpr-skill pack validation passed")


if __name__ == "__main__":
    main()
