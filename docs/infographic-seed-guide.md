# Infographic Seed Guide

This project already had several local sources related to infographic construction:

- `examples/recipe-catalog.sample.yaml`: process, timeline, roadmap, ranked/list, and callout recipe coverage.
- `examples/element-variant-catalog.sample.yaml`: `list.timeline`, `list.stepCards`, `callout.*`, and importance-aware variant scoring.
- `scripts/create_design_showcase_deck.py`: editable PowerPoint timeline, callout, KPI, chart, table, and mixed-object stress examples.
- `docs/component-showcase.html`: renderer-neutral visual examples for timeline/process rails and component mappings.
- `design_components/composition/src/regionSolver.ts`: initial region allocation for data and content slides.
- `packages/core/src/buildSlideElementIR.ts` and `packages/core/src/inference.ts`: source of `importance` and content metadata.

The new infographic seed layer applies those pieces to teaser-grade page composition.

PPT BIZCAM references were reviewed for design method vocabulary rather than copied assets. The latest structural pass sampled 32 public PPTX files across 14 category IDs and analyzed 314 slides. Relevant recurring methods include simple shape systems, table grid systems, small icon markers, arc/ring charts, line graphs used as background, gauge-like charts, connected chart strips, target-ring frames, pictorial metaphor charts, and equal-geometry quadrant layouts. See `docs/pptbizcam-pattern-taxonomy.md`.

## Deterministic Inputs

The planner uses renderer-neutral content metadata:

- relation intent: `cycle`, `sequence`, `list`, or `auto`;
- item count;
- `contentMetrics.textChars`;
- item `importance`;
- source order.
- chart/data shape, such as ratio, trend, score, multi-stage, goal, or comparison;
- whether an image or metaphor is required.

The LLM may suggest semantic intent or importance candidates, but it must not choose coordinates, colors, effects, or infographic family IDs directly.

## Families

`cycle-loop` is used for short feedback or iteration content. Labels stay compact, the highest-importance node becomes the entry node, and arrows connect node boundaries rather than text centers.

`ordered-rail` is used for sequential steps. Same-role steps share a rail and arrow style. Importance changes node scale and label weight without creating unrelated colors.

`ranked-stack` is used for long text or uneven importance. The highest-importance item becomes a lead tile, while lower-priority items become compact rows.

## Chart Diagram Families

`arc-ring-chart` is used for short ratio or progress labels. MDPR now renders this as editable PPTX shapes through the `arc-ring` chart kind. The important segment receives a thicker arc or contrast cap.

`gauge-dial-chart` is used for score, risk, and readiness slides where a needle or dial communicates status faster than a generic bar. MDPR now renders this as editable PPTX shapes through the `gauge` chart kind.

`line-graph-background` is used when trend data exists but the slide needs a strong foreground claim. The chart is pushed behind text with restrained contrast.

`connected-chart-strip` is used when multiple small charts need to read as one flow. MDPR now renders this as editable PPTX shapes through the `connected-strip` chart kind and keeps same-role connector styling consistent.

`target-ring-frame` is used for goals, accuracy, focus, or benchmarks.

`pictorial-metaphor-chart` is used only when MDPR detects an image/metaphor need or the slide already has a relevant image. Otherwise, the renderer should prefer abstract editable chart shapes.

## Generated Proof

Run:

```bash
npm run infographic:gallery
```

The command writes:

- `docs/assets/infographic-seed-gallery.svg`
- `docs/assets/infographic-seed-gallery.pptx`
- `docs/assets/infographic-seed-gallery.png`
- `docs/assets/infographic-seed-gallery-report.json`

The report verifies that the rendered PNG has content and that tracked text boxes stay inside their parent infographic objects.

MDPR-specific chart proof validation is stored in `artifacts/chart-proof-objects/`. The generated deck contains editable `arc-ring`, `gauge`, and `connected-strip` proof objects plus a native bar chart baseline. `validation-report.json` verifies PowerPoint PNG export, a single native chart part for the baseline, separated TOC text boxes, and minimum rendered text size of at least `14pt`.
