# Phase 17 - LLM-Advised Quality Handoff

## Goal

Separate MDPR deterministic validation from mdpr-skill LLM-advised visual
review. MDPR owns final structure and rendering. mdpr-skill only provides
semantic hints, critique notes, review artifacts, and optional Markdown cleanup
ideas before MDPR builds the final deck.

## Findings From Current Review

- MDPR README already directs `LLM-advised quality` work to mdpr-skill.
- MDPR runtime docs still had quality-review wording in architecture, rendering, and
  overflow policy surfaces. This was accepted and fixed.
- README preview image selection depended on hard-coded slide indexes. This was
  accepted and fixed by resolving preview PNGs from semantic slide titles in
  `preview-manifest.json`.
- mdpr-skill README should keep review-loop language on the skill side and avoid
  suggesting that the skill owns final rendering decisions.

## Tasks

- [x] Select README preview PNGs by semantic slide title from the MDPR preview
  manifest instead of hard-coded slide indexes.
- [x] Replace runtime-facing MDPR quality-review wording with deterministic validation
  wording in architecture, rendering, and overflow docs.

Deferred follow-ups:

- Add a handoff guide: MDPR validation artifacts in, mdpr-skill review notes out.
- Define a compact review-note schema for LLM-advised quality work:
  `semanticHint`, `visualConcern`, `evidencePath`, `severity`,
  `suggestedMDChange`.
- Forbid coordinates, exact colors, z-order, arrows, shape geometry, and renderer
  object IDs in skill review outputs.
- Add a validation script that rejects forbidden ownership language in mdpr-skill
  outputs.
- Update release-check and comparison decks to use `skill-side visual review`
  instead of ambiguous quality-review wording where the review is agent-assisted.
- Add a regression fixture that consumes MDPR `preview-manifest.json`,
  `theme-preview-evaluation.json`, and selected PNG paths as skill review input.
- Produce one small before/after example showing:
  MDPR deterministic build only -> mdpr-skill review hints -> MDPR rebuild.
- Document that mdpr-skill may recommend Markdown cleanup or semantic tags, but
  MDPR decides final layout, theme, icons, object variants, and PPTX output.

## Acceptance

- [x] MDPR docs describe deterministic validation.
- [x] mdpr-skill docs describe LLM-advised visual review without claiming final
  design ownership.

Pending acceptance targets:

- `npm run validate` passes.
- A generated review artifact demonstrates the handoff without claiming final
  design ownership.
- README and docs link the two repositories without duplicating runtime
  responsibilities.
