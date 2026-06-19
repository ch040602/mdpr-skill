# MDPR x Design Components Rule-based Design Skill Pack

![MDPR Design Components Pipeline](docs/assets/pipeline-overview.png)

The LLM is an assistant, not the design authority. It may propose semantic hints, but all final design choices are made by deterministic rules inside `design_components/`.

The pipeline image is generated from a one-slide PowerPoint deck at `docs/assets/pipeline-overview.pptx` and exported as a high-resolution PNG through Microsoft PowerPoint.

This repository is a Codex skill and implementation TODO pack for adding a deterministic Design Components-based design component pipeline to MDPR.

It is explicitly based on these upstream projects:

- Design Components: external-design-source
- MDPR: https://github.com/ch040602/mdpr, also resolved by GitHub as https://github.com/ch040602/MdPr

The local skill drafts in `skills/mdpr-design-components` and `skills/mdpr-design-review` use MDPR as the Markdown presentation splitter and Design Components as the design-rule source. The actual implementation surface lives under `design_components/`; `third_party/design-source/` is only an attribution, license, and upstream-reference boundary, not the runtime home for the port.

## Goal

MDPR remains responsible for content structure: parsing Markdown, splitting slides, splitting elements, and producing semantic metadata. The Design Components layer owns deterministic visual decisions: layout, placement, element sizing, component variants, decoration, effects, and coherence.

```text
Markdown
  -> MDPR Element Splitter
  -> Slide Element IR
  -> Feature Extractor
  -> Design Components Rule Engine
  -> Composition Engine
  -> Decoration Engine
  -> Styled Deck IR
  -> Renderer(PPTX/HTML/PDF)
```

## Core Rules

1. **Rule-based selection only**
   Slide recipes and element variants are selected by deterministic rules, not by an agent.

2. **Agents may provide reasoning hints only**
   Agents may help infer intent, group, or importance candidates. They must not choose recipes, variants, coordinates, colors, or effects directly.

3. **MDPR is the element splitter**
   MDPR must not create `x/y/w/h`, color, radius, shadow, or component variant decisions in `design-components-rule-based` mode.

4. **Design Components owns layout and decoration**
   The Design Components layer selects placement and styling from purpose, density, element mix, content size, deck profile, and rhythm rules.

5. **PPT colors bind to theme slots**
   Final PPTX output should use scheme/theme slots such as `accent1`, `text1`, and `background1` instead of hardcoded hex values by default.

## Pipeline Mode

The new mode name is:

```text
design-components-rule-based
```

It must be opt-in through flag or config. Existing MDPR builds must continue to use the legacy pipeline unless the new mode is explicitly selected.

The project integration directory for Design Components-derived design behavior is:

```text
design_components/
```

`design_components/` contains the rule engine, composition engine, decoration policies, Design Components adapter, and PPTX binding layer needed to apply the imported design system to editable PowerPoint output.

## Theme Gallery vs. Style Gallery

`theme-gallery` belongs to the legacy theme/design-preset path. It varies existing MDPR theme presets without changing the core layout pipeline.

`style-gallery` belongs to the new Design Components path. It renders the same Slide Element IR through multiple Design Components visual profiles, producing comparable outputs and inspect traces from the same content structure.

## Repository Contents

```text
00_EXECUTIVE_SUMMARY.md          Executive summary
01_TARGET_ARCHITECTURE.md        Target architecture
02_ROADMAP_TODO.md               Phase-by-phase roadmap
03_MILESTONES_AND_ACCEPTANCE.md  Milestones and acceptance criteria
04_PACKAGE_TODO.md               Package-level TODOs
05_RULE_ENGINE_SPEC.md           Rule engine design
06_IR_CONTRACTS.md               Element IR and Styled Deck IR contracts
07_PPT_THEME_COLOR_SPEC.md       PPT theme color policy
08_AGENT_BOUNDARY.md             Agent boundary
09_TEST_PLAN.md                  Test plan
10_MIGRATION_PLAN.md             Migration plan from existing MDPR
11_CLI_AND_CONFIG.md             CLI and config design
12_DESIGN_SOURCE_PORT.md             Design Components source port plan
13_IMPLEMENTATION_NOTES.md       Implementation notes
TODO_INDEX.md                    Recommended execution order

todo/                            Phase checklists
schemas/                         Draft JSON schemas
examples/                        Sample config, rulebook, profile, and inspect output
src-scaffolds/                   TypeScript scaffolds
packages/                        Package-level TODOs
design_components/               Runtime design component implementation
skills/                          Codex skill drafts
.github/                         Issue and PR template drafts
adr/                             Architecture decision records
```

## Recommended Start

1. Read `02_ROADMAP_TODO.md` to understand the implementation scope.
2. Start with `todo/phase-00-preflight.md`.
3. Use `schemas/slide-element-ir.schema.json` and `src-scaffolds/element-ir-types.ts` as the first Element IR references.
4. Use `examples/rulebook.sample.yaml` as the minimal rulebook seed for selector work.
5. Do not begin renderer integration until Styled Deck IR is stable enough for snapshot testing.

## Local Validation

Run the pack validator before release:

```bash
npm test
```

The validator checks required reference scaffold files, JSON syntax, README/SOURCES attribution, catalog coverage, and closure of Markdown checklists.

It also runs the Design Components source coverage check and PowerPoint render comparison:

```bash
npm run inventory:design
npm run verify:ppt
npm run compare:ppt
npm run showcase:ppt
```

PowerPoint render artifacts are written under `artifacts/ppt/`. The comparison uses Microsoft PowerPoint COM export to render the generated PPTX to PNG, then compares it with the XML-derived visual proof and overlap pixel samples.

## Guides

- `docs/rulebook-authoring-guide.md`
- `docs/profile-authoring-guide.md`
- `docs/renderer-capability-guide.md`
- `docs/ppt-theme-color-guide.md`
- `docs/agent-hint-guide.md`
- `docs/migration-guide.md`
- `docs/release-checklist.md`
- `docs/design-source-port-coverage.md`
- `docs/ppt-visual-validation.md`
- `docs/component-showcase.html`

## Component Showcase

`docs/component-showcase.html` introduces representative renderer-neutral mappings for editable shapes, layered z-order stacks, chart/KPI surfaces, buttons, tables, timeline/process rails, modal/sheet surfaces, and motion fallbacks.

## Design Components Structure

Design Components concepts are adapted into project-owned modules rather than copied into the upstream reference folder:

- `design_components/rule-engine`: deterministic feature extraction, profile selection, recipe selection, variant selection, and trace sorting.
- `design_components/composition`: layout primitives, region solving, fit constraints, safe areas, and overflow fallback.
- `design_components/decoration`: token references, surface/border/radius/shadow/effect policies, and coherence lint.
- `design_components/design-source-adapter`: upstream Design Components token, skin, motion, and component mapping into renderer-neutral MDPR concepts.
- `design_components/pptx`: editable PPTX object planning and PowerPoint theme color binding for Styled Deck IR.

The design showcase also includes a `mixed-object-stress` slide that combines a raster image, editable text, auto shapes, KPI cards, a native PowerPoint chart, a native PowerPoint table, timeline objects, badges, and callouts in one coherent visual profile. Coherence validation includes a readability rule that every explicit text run must be at least `font size >= 8pt`.

The exported design showcase is intentionally rendered in reverse order: `mixed-object-stress -> notion -> linear -> stripe -> toss`. The generated `design_showcase_report.json` records this in `showcaseOrder`, and `showcase_slide_1.png` is the mixed-object stress test.

## Render Comparison Artifacts

- `artifacts/ppt/design_components_z_order_validation.pptx`
- `artifacts/ppt/design_components_z_order_validation.png`
- `artifacts/ppt/powerpoint_render.png`
- `artifacts/ppt/z_order_report.json`
- `artifacts/ppt/powerpoint_render_compare.json`
- `artifacts/design-showcase/design_components_showcase.pptx`
- `artifacts/design-showcase/showcase_slide_1.png`
- `artifacts/design-showcase/showcase_slide_2.png`
- `artifacts/design-showcase/showcase_slide_3.png`
- `artifacts/design-showcase/showcase_slide_4.png`
- `artifacts/design-showcase/showcase_slide_5.png`
- `artifacts/design-showcase/assets/mixed_object_reference.png`
- `artifacts/design-showcase/design_showcase_report.json`

## Design Showcase Deck

`artifacts/design-showcase/design_components_showcase.pptx` is a rendered PowerPoint deck built from the existing Design Components project references. It uses the Toss, Stripe, Linear, and Notion skins and ports representative Design Components patterns such as `stat-card`, `chart-card`, `ranked-list`, and `insight-card` into editable PowerPoint text and shape objects. The generated report checks that each rendered slide has visible content, that every slide keeps a coherent accent, radius family, shadow family, and minimum readable text size, and that the stress slide contains picture, table, chart, text, and auto-shape object types.

## Target Commands

The intended final implementation should support commands like:

```bash
mdpresent build deck.md --style-engine design-components --style-select rule-based --to pptx
mdpresent build deck.md --style-engine design-components --profile sharp-technical --to pptx
mdpresent build deck.md --style-gallery friendly-dashboard,layered-product,minimal-system --to pptx
mdpresent inspect-style deck.md --show-features --show-selected-recipes --json
mdpresent lint-style deck.md --style-engine design-components --strict
```

## Attribution and Licensing

Design Components upstream metadata is tracked in `SOURCES.md` and `third_party/design-source/UPSTREAM.md`. Design Components is recorded as MIT-licensed in the vendoring plan; keep its license notice with any copied or adapted upstream content. Project-owned adaptations belong under `design_components/`, not under `third_party/design-source/`.
