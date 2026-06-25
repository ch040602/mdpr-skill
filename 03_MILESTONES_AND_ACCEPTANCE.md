# 03. Milestones and Acceptance Criteria

## M0 - Baseline Alignment

Deliverables:

- Feature flag design
- Existing pipeline snapshot
- Third-party license metadata

Acceptance:

- [x] Existing `mdpresent build` output does not change.
- [x] The new mode does not run without a config or CLI flag.
- [x] Design Components import scope and license notices are documented.

## M1 - Element IR Ready

Deliverables:

- `SlideElementIR` types/schema
- `PresentationIR -> SlideElementIR` adapter
- Content metrics

Acceptance:

- [x] Every slide element has `type`, `role`, `importance`, and `contentMetrics`.
- [x] The IR validator rejects `x/y/w/h/color/radius/shadow`.
- [x] Five sample decks pass Element IR snapshots.

## M2 - Rule Selector Ready

Deliverables:

- Feature extractor
- Rule DSL
- Hard/scoring/tie-break selector
- Selection trace

Acceptance:

- [x] Identical input always selects the same recipe.
- [x] Reject reasons are recorded in inspect output.
- [x] The selector works without agent hints.

## M3 - Profile + Recipe + Variant Ready

Deliverables:

- Profile catalog
- Slide recipe catalog
- Element variant registry

Acceptance:

- [x] Cover, content, data, comparison, process, code, and summary families each have at least one working option.
- [x] High-density slides hard-reject hero-only recipes.
- [x] KPI+chart slides score data recipes above content recipes.

## M4 - Composition + Decoration Ready

Deliverables:

- Region and box calculation
- Typography, surface, accent, and effect policies
- Coherence lock

Acceptance:

- [x] Every `StyledElement` has a box.
- [x] Every style token follows profile axes and coherence locks.
- [x] Effect budget overflow produces a lint error or automatic downshift.

## M5 - Renderer Integration Ready

Deliverables:

- PPTX/HTML/PDF renderer adapters
- Theme color binding
- Raw hex lint

Acceptance:

- [x] Primary PPTX text remains editable text.
- [x] Primary PPTX shapes remain editable shapes.
- [x] In `color.mode: ppt-theme`, final `StyledDeckIR` has no non-preview raw hex.
- [x] HTML previews generate CSS variables.

## M6 - CLI and Inspect Ready

Deliverables:

- `inspect-style`
- `lint-style`
- `--style-gallery`
- Config schema extensions

Acceptance:

- [x] `inspect-style --json` prints features, selected recipe, selected variants, and rejected candidates.
- [x] `style-gallery` creates multiple profile outputs from the same Element IR.
- [x] Strict lint returns a failing signal in CI.

## M7 - Agent Hint Safety Ready

Deliverables:

- `AgentHint` schema
- Validation
- Override-prevention tests

Acceptance:

- [x] Agent-provided `recipeId` is rejected.
- [x] Agent-provided `x/y/w/h/color/effect` is rejected.
- [x] Agent enabled/disabled output differences are limited to allowed semantic fields.

## M8 - Release Ready

Deliverables:

- Docs
- Examples
- Migration guide
- Snapshots

Acceptance:

- [x] Existing legacy mode tests pass.
- [x] `design-components-rule-based` mode tests pass.
- [x] Release notes have no breaking changes, or breaking changes are explicit.
