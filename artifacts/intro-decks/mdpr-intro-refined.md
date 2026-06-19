# MDPR Visual Diversification

## Runtime Boundary

- MDPR: deterministic parsing, splitting, layout, color harmony, rendering, and validation.
- mdpr-skill: optional compact semantic hints before deterministic selection.
- LLM scope: intent, grouping, importance candidates, and ambiguity notes only.
- Rule scope: slide splits, coordinates, typography, colors, z-order, effects, arrows, tables, charts, and PPTX objects.

## Numeric Evidence Beside Reading

- Purpose: compare quantitative signal and interpretation in one pass.
- Layout hint: keep the explanation short enough for chart-beside-prose placement.
- Rule boundary: MDPR chooses coordinates, theme colors, and chart objects.

```chart
labels: Parse, Split, Layout, Render
Before: 56, 64, 70, 62
After: 82, 88, 91, 87
```

## Parallel Table And Graph

```chart
labels: Table, Chart, Text, Theme
Coherence: 89, 92, 86, 91
```

| Area | Rule-based behavior | Validation signal |
| --- | --- | --- |
| Table | Header weight and numeric alignment | readable cells |
| Chart | Theme-bound palette tokens | editable chart |
| Text | Minimum readable font floor | bounded frame |

## Visual Families

- Sequence rail: ordered steps, consistent arrow semantics, restrained accent.
- Proof point: metric, callout line, contrast chip, and evidence table.
- Comparison: two balanced regions with shared baseline and matching text floors.
- Text relief: one quiet monochrome icon slot when a prose slide would otherwise be plain.

## Reuse Contract

- This Markdown is the reusable LLM-hint version.
- The LLM does not select the final theme, coordinates, variants, or object geometry.
- MDPR can rebuild the same source under every design preset through `--theme-gallery`.
