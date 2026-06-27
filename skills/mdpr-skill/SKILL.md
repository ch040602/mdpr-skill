---
name: mdpr-skill
description: Use when Codex should help with MDPR presentation workflows, including semantic agent hints, icon-keyword ideas, Markdown cleanup, visual review notes, Design Components boundary checks, and Styled Deck IR design coherence audits. Triggers include MDPR, mdpresent, Markdown-to-PPTX, PPTX review, agent-hint.json, review-report.json, design component hints, raw hex/theme violations, spacing/type/radius/shadow consistency, and MDPR rulebook or config fixes.
---

# mdpr-skill

## Purpose

Use this skill as the optional Codex companion for MDPR. MDPR remains the deterministic presentation runtime; this skill provides semantic hints, review findings, and rule/config improvement guidance around MDPR outputs and intermediate representations.

## Core Boundary

- Let MDPR own parsing, slide splitting, recipes, layout, coordinates, geometry, typography, colors, z-order, arrows, effects, exact icon assets, renderer object IDs, and final PPTX objects.
- Keep agent output weak, semantic, evidence-based, and schema-valid.
- Express fixes as Markdown cleanup, MDPR rulebook changes, config changes, deterministic policy changes, or approval-bound proposals.
- Preserve the ability to build the same deck with all agent hints disabled.
- Do not mutate source Markdown unless the user explicitly asks for a cleaned source draft.

## LLM-Assisted PPTX Review Boundary

Use LLM judgment only for semantic, narrative, evidence, and review-note
assistance. It must not override MDPR validation or replace deterministic
overflow, text clipping, overline, coherence, spacing, type, radius, shadow,
raw-hex, editability, or renderer gates.

When an LLM review mentions these issues, ground the note in an MDPR report
finding, rendered evidence path, manifest field, or explicit source excerpt.
Treat the LLM note as triage or explanation only; MDPR validation remains the
source of truth for pass/fail status and release gating.

## Main Workflows

### Semantic Hints

Use when a deck, Slide Element IR, Presentation IR, or ambiguous Markdown would benefit from compact semantic guidance.

- Suggest intent, grouping, importance, and icon-search keywords.
- Keep hints compatible with `agent-hint.json`-style weak semantic input.
- Validate that hints do not encode final rendering choices.
- Prefer minimal hints over broad restatement of the source.

Useful local commands when the repo CLI is available:

```bash
node bin/mdpr-skill.js hint --source-sha256 <64hex> --out .mdpresent/proposals/agent-hint.json
```

### Review Reports

Use when reviewing generated MDPR artifacts, manifests, preview images, review reports, or handoff artifacts.

- Report visual concerns with evidence paths.
- Distinguish source Markdown problems from MDPR runtime/rulebook problems.
- Turn repeated visual issues into deterministic MDPR rule or config recommendations.
- Keep the output actionable for MDPR maintainers.

Useful local command:

```bash
node bin/mdpr-skill.js review --manifest dist/mdpresent-manifest.json --out .mdpresent/review/review-report.json
```

### Narrative Spine Review

Use when source Markdown needs content-level review before MDPR renders or
rebuilds a deck.

- Read Markdown, optional MDPR manifest summaries, and optional source notes.
- Emit claim-title and section-flow suggestions only.
- Include provenance such as source path, manifest slide count, heading text,
  or source-note excerpt.
- Do not emit layout IDs, placeholder IDs, coordinates, colors, typography,
  renderer object IDs, or pass/fail validation decisions.

Useful local command:

```bash
node bin/mdpr-skill.js narrative --markdown deck.md --manifest dist/mdpresent-manifest.json --source-notes notes.md --out .mdpresent/review/narrative-review.json
```

### Template Layout Intent Review

Use when a PPTX template has been summarized as a layout catalog and the deck
needs semantic layout-intent hints before MDPR chooses any actual layout.

- Read layout names and placeholder roles from a layout catalog or template
  summary.
- Emit semantic intents such as comparison, chart-focus, evidence, or
  section-divider.
- Include provenance through the catalog path, layout label, and placeholder
  roles.
- Do not emit placeholder coordinates, placeholder IDs, layout IDs, layout
  selection decisions, colors, typography, or renderer object IDs.

Useful local command:

```bash
node bin/mdpr-skill.js layout-intent --layout-catalog template-layout-catalog.json --out .mdpresent/review/layout-intent.json
```

### LLM-Assisted Content Review Helpers

Use when the source needs semantic or editorial review before MDPR renders, or
when MDPR-rendered evidence needs a human-readable review artifact.

- `speaker-notes`: draft presenter notes and reviewer comments from Markdown
  and optional source notes.
- `citations`: flag missing citations, stale sources, and unsupported claims
  from source metadata.
- `rendered-preview`: consume MDPR-generated PNG/contact-sheet paths and emit
  visual concern notes only.
- `accessibility`: draft alt text, plain-language, acronym expansion, and
  audience-fit suggestions.
- `evidence-ledger`: map slide claims to source metadata and MDPR evidence IDs.

These helpers may cite source paths, headings, rendered image paths, MDPR
finding IDs, source IDs, and evidence IDs. They must not emit coordinates,
colors, typography, z-order, geometry, renderer object IDs, or pass/fail
validation decisions.

Useful local commands:

```bash
node bin/mdpr-skill.js speaker-notes --markdown deck.md --source-notes notes.md --out .mdpresent/review/speaker-notes.json
node bin/mdpr-skill.js citations --markdown deck.md --sources sources.json --as-of 2026-06-27 --out .mdpresent/review/citation-review.json
node bin/mdpr-skill.js rendered-preview --images rendered-images.json --out .mdpresent/review/rendered-preview-review.json
node bin/mdpr-skill.js accessibility --markdown deck.md --audience "executive review" --out .mdpresent/review/accessibility-review.json
node bin/mdpr-skill.js evidence-ledger --markdown deck.md --sources sources.json --mdpr-evidence mdpr-evidence.json --out .mdpresent/review/evidence-ledger.json
```

### Generator Comparison Boundary

PptxGenJS, python-pptx, and other PPTX generators are comparison points only.
Use them to describe capability vocabulary or benchmark context; do not add
them as dependencies, fallback renderers, or alternate runtimes. MDPR remains
the deterministic runtime.

### Design Components Boundary

Use when working with MDPR's built-in design component runtime or related IR.

- Read Slide Element IR or Presentation IR as the content contract.
- Suggest only semantic hints around intent, grouping, importance, and icon keywords.
- Explain design review findings in terms of MDPR rulebook/config changes.
- Do not choose recipes, variants, coordinates, shape sizes, typography, colors, z-order, arrows, effects, or exact icon assets.
- Do not duplicate MDPR renderer behavior in the skill.

### Design Coherence Audit

Use when auditing Design Components Styled Deck IR before rendering or release.

Check for:

- raw hex in PPT theme mode
- mixed radius family
- mixed shadow family
- mixed spacing scale
- mixed type scale
- excessive accent use
- excessive decorative effects
- dense slides using expressive effects
- repeated layout rhythm
- non-editable PPTX primary text plans

Return JSON-style findings when the caller needs CI output, or a concise human-readable fix list when working interactively. Findings may explain why an issue exists, but fixes must stay at the MDPR rulebook/config or deterministic policy level.

## PowerPoint Bridge Boundary

When working with `mdpr-ppt` or PowerPoint selection context:

- `hint rail`: emit weak `agent-hint.json` semantics only.
- `review rail`: emit `review-report.json` findings only.
- `edit-intent rail`: record page or decoration change requests as safe proposals.
- `approved override / pack rail`: require user approval before MDPR validates and applies override or pack candidates.

Never emit final PowerPoint geometry, object IDs, z-order, exact colors, or exact icon assets from a selection context.

## Validation

Prefer the repo's existing commands when the `mdpr-skill` checkout is available:

```bash
npm run validate
npm run check:mdpr
npm run check:mdpr-pandoc
```

For focused artifact work, validate the exact JSON schema or report contract touched by the task before presenting findings as release-ready.
