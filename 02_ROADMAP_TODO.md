# 02. Roadmap TODO

## Phase 00 - Preflight / Repository Alignment

- [x] Review the current `packages/*` structure.
- [x] Define a compatibility policy for preserving the existing `Layout IR` pipeline.
- [x] Record the Design Components upstream commit or tag.
- [x] Add the Design Components license notice under `third_party/design-source`.
- [x] Confirm the feature flag name: `design-components-rule-based`.
- [x] Run baseline tests and save snapshots.
- [x] Document the difference between the existing `theme-gallery` and the new `style-gallery`.

## Phase 01 - Slide Element IR

- [x] Create `packages/element-ir`.
- [x] Add `SlideElementIR`, `SlideNode`, `ElementNode`, and `ElementGroup` TypeScript types.
- [x] Add the JSON schema.
- [x] Add a `Presentation IR -> Slide Element IR` adapter in MDPR core.
- [x] Add a validator that rejects visual fields.
- [x] Compute content metrics: text characters, list count, table cells, code lines, and image aspect ratio.
- [x] Add unit tests.

## Phase 02 - Feature Extractor

- [x] Implement `extractSlideFeatures()`.
- [x] Implement `extractElementFeatures()`.
- [x] Compute density score, data weight, narrative weight, and visual complexity.
- [x] Add overflow risk estimates.
- [x] Add fixture-based golden feature tests.

## Phase 03 - Rule Engine Foundation

- [x] Create `design_components/rule-engine`.
- [x] Define the rule condition DSL.
- [x] Implement hard filter evaluation.
- [x] Implement scoring evaluation.
- [x] Implement deterministic tie breakers.
- [x] Add selection trace structures.
- [x] Implement conflict resolution priority.

## Phase 04 - Deck Visual Profile / Coherence Lock

- [x] Add `DeckVisualProfile`.
- [x] Add `CoherenceLock`.
- [x] Create profile catalog v1.
- [x] Implement automatic profile selection.
- [x] Implement user-forced profile options.
- [x] Apply radius, shadow, spacing, type, accent, and effect axes locks.

## Phase 05 - Slide Recipe Catalog

- [x] Define the recipe schema.
- [x] Add cover recipes.
- [x] Add section recipes.
- [x] Add content recipes.
- [x] Add data recipes.
- [x] Add comparison recipes.
- [x] Add process/timeline recipes.
- [x] Add code/technical recipes.
- [x] Add summary recipes.
- [x] Add recipe selection tests.

## Phase 06 - Element Variant Registry

- [x] Define the `ElementVariant` schema.
- [x] Add title variants.
- [x] Add paragraph variants.
- [x] Add list variants.
- [x] Add KPI/metric variants.
- [x] Add chart variants.
- [x] Add table variants.
- [x] Add code variants.
- [x] Add callout/quote variants.
- [x] Add image/caption variants.
- [x] Add variant selection tests.

## Phase 07 - Composition Engine

- [x] Create `design_components/composition`.
- [x] Implement canonical layout primitives: hero, split, grid, dashboard, timeline, comparison.
- [x] Implement region-rule to box calculation.
- [x] Handle safe areas and aspect ratios.
- [x] Enforce readable size constraints.
- [x] Implement density adaptation.
- [x] Implement fit/overflow fallback.

## Phase 08 - Decoration Engine

- [x] Create `design_components/decoration`.
- [x] Implement typography policy.
- [x] Implement surface policy.
- [x] Implement border/radius/shadow policy.
- [x] Implement accent placement policy.
- [x] Implement effect budget.
- [x] Implement chart/table/KPI/code-specific decoration.
- [x] Connect to coherence lint.

## Phase 09 - Design Components Vendor / Adapter

- [x] Create the `third_party/design-source` structure.
- [x] Record upstream metadata.
- [x] Add import scripts for Design Components tokens, rules, motion, and skins.
- [x] Map React/shadcn-specific dependencies to renderer-neutral tokens.
- [x] Limit skin colors to fallback/preview use.
- [x] Map motion keywords to PPTX static, HTML motion, and PDF static outputs.

## Phase 10 - PPT Theme Color Binding

- [x] Add `ColorRef` and `ThemeColorRef` types.
- [x] Implement semantic token to PPT theme slot mapping.
- [x] Implement raw hex rejection.
- [x] Implement the `design_components/pptx` color adapter.
- [x] Implement chart series theme slot mapping.
- [x] Connect template theme extraction and fallback contrast QA.

## Phase 11 - Renderer Integration

- [x] Add `StyledDeckIR -> PPTX` renderer path.
- [x] Add `StyledDeckIR -> HTML` renderer path.
- [x] Add `StyledDeckIR -> PDF` renderer path.
- [x] Add editable object guarantee tests.
- [x] Generate HTML CSS variables.
- [x] Add PDF static output snapshots.

## Phase 12 - CLI / Config / Inspect

- [x] Extend the config schema.
- [x] Add CLI options: `--style-engine`, `--style-select`, `--profile`, `--style-gallery`.
- [x] Add `inspect-style`.
- [x] Add `lint-style`.
- [x] Print selected recipes, variants, and reject reasons.
- [x] Add rulebook path override option.

## Phase 13 - Coherence Lint

- [x] Mixed radius lint.
- [x] Mixed shadow lint.
- [x] Mixed spacing lint.
- [x] Mixed type scale lint.
- [x] Multiple primary accent lint.
- [x] Raw hex lint.
- [x] Effect budget lint.
- [x] Repetitive layout rhythm lint.
- [x] Dense-slide expressive effect lint.

## Phase 14 - Style Gallery

- [x] Render the same Element IR with multiple profiles.
- [x] Define output folder conventions.
- [x] Generate gallery manifest JSON.
- [x] Generate per-profile inspect output.
- [x] Verify theme color preservation.

## Phase 15 - Optional Agent Hints

- [x] Add `AgentHint` schema.
- [x] Add allowed-field validation.
- [x] Reject forbidden recipe, variant, box, color, and effect fields.
- [x] Add agent-disabled snapshots.
- [x] Add tests proving agent hints cannot directly override selectors.

## Phase 16 - Regression / Docs / Release

- [x] Add 10 sample decks.
- [x] Add golden `StyledDeckIR` snapshots.
- [x] Add PPTX smoke tests.
- [x] Write docs.
- [x] Write migration guide.
- [x] Complete release checklist.
