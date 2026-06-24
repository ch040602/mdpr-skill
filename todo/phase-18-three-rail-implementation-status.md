# Phase 18 - Three-Rail Architecture Implementation Status

## Goal

Track how much of the proposed three-rail architecture has been implemented and
register the remaining work as review-driven TODOs.

The target architecture separates:

- hint rail: `mdpr-skill` may emit weak semantic hints only.
- review rail: `mdpr-skill` may emit findings and MDPR policy suggestions only.
- approved override / pack rail: `mdpr-ppt` may capture exact PowerPoint
  selections and style snapshots only after explicit user approval.

MDPR remains the deterministic runtime. Agents must not generate final
coordinates, colors, typography, recipe IDs, variants, z-order, arrows,
component choices, exact icon paths, or renderer object IDs.

## Critical Review Decision

Accepted:

- Keep the three rails separate.
- Keep final design decisions inside MDPR.
- Treat PowerPoint selections as user-approved evidence or override/pack
  candidates, not as agent hints.
- Strengthen `eval-core` into a real baseline/guided runner.

Accepted with scope correction:

- `mdpr-ppt` should be a separate bridge repository or package boundary. This
  repository may define schemas and handoff docs, but it should not silently
  become the PowerPoint add-in implementation.
- MDPR pack import, renderer metadata, and override application belong in MDPR,
  not in `mdpr-skill`.

Rejected:

- Allowing the agent hint rail to carry exact geometry, raw colors, final icon
  paths, recipe IDs, or renderer object IDs.
- Treating a manually edited PowerPoint deck as the implicit source of truth.

## Current Completion Summary

Estimated completion is split into `mdpr-skill` local scope and whole-system
scope because several TODOs belong to MDPR or a future `mdpr-ppt` repository.

| Area | Status | Evidence | Estimate |
| --- | --- | --- | ---: |
| P0 hint manifest contract | Done | `packages/hints-core/src/index.ts` uses `schemaVersion: "mdpr-agent-hint-v1"`, `sourceSha256`, `generatedBy`, and `generatedAt`. | 100% |
| P0 forbidden final-decision fields | Hardened | `FORBIDDEN_AGENT_HINT_FIELDS`, `assertNoForbiddenFields()`, and key-based review finding checks reject final-decision keys without false positives from evidence prose. | 90% |
| P1 MDPR adapter runner | Hardened functional runner | `packages/mdpr-adapter/src/index.ts` can resolve MDPR, run build/validate/inspect, load artifacts, collect metrics, and report typed command/artifact failures; eval-core preserves those typed failures. | 85% |
| P1 eval-core runner | Review-integrated runner | `packages/eval-core/src/index.ts` runs baseline/guided builds, validates hints, compares metrics, preserves MDPR profile metadata, runs review-core, emits reports, and has runtime/e2e tests. | 90% |
| P1 review-core coherence rules | Done for first production slice | `packages/review-core/src/index.ts` now reports detached captions, orphan evidence, claimless evidence slides, and section rhythm drift without final design fields. | 70% |
| P1 review-core visual rules | Done for first production slice | `packages/review-core/src/index.ts` now reports raw hex leakage, mixed corner/depth scales, visual treatment budget overuse, accent overuse, and non-editable primary objects. | 70% |
| P2 selection schemas | Schema and docs only | `schemas/mdpr-ppt-selection.schema.json`, `schemas/mdpr-selection-context.schema.json`, and `docs/mdpr-ppt-bridge.md` exist. | 35% |
| P2 edit-intent rail | First production slice done | `packages/edit-core/src/index.ts` records safe page/layout/decoration edit proposals and rejects final-decision fields before change-request creation. | 60% |
| P2 approval/change request flow | Helper lifecycle implemented and CLI-exported | `packages/change-core/src/index.ts` creates proposed changes, validates source hashes/change lists/approval timestamps, enforces reviewed approval transitions, blocks unapproved runtime candidates, and `packages/cli/src/commands/change.ts` exposes the lifecycle boundary. | 75% |
| P2 PowerPoint bridge implementation | Not started | No `mdpr-ppt` add-in, Office.js capture, or selection export implementation exists here. | 0% |
| P3 MDPR pack package | Not started in this repo | Pack concepts are documented, but MDPR-side `pack` package and commands are not implemented here. | 0% |
| P3 renderer metadata contract | Not owned here | Shape metadata and PPTX object manifest contract must be implemented in MDPR renderer. | 0% |
| P4 OOXML extractor fallback | Not started | No grouped shape/table deep extractor exists. | 0% |
| P2 selection context consumed by review/hint | Done for first production slice | `hints-core` converts selection context into semantic grouping hints, and `review-core` consumes selected block evidence without copying coordinates. | 65% |

Overall:

- `mdpr-skill` local scope is roughly 50-55% complete.
- Whole-system three-rail architecture is roughly 30-35% complete.
- The highest-risk gap is not `eval-core`; it is the missing concrete
  `review-core` rules and the missing approval-bound `mdpr-ppt` / pack rail.

## Registered TODOs

### TRI-RAIL-P0-001 - Keep hint schema synced with MDPR

Priority: P0  
Owner: `mdpr-skill`

Current state:

- The local TypeScript manifest matches MDPR's `mdpr-agent-hint-v1` shape.
- Tests check schema sync against the local MDPR checkout.
- `packages/cli/src/commands/validateSchemaSync.ts` exposes
  `runValidateSchemaSync()` for CLI command wiring.

Remaining work:

- Add an argv-level executable entrypoint for
  `mdpr-skill validate-schema-sync --mdpr-path ../MdPr`.
- Extend command comparison beyond byte-for-byte schema drift to schema
  version, hint shape, enums, confidence bounds,
  `additionalProperties`, and forbidden-field policy.
- Fail CI if MDPR schema changes without mdpr-skill boundary updates.

Acceptance:

- Schema drift test fails on missing enum, missing required field, or relaxed
  forbidden-field policy.
- The command works when MDPR is available through `.cache/mdpr` or an explicit
  path.

### TRI-RAIL-P1-002 - Implement concrete review-core coherence rules

Priority: P1  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- `review-core` exposes `reviewCoherence()`.
- `review-core` exposes rule-specific helpers for detached captions, orphan
  evidence, claimless evidence slides, and section rhythm drift.
- Runtime tests cover positive and clean cases.

Completed work:

- Added `detachedCaptionFindings`.
- Added `orphanEvidenceFindings`.
- Added `claimlessEvidenceFindings`.
- Added `sectionRhythmFindings`.
- Ensured suggestions are MDPR policy suggestions only.

Acceptance:

- [x] Tests cover evidence blocks with and without nearby claims or captions.
- [x] Findings include slide IDs, block IDs, evidence paths, and policy
  suggestions.
- [x] Findings never include coordinates, raw colors, exact icon paths, recipes,
  or variants.

### TRI-RAIL-P1-003 - Implement concrete review-core visual rules

Priority: P1  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- `review-core` exposes `reviewVisualPolicy()`.
- Visual rules consume manifest/design-lock summaries without producing final
  coordinates, raw color decisions, exact icons, recipes, or variants.
- `screenshotEvidence()` records preview evidence paths without making layout
  decisions.

Completed work:

- Added `rawHexFindings`.
- Added `mixedRadiusFindings`.
- Added `mixedShadowFindings`.
- Added `effectBudgetFindings`.
- Added `accentOveruseFindings`.
- Added `nonEditableObjectFindings`.
- Added `screenshotEvidence` helper for preview/evidence paths.

Acceptance:

- [x] Rules consume MDPR manifests, design locks, and optional screenshot
  evidence.
- [x] Rules report visual concerns without proposing final layout or style
  values.
- [x] Runtime tests validate the visual policy findings and evidence helper.

### TRI-RAIL-P1-004 - Wire review-core into eval-core

Priority: P1  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- `eval-core` runs `review-core` on baseline and skill-guided MDPR artifacts.
- `mdpr-skill-eval-v1` reports include baseline and guided review summaries.
- A `review` gate fails when guided output increases review errors or warnings,
  contains forbidden final-decision fields, or lacks evidence.

Completed work:

- Added `runReviews`.
- Added `ReviewRunSummary`.
- Added `buildReviewRegressionGate`.
- Attached `reviews.baseline`, `reviews.skillGuided`, and `gates.review` to
  eval reports.

Acceptance:

- [x] `eval-core` report includes baseline and guided review counts.
- [x] Regression gate fails when guided output increases review errors or
  violates the no-final-decision boundary.
- [x] Runtime tests cover review integration.
- [x] MDPR CLI e2e test covers a successful build that still fails on review
  regression.

### TRI-RAIL-P1-005 - Harden mdpr-adapter into a stable runner API

Priority: P1  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- The adapter can execute MDPR, load artifacts, collect metrics, and report
  typed command/artifact failures.

Completed work:

- Added `MdprAdapterError`.
- Added `assertMdprRunSucceeded()`.
- Added missing/invalid artifact diagnostics for manifest, presentation, and
  layout loads.
- Added runtime tests for command failure and missing manifest failure.

Acceptance:

- [x] Tests distinguish command failure and artifact load failure.
- [x] Error messages contain command, cwd, exit code, and artifact path context.
- [x] E2E test distinguishes review regression failure from adapter/CLI
  failure by asserting both MDPR runs exit successfully while the review gate
  fails.
- [x] Optional profile metadata passthrough from MDPR manifests.
- [x] Eval-core preserves typed adapter command failures instead of converting
  them into generic quality regressions.

### TRI-RAIL-P2-006 - Consume selection context in review and hint flows

Priority: P2  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- `hints-core` exposes `hintFromSelectionContext()`.
- `review-core` exposes `reviewSelectionContext()`.
- Selection context can produce an evidence-pack grouping hint without copying
  screenshot paths, selection paths, or coordinates into the hint.
- Selection context can produce a review finding with selected block IDs and
  evidence paths.

Completed work:

- Added selection-context-to-hint conversion.
- Added selection-context review finding.
- Added runtime tests for hint and review consumption.

Acceptance:

- [x] Selection context can produce an evidence-pack finding.
- [x] Generated hint manifests contain only semantic IDs and roles.
- [x] Coordinates present in raw context are not copied into generated hints or
  findings.

### TRI-RAIL-P2-007 - Add approval/change request lifecycle helpers

Priority: P2  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- `change-core` exposes proposed change creation.
- `change-core` enforces valid stage transitions.
- `approvalGate()` and `assertApprovedForRuntime()` block unapproved runtime
  candidates.
- The CLI package exports the change lifecycle boundary for command wiring.
- Runtime helpers reject invalid `sourceSha256`, empty change lists, and
  malformed approval timestamps.
- The JSON schema requires approval metadata for both `approved` and `applied`
  stages.

Completed work:

- Added `packages/change-core/src/index.ts`.
- Added `packages/cli/src/commands/change.ts`.
- Added lifecycle tests for valid reviewed approval flow.
- Added CLI boundary tests for exported approval lifecycle helpers.
- Added approval-gate tests for pack and override candidates.
- Added runtime validation tests for invalid helper inputs.
- Tightened `schemas/mdpr-change-request.schema.json`.

Acceptance:

- [x] Tests cover valid transition order and invalid direct
  `proposed -> applied`.
- [x] Pack/override candidates fail gates without explicit approval metadata.
- [x] CLI command boundary exposes approval lifecycle helpers.
- [x] Helper and schema boundaries reject invalid runtime handoff inputs.

### TRI-RAIL-P2-007B - Add safe edit-intent proposal rail

Priority: P2  
Owner: `mdpr-skill`

Status: completed in first production slice.

Completed state:

- `edit-core` exposes `buildEditIntent()`.
- `edit-core` exposes `editIntentToChangeRequest()`.
- Edit intents can capture natural-language requests for a target slide,
  block hints, emphasis changes, layout-family preferences, and
  decoration-family preferences.
- Edit intents reject coordinates, raw colors, typography, exact recipe IDs,
  variants, geometry, arrows, exact icon paths, and renderer object IDs.
- Edit intents become proposed `mdpr-change-request-v1` entries and require the
  same approval/review gates as other mdpr-skill proposals.

Completed work:

- Added `packages/edit-core/src/index.ts`.
- Added `packages/cli/src/commands/edit.ts`.
- Added runtime tests for safe edit-intent creation and boundary rejection.
- Added `edit-intent` to `ChangeKind` and the change-request schema.
- Documented the edit-intent rail in README and bridge docs.

Acceptance:

- [x] A natural-language page/layout/decoration edit can become a proposed
  change request.
- [x] Final design fields are rejected before proposal creation.
- [x] MDPR remains responsible for final layout, recipe, renderer, and
  validation decisions.

### TRI-RAIL-P2-008 - Create separate mdpr-ppt bridge implementation

Priority: P2  
Owner: future `mdpr-ppt`

Current state:

- mdpr-skill has schemas and handoff docs only.

Work:

- Create a separate `mdpr-ppt` repository or package boundary.
- Implement PowerPoint selected-shape capture.
- Export `mdpr-ppt-selection-v1`.
- Capture anchor center points through selected anchor shapes rather than raw
  mouse coordinates.
- Export pack and override candidates only as user-approved artifacts.

Acceptance:

- A manually selected PowerPoint shape can be exported to JSON.
- The JSON maps back to MDPR slide/region/block IDs.
- The output is rejected if used as `agent-hint.json`.

### TRI-RAIL-P3-009 - Implement MDPR pack package and commands

Priority: P3  
Owner: MDPR

Current state:

- Pack principles are documented, but runtime support belongs to MDPR.

Work:

- Add MDPR `pack` package.
- Add `style-pack`, `component-pack`, and `shape-pack` schemas.
- Add `mdpresent pack validate/import/list/preview`.
- Tokenize imported style snapshots.
- Require design-lock update when packs affect rendering.

Acceptance:

- `mdpresent build deck.md --pack mdpr.pack.json` works without agent runtime.
- Raw PowerPoint snapshots become MDPR tokens before rendering.
- Pack import rejects unapproved or external-asset-unsafe candidates.

### TRI-RAIL-P3-010 - Add MDPR PPTX renderer mapping metadata

Priority: P3  
Owner: MDPR

Current state:

- Not implemented in this repository.

Work:

- Add stable PowerPoint shape names such as
  `mdpr:slide-4:region-main:b12`.
- Add alt text metadata with slide, region, and block IDs.
- Emit PPTX object contract entries in the MDPR manifest.

Acceptance:

- `mdpr-ppt` can reverse-map selected shapes to MDPR IR IDs.
- Tests inspect PPTX XML and manifest entries.

### TRI-RAIL-P4-011 - Add OOXML extractor fallback for mdpr-ppt

Priority: P4  
Owner: future `mdpr-ppt`

Current state:

- Not implemented.

Work:

- Read PPTX zip.
- Extract grouped shape style where Office.js is shallow.
- Extract table shape style where Office.js cannot expose text/style reliably.
- Extract theme XML for pack tokenization.

Acceptance:

- Grouped shapes and native tables can be represented as opaque snapshots or
  deep style samples.
- Extractor output never flows into hint rail as final design fields.

### TRI-RAIL-P4-012 - Add cross-repo release gates

Priority: P4  
Owner: `mdpr-skill`, MDPR, future `mdpr-ppt`

Current state:

- Local tests exist, including eval-core runtime and MDPR CLI e2e tests.

Work:

- Add CI jobs for schema sync, eval e2e, and boundary gates.
- Add optional MDPR path matrix: cached MDPR, sibling MDPR checkout, and global
  `mdpresent`.
- Add release checklist entries for review-core, eval-core, and pack/override
  boundary validation.

Acceptance:

- CI fails when a rail boundary regresses.
- CI fails when eval guided output introduces visual/review regressions.
- CI can skip MDPR-dependent e2e only with an explicit reason.

## Next Execution Order

1. Start `mdpr-ppt` as a separate bridge boundary.
2. Move pack/import/render metadata work to MDPR.
3. Keep `mdpr-ppt`, pack/import, and renderer metadata work in their owning
  repositories while preserving mdpr-skill boundary gates here.

The immediate next code change should be `TRI-RAIL-P2-008`, but it belongs to a
future `mdpr-ppt` repository or package boundary rather than silently expanding
this skill into a PowerPoint add-in.
