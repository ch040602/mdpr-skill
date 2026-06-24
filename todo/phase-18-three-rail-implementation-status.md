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
| P0 forbidden final-decision fields | Mostly done | `FORBIDDEN_AGENT_HINT_FIELDS` and `assertNoForbiddenFields()` reject coordinates, color, typography, recipe, variant, icon path, geometry, and renderer IDs. | 85% |
| P1 MDPR adapter runner | Functional | `packages/mdpr-adapter/src/index.ts` can resolve MDPR, run build/validate/inspect, load artifacts, and collect metrics. | 70% |
| P1 eval-core runner | Strong functional baseline | `packages/eval-core/src/index.ts` runs baseline/guided builds, validates hints, compares metrics, emits reports, and has runtime/e2e tests. | 80% |
| P1 review-core rules | Skeleton only | `packages/review-core/src/index.ts` defines report types and final-field detection, but no concrete coherence or visual review rules. | 15% |
| P2 selection schemas | Schema and docs only | `schemas/mdpr-ppt-selection.schema.json`, `schemas/mdpr-selection-context.schema.json`, and `docs/mdpr-ppt-bridge.md` exist. | 35% |
| P2 approval/change request flow | Schema only | `schemas/mdpr-change-request.schema.json` exists, but no CLI lifecycle or gates. | 20% |
| P2 PowerPoint bridge implementation | Not started | No `mdpr-ppt` add-in, Office.js capture, or selection export implementation exists here. | 0% |
| P3 MDPR pack package | Not started in this repo | Pack concepts are documented, but MDPR-side `pack` package and commands are not implemented here. | 0% |
| P3 renderer metadata contract | Not owned here | Shape metadata and PPTX object manifest contract must be implemented in MDPR renderer. | 0% |
| P4 OOXML extractor fallback | Not started | No grouped shape/table deep extractor exists. | 0% |
| P4 selection context consumed by review/hint | Not wired | Selection-context schema exists, but review/hint code does not consume it yet. | 10% |

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

Remaining work:

- Add a CLI-visible schema sync command, for example
  `mdpr-skill validate-schema-sync --mdpr-path ../MdPr`.
- Compare schema version, hint shape, enums, confidence bounds,
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

Current state:

- `review-core` has generic report types only.

Work:

- Add `detachedCaptionFinding`.
- Add `orphanEvidenceFinding`.
- Add `claimlessEvidenceFinding`.
- Add `sectionRhythmFinding`.
- Ensure suggestions are MDPR policy/rulebook/config suggestions only.

Acceptance:

- Tests cover table/image/chart/code evidence blocks with and without nearby
  claims or captions.
- Findings include slide IDs, block IDs, evidence paths, and policy
  suggestions.
- Findings never include coordinates, raw colors, exact icon paths, recipes, or
  variants.

### TRI-RAIL-P1-003 - Implement concrete review-core visual rules

Priority: P1  
Owner: `mdpr-skill`

Current state:

- Final-decision field detection exists, but no visual policy rules exist.

Work:

- Add `rawHexFinding`.
- Add `mixedRadiusFinding`.
- Add `mixedShadowFinding`.
- Add `effectBudgetFinding`.
- Add `accentOveruseFinding`.
- Add `nonEditableObjectFinding`.
- Add `screenshotEvidence` helper for preview/evidence paths.

Acceptance:

- Rules consume MDPR manifests, design locks, and optional screenshot evidence.
- Rules report visual concerns without proposing final layout or style values.
- A sample review report fixture is generated and validated.

### TRI-RAIL-P1-004 - Wire review-core into eval-core

Priority: P1  
Owner: `mdpr-skill`

Current state:

- `eval-core` runs baseline/guided builds and compares metrics.
- It does not run `review-core` on both outputs.

Work:

- Add `runReviews`.
- Attach baseline and guided review summaries to `mdpr-skill-eval-v1`.
- Add review regression checks: new errors, increased warnings, forbidden
  finding fields, and missing evidence.
- Emit optional contact-sheet/evidence manifest paths when available.

Acceptance:

- `eval-core` report includes baseline and guided review counts.
- Regression gate fails when guided output increases review errors or violates
  the no-final-decision boundary.
- Runtime and MDPR CLI e2e tests cover review integration.

### TRI-RAIL-P1-005 - Harden mdpr-adapter into a stable runner API

Priority: P1  
Owner: `mdpr-skill`

Current state:

- The adapter can execute MDPR and load artifacts.

Work:

- Split runner internals into focused files only if complexity grows.
- Add richer failure objects for missing MDPR binary, failed build, missing
  manifest, stale hints, and unsupported output formats.
- Add optional profile metadata passthrough from MDPR manifests.

Acceptance:

- E2E test distinguishes command failure, artifact load failure, and regression
  failure.
- Error messages contain command, cwd, exit code, and artifact path context.

### TRI-RAIL-P2-006 - Consume selection context in review and hint flows

Priority: P2  
Owner: `mdpr-skill`

Current state:

- `mdpr-selection-context-v1` schema exists.
- No review or hint code consumes it.

Work:

- Add parser/validator for selection context.
- Allow review-core to use selected block/region evidence.
- Allow hints-core to propose grouping/role candidates from selection context
  without coordinates.
- Add boundary tests that reject selection coordinates if copied into hints.

Acceptance:

- Selection context can produce a detached-caption or evidence-pack finding.
- Generated hint manifests contain only semantic IDs and roles.

### TRI-RAIL-P2-007 - Add approval/change request lifecycle helpers

Priority: P2  
Owner: `mdpr-skill`

Current state:

- `mdpr-change-request-v1` schema exists.
- No proposal, approval, or apply helper exists.

Work:

- Add change request creation for proposed hints/review policy suggestions.
- Add `reviewed`, `approved`, `applied`, and `rejected` state transitions.
- Add approval gate for pack and override candidates.
- Prevent unapproved candidates from reaching MDPR runtime inputs.

Acceptance:

- Tests cover valid transition order and invalid direct `proposed -> applied`.
- Pack/override candidates fail gates without explicit approval metadata.

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

1. Implement concrete review-core coherence rules.
2. Implement concrete review-core visual rules.
3. Wire review-core into eval-core reports and regression gates.
4. Add selection-context consumption without coordinates.
5. Add approval/change request lifecycle helpers.
6. Start `mdpr-ppt` as a separate bridge boundary.
7. Move pack/import/render metadata work to MDPR.

The immediate next code change should be `TRI-RAIL-P1-002`, because `eval-core`
already runs real builds but cannot yet judge the semantic and visual review
quality described by the architecture.
