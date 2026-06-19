# Infographic Seed Guide

This project already had several local sources related to infographic construction:

- `examples/recipe-catalog.sample.yaml`: process, timeline, roadmap, ranked/list, and callout recipe coverage.
- `examples/element-variant-catalog.sample.yaml`: `list.timeline`, `list.stepCards`, `callout.*`, and importance-aware variant scoring.
- `scripts/create_design_showcase_deck.py`: editable PowerPoint timeline, callout, KPI, chart, table, and mixed-object stress examples.
- `docs/component-showcase.html`: renderer-neutral visual examples for timeline/process rails and component mappings.
- `design_components/composition/src/regionSolver.ts`: initial region allocation for data and content slides.
- `packages/core/src/buildSlideElementIR.ts` and `packages/core/src/inference.ts`: source of `importance` and content metadata.

The new infographic seed layer applies those pieces to teaser-grade page composition.

## Deterministic Inputs

The planner uses renderer-neutral content metadata:

- relation intent: `cycle`, `sequence`, `list`, or `auto`;
- item count;
- `contentMetrics.textChars`;
- item `importance`;
- source order.

The LLM may suggest semantic intent or importance candidates, but it must not choose coordinates, colors, effects, or infographic family IDs directly.

## Families

`cycle-loop` is used for short feedback or iteration content. Labels stay compact, the highest-importance node becomes the entry node, and arrows connect node boundaries rather than text centers.

`ordered-rail` is used for sequential steps. Same-role steps share a rail and arrow style. Importance changes node scale and label weight without creating unrelated colors.

`ranked-stack` is used for long text or uneven importance. The highest-importance item becomes a lead tile, while lower-priority items become compact rows.

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
