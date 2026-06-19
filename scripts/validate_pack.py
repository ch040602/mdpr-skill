#!/usr/bin/env python3
from __future__ import annotations

import json
import re
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
    "design_components/decoration/src/decorators/buildDecoration.ts",
    "design_components/decoration/src/lint/coherenceLint.ts",
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
    "design_components/pptx/src/renderStyledElement.ts",
    "docs/rulebook-authoring-guide.md",
    "docs/profile-authoring-guide.md",
    "docs/renderer-capability-guide.md",
    "docs/ppt-theme-color-guide.md",
    "docs/agent-hint-guide.md",
    "docs/migration-guide.md",
    "docs/release-notes.md",
    "docs/release-checklist.md",
    "docs/design-source-port-coverage.md",
    "docs/ppt-visual-validation.md",
    "docs/component-showcase.md",
    "docs/component-showcase.html",
    "docs/assets/pipeline-overview.svg",
    "docs/assets/pipeline-overview.pptx",
    "docs/assets/pipeline-overview.png",
    "docs/assets/pipeline-overview-layout.json",
    "docs/assets/pipeline-overview-report.json",
    "reports/design-source-inventory.json",
    "artifacts/ppt/design_components_z_order_validation.pptx",
    "artifacts/ppt/design_components_z_order_validation.png",
    "artifacts/ppt/z_order_report.json",
    "artifacts/ppt/powerpoint_render.png",
    "artifacts/ppt/powerpoint_render_compare.json",
    "scripts/create_pipeline_overview_asset.py",
    "scripts/create_design_showcase_deck.py",
    "artifacts/design-showcase/design_components_showcase.pptx",
    "artifacts/design-showcase/showcase_slide_1.png",
    "artifacts/design-showcase/showcase_slide_2.png",
    "artifacts/design-showcase/showcase_slide_3.png",
    "artifacts/design-showcase/showcase_slide_4.png",
    "artifacts/design-showcase/showcase_slide_5.png",
    "artifacts/design-showcase/assets/mixed_object_reference.png",
    "artifacts/design-showcase/design_showcase_report.json",
]

REQUIRED_TEXT = {
    "README.md": [
        "external-design-source",
        "https://github.com/ch040602/mdpr",
        "design-components-rule-based",
        "style-gallery",
        "theme-gallery",
        "PowerPoint render comparison",
        "docs/assets/pipeline-overview.svg",
        "docs/assets/pipeline-overview-layout.json",
        "docs/assets/pipeline-overview.png",
        "docs/assets/pipeline-overview.pptx",
        "design_components/",
        "docs/component-showcase.html",
        "design_components_showcase.pptx",
        "mixed-object-stress",
        "mixed-object-stress -> notion -> linear -> stripe -> toss",
        "font size >= 8pt",
    ],
    "pipeline.md": [
        "pipeline-image",
        "sage-editorial",
        "LLM reasoning supplies hints",
        "Deterministic rules own layout",
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


def check_catalog_coverage() -> None:
    recipe_catalog = read("examples/recipe-catalog.sample.yaml")
    for recipe in [
        "cover.heroMinimal",
        "section.bigNumber",
        "content.cardStack",
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
    for variant in ["title.hero", "paragraph.body", "list.checklist", "kpi.heroNumber", "chart.cardWithContext", "table.compactGrid", "code.window", "callout.insight", "image.cardFrame"]:
        if variant not in variant_catalog:
            fail(f"variant catalog missing {variant}")


def main() -> None:
    check_required_files()
    check_json_files()
    check_required_text()
    check_catalog_coverage()
    check_no_unchecked_boxes()
    print("mdpr-skill pack validation passed")


if __name__ == "__main__":
    main()
