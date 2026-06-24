# Phase 19 - Diagram, Component, and Design Import Roadmap

## Goal

Register the FMF design-grammar proposal as review-driven TODOs and execute it
without breaking the MDPR ownership boundary.

The target split is:

| Area | Owning repo | Role |
| --- | --- | --- |
| Diagram grammar, shape components, native PPT rendering | MDPR | Deterministic no-agent runtime capability |
| DESIGN.md, HTML design analysis, theme/pack proposal | mdpr-skill | Agent-assisted analysis and proposal generation with gates |
| Exact PPT shape selection, coordinates, style snapshots | future mdpr-ppt | User-approved PowerPoint bridge rail |

## Critical Review Decision

Accepted:

- Keep diagram grammar and PPT native component rendering in MDPR.
- Keep DESIGN.md and HTML design analysis in mdpr-skill as proposal rails.
- Let mdpr-skill emit theme/component/diagram candidates only with provenance,
  approval requirements, and gates.
- Treat exact PowerPoint coordinates and style snapshots as mdpr-ppt approved
  rail data, not as mdpr-skill hints.

Rejected:

- Letting mdpr-skill directly choose final diagram coordinates, raw theme
  colors for agent hints, exact component variants, renderer object IDs, or
  exact icon paths.
- Copying external design-system screenshots, brand assets, or exact visual
  layouts into this repository as source material.

Deferred to MDPR:

- `packages/diagram`, `packages/component`, and `packages/pack`.
- `diagram-ir.schema.json`, `component-ir.schema.json`, `mdpr-pack.schema.json`,
  and MDPR-side theme import.
- PPT native diagram/component render dispatchers and object mapping metadata.

Deferred to future mdpr-ppt:

- PowerPoint selected-shape capture.
- OOXML fallback extractor.
- Exact bbox/style snapshot export.

## Registered TODOs

### DESIGN-P0-001 - Add DESIGN.md import core

Priority: P0  
Owner: `mdpr-skill`
Status: completed in first production slice.

Completed work:

- Added `packages/design-import-core`.
- Added `parseDesignMd()`.
- Added `buildThemeCandidateFromDesignMd()`.
- Parsed DESIGN.md frontmatter and Markdown rationale sections with a minimal
  dependency-free parser.
- Normalized common tokens into an `mdpr-theme-candidate-v1`.
- Preserved source provenance with `sourceSha256`, `generatedBy`, and
  `generatedAt`.
- Required approval before runtime use.
- Rejected final MDPR runtime authority: no layout coordinates, z-order, renderer
  IDs, exact icon paths, or direct MDPR recipe choices.

Acceptance:

- [x] A minimal DESIGN.md can produce a theme candidate with colors, typography,
  spacing, shape, and rationale.
- [x] The candidate carries provenance and `requiresApproval: true`.
- [x] Tests reject unsupported final-decision fields.

### DESIGN-P0-002 - Add theme candidate schema and gates

Priority: P0  
Owner: `mdpr-skill`
Status: completed in this production slice.

Completed work:

- Added `schemas/mdpr-theme-candidate.schema.json`.
- Added schema contract test.
- Added `themeCandidateGate()` for provenance, approval, token-shape, and
  forbidden final-decision field checks.
- Kept raw color tokens legal only in the theme candidate rail, not in
  `agent-hint.json`.

Acceptance:

- [x] Schema contract is tested.
- [x] Gate fails missing provenance or approval requirement.
- [x] Boundary docs explain why color tokens are legal here but forbidden in hints.

### DESIGN-P0-003 - Add CLI export for design import

Priority: P0  
Owner: `mdpr-skill`
Status: completed in this production slice.

Completed work:

- Added `packages/cli/src/commands/design.ts`.
- Exported design import helpers for future argv command wiring.
- Added npm runtime test script for the CLI design boundary.

Acceptance:

- [x] `packages/cli/src/index.ts` exposes design import APIs.
- [x] Tests cover CLI export boundary.

### DESIGN-P1-004 - Add HTML design analysis model

Priority: P1  
Owner: `mdpr-skill`
Status: completed in this production slice.

Completed work:

- Added `mdpr-html-design-analysis-v1` types and schema.
- Modeled extracted colors, typography, spacing, radius, elevation, layout motifs,
  component patterns, and PPT effect feasibility.
- Kept network/browser capture out of this slice; analysis is deterministic over
  local HTML strings.

Acceptance:

- [x] Local HTML-like input can produce a deterministic analysis object.
- [x] Effects are classified as native-editable, approximation, raster-risk, or
  unsupported.

### DESIGN-P1-005 - Add CSS-to-PPT effect feasibility mapper

Priority: P1  
Owner: `mdpr-skill`
Status: completed in this production slice.

Completed work:

- Added `mapCssDeclarationToPptEffect()`.
- Mapped common CSS effects to PPT-native or approximation categories.
- Flagged backdrop blur, clip-path, animation, and raster-risk declarations.

Acceptance:

- [x] Tests cover background, border, radius, shadow, gradient, blur, font, grid,
  and unsupported effects.

### DESIGN-P1-006 - Add design review findings

Priority: P1  
Owner: `mdpr-skill`
Status: completed in this production slice.

Completed work:

- Added `reviewDesignPolicy()`.
- Added first production-slice findings for PPT unsupported effects, raster
  primary content risk, component style drift, diagram complexity budget, and
  diagram accent budget overuse.
- Deferred token reference, brand clone, and contrast-specific rules until MDPR
  exposes approved pack/theme import and a brand-safe asset rail to validate.

Acceptance:

- [x] Findings include evidence and MDPR policy/config suggestions only.
- [x] Findings do not include final coordinates, exact colors as suggestions, exact
  component variants, or renderer object IDs.

### DESIGN-P2-007 - Add eval comparison for theme/pack candidates

Priority: P2  
Owner: `mdpr-skill`
Status: deferred until MDPR supports approved theme/pack import.

Work:

- Extend eval-core to compare baseline vs candidate-assisted builds once MDPR
  can import packs/themes.
- Keep candidate application behind approval gates.

Acceptance:

- Eval report distinguishes candidate gate failure, MDPR adapter failure, and
  visual/coherence regression.

### MDPR-P0-008 - Add deterministic diagram package

Priority: P0  
Owner: MDPR
Status: deferred to MDPR repository.

Work:

- Add `packages/diagram`.
- Add `DiagramIR`, 14+ diagram type registry, grammar rules, layout, taste gates,
  and PPT native renderer dispatcher.

Acceptance:

- Markdown diagram blocks can render to editable PPT shapes/connectors without
  agent runtime.

### MDPR-P0-009 - Add deterministic component package

Priority: P0  
Owner: MDPR
Status: deferred to MDPR repository.

Work:

- Add `packages/component`.
- Add component taxonomy for cards, badges, callouts, progress, steppers,
  timeline, quote, tabs, separators, breadcrumbs, tree views, and hero blocks.

Acceptance:

- Components render as editable PPT-native shapes and text.
- Layout engine owns placement.

### MDPR-P1-010 - Add pack/theme import runtime

Priority: P1  
Owner: MDPR
Status: deferred to MDPR repository.

Work:

- Add `packages/pack`.
- Add `mdpresent pack validate/import/list/preview`.
- Add schemas for packs, themes, diagram IR, component IR, and PPTX object maps.

Acceptance:

- MDPR can import approved packs/themes without agent runtime.
- Pack import rejects unsafe external assets and non-editable primary content.

### PPT-P2-011 - Add PowerPoint bridge repository

Priority: P2  
Owner: future `mdpr-ppt`
Status: deferred to future `mdpr-ppt` repository.

Work:

- Capture selected shapes, anchors, style samples, and mappings to MDPR IDs.
- Export user-approved selection, override, and pack candidates.

Acceptance:

- Exact bbox/style data is isolated to approved rail artifacts.
- Those artifacts are rejected if used as `agent-hint.json`.

## Next Execution Order

1. Coordinate MDPR-owned diagram/component/pack work in the MDPR repository.
2. Coordinate exact PowerPoint selection capture in a future `mdpr-ppt`
   repository.
3. Return to `DESIGN-P2-007` after MDPR exposes approved theme/pack import that
   mdpr-skill can invoke through `mdpr-adapter`.
