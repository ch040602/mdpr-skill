# 09. Test Plan

## Unit tests

### Element IR

- [x] allowed fields pass.
- [x] forbidden visual fields fail.
- [x] source mapping preserved.
- [x] content metrics computed correctly.

### Feature extractor

- [x] KPI+chart slide computes dataWeight=high.
- [x] long paragraph slide computes narrativeWeight=high.
- [x] large table computes tableCellCount and high overflowRisk.
- [x] code block computes codeLineCount.

### Rule engine

- [x] hard reject removes impossible recipes.
- [x] scoring ranks correct recipe first.
- [x] deterministic tie-break stable across runs.
- [x] diversity penalty changes repeated layout choice when valid alternatives exist.
- [x] coherence penalty removes mixed axes.

### Composition

- [x] all elements receive boxes.
- [x] boxes are inside safe area.
- [x] minimum readable size respected.
- [x] density adaptation downshifts spacing/effects.

### Decoration

- [x] radius family consistent.
- [x] shadow family consistent.
- [x] accent policy consistent.
- [x] effect budget enforced.
- [x] chart/table/KPI variants get expected style specs.

### PPT theme

- [x] all ColorRef in PPTX path are theme refs.
- [x] fallback hex rejected in final PPTX mode.
- [x] semantic tokens map to expected theme slots.

## Integration tests

- [x] `build --style-engine design-components --to html` creates styled HTML.
- [x] `build --style-engine design-components --to pptx` creates editable PPTX.
- [x] `build --style-gallery ...` creates multiple outputs from same Element IR.
- [x] `inspect-style --json` returns full selection trace.
- [x] `lint-style --strict` fails on deliberate violations.

## Snapshot fixtures

```text
fixtures/
  cover-basic.md
  content-long-text.md
  data-kpi-chart.md
  table-large.md
  code-diff.md
  comparison-pros-cons.md
  process-five-steps.md
  timeline-roadmap.md
  summary-actions.md
  mixed-media.md
```

## Golden snapshots

```text
snapshots/
  element-ir/*.json
  features/*.json
  selection-trace/*.json
  styled-deck-ir/*.json
  html/*.html
  pptx-smoke/*.json
```

## CI gates

- [x] `pnpm -r typecheck`
- [x] `pnpm -r test`
- [x] schema validation fixtures
- [x] raw hex lint fixtures
- [x] deterministic snapshot diff
