# Phase 11 - Renderer Integration

## Goal

Render `StyledDeckIR` to PPTX, HTML, and PDF.

## Tasks

### PPTX

- [x] Add `renderStyledDeckToPptx()` entry point.
- [x] Map `StyledElement` to editable text, shape, table, and chart objects.
- [x] Render surfaces as shapes.
- [x] Map shadows, radius, and borders.
- [x] Render charts, tables, and KPI objects.
- [x] Add optional source mapping metadata debug output.
- [x] Do not flatten primary text.

### HTML

- [x] Add `renderStyledDeckReportHtml()` entry point.
- [x] Generate CSS variables.
- [x] Generate profile/recipe/variant data attributes.
- [x] Generate optional motion classes.
- [x] Respect reduced motion.

### PDF

- [x] Connect styled HTML print path.
- [x] Verify static fallback.
- [x] Verify print CSS.

## Acceptance

- [x] The same `StyledDeckIR` renders to all three formats.
- [x] Primary PPTX text and shapes are editable.
- [x] HTML has semantic structure and CSS variables.
- [x] PDF uses static effects only.
