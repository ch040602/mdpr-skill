# Phase 21 - LLM PPTX Skill Research

## Goal

Identify PPTX-production skill ideas that can improve `mdpr-skill` without
weakening MDPR's deterministic rule-based validation. The LLM layer may add
semantic, narrative, evidence, and review guidance only. MDPR still owns
coherence checks, overflow/text clipping detection, layout, coordinates,
typography, theme colors, object variants, renderer IDs, and final PPTX output.

## Agentic RAG Retrieval Plan

Question:

> Which PPTX-making skill patterns should influence `mdpr-skill`, while
> preserving MDPR's existing rule-based validation and only adding LLM-assisted
> improvements?

Routed corpora:

- Local `mdpr-skill` boundary docs and tests.
- Local Codex `Presentations` skill for narrative, contact-sheet, and rendered
  critique workflow patterns.
- Public PPTX skills and libraries:
  - Anthropic `pptx` skill:
    `https://raw.githubusercontent.com/anthropics/skills/main/skills/pptx/SKILL.md`
  - `pptx-from-layouts-skill`:
    `https://github.com/tristan-mcinnis/pptx-from-layouts-skill`
  - PptxGenJS:
    `https://github.com/gitbrent/PptxGenJS`
  - `frontend-slides`:
    `https://github.com/zarazhangrui/frontend-slides`
  - Scientific slides design guide:
    `https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/skills/scientific/scientific-slides/assets/powerpoint_design_guide.md`

Sufficient context status: sufficient for registering scoped follow-up TODOs.

## Findings

- Broad PPTX skills emphasize the full file lifecycle: creation, analysis,
  editing, templates, speaker notes, and comments. This suggests a useful
  `mdpr-skill` opportunity around notes/comments and source analysis, not final
  layout ownership.
- Template-layout skills emphasize profiling a PPTX template, mapping semantic
  content to real slide layouts, and rendering into placeholders. For MDPR, the
  transferable part is layout-intent discovery and semantic hinting; direct
  placeholder placement remains outside the LLM layer.
- PptxGenJS and similar libraries show broad PPTX object coverage, slide
  masters, charts, tables, and media. For MDPR, this is a reference vocabulary
  for capability documentation and adapter comparison, not a reason to replace
  the MDPR renderer.
- HTML/frontend slide skills emphasize "show, don't tell" preview selection and
  fast visual iteration. For MDPR, this can become an LLM-assisted critique over
  rendered PNG/contact sheets, but MDPR's rule-based gates remain authoritative
  for overflow, clipping, and coherence failures.
- Domain-specific slide guides emphasize research-backed, visual, low-text
  slides. For MDPR, this maps cleanly to content/narrative review, citation
  coverage, and Markdown cleanup suggestions.

## Non-Negotiable Boundary

- Do not port LLM-based overlap, overflow, text clipping, overline, coherence,
  spacing-scale, type-scale, radius, shadow, raw-hex, or editability checks as
  replacements for MDPR rules.
- Do not let the LLM choose final slide layout, coordinates, colors,
  typography, icon assets, renderer objects, z-order, arrows, or geometry.
- Do not add a second PPTX generation runtime to `mdpr-skill`.
- LLM critique may point to an MDPR report finding, summarize likely causes, or
  suggest Markdown/semantic-hint changes, but the underlying failure source must
  remain MDPR validation or explicit rendered evidence.

## TODO

- [ ] `LLM-PPTX-P0-001`: Add a boundary test that rejects any new
  `mdpr-skill` output schema containing final-rendering fields or replacing
  MDPR overflow/coherence checks with LLM judgment.
- [ ] `LLM-PPTX-P1-002`: Add a narrative-spine reviewer that reads Markdown,
  MDPR manifest summaries, and optional source notes, then emits claim/title
  and section-flow suggestions only.
- [ ] `LLM-PPTX-P1-003`: Add a template/layout-intent reviewer that can inspect
  a PPTX template or layout catalog and emit semantic layout intent hints
  without placeholder coordinates or layout IDs.
- [ ] `LLM-PPTX-P1-004`: Add an optional speaker-notes/comments helper that
  proposes notes, presenter talk tracks, and reviewer comments from source
  evidence without modifying rendered slide geometry.
- [ ] `LLM-PPTX-P1-005`: Add citation/provenance review for research-heavy or
  data-heavy decks: source coverage, missing citations, stale source dates, and
  unsupported claims.
- [ ] `LLM-PPTX-P2-006`: Add rendered-preview critique prompts that consume
  MDPR-generated PNG/contact sheets and return visual concern notes only. These
  notes must cite slide/image paths and must not override MDPR rule gates.
- [ ] `LLM-PPTX-P2-007`: Add accessibility/content QA suggestions: alt-text
  drafts, plain-language checks, acronym expansion, and audience fit. Keep this
  content-only; MDPR remains responsible for final visual accessibility gates.
- [ ] `LLM-PPTX-P2-008`: Add a "source-to-slide evidence ledger" artifact that
  maps each slide claim to source text, table, chart, or MDPR evidence IDs.
- [ ] `LLM-PPTX-P3-009`: Document PptxGenJS/python-pptx/other generators as
  external comparison points only, not dependencies or fallback renderers for
  `mdpr-skill`.

## Acceptance

- New LLM helpers produce only semantic hints, content suggestions, review
  notes, notes/comments, or evidence ledgers.
- `review-core` and MDPR validation remain the source of truth for coherence,
  overflow, clipping, editability, raw-hex, spacing/type/radius/shadow, and
  object-policy failures.
- Every LLM-generated suggestion includes provenance: source path, slide ID,
  evidence ID, rendered image path, or MDPR report finding ID.
- Existing `npm run test:review-core`, `npm run test:eval-core`, and focused
  boundary tests pass after each implemented item.
