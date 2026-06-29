# Contributing Guide

Thank you for improving `mdpr-skill`.

This repository is the optional Codex skill companion for
[MDPR](https://github.com/ch040602/mdpr). Keep the boundary clear:

- MDPR owns deterministic Markdown parsing, slide splitting, layout, validation,
  rendering, PPTX output, theme colors, charts, tables, diagrams, and icon
  selection.
- `mdpr-skill` may provide semantic hints, visual-review notes, compact
  Markdown cleanup suggestions, and evidence-backed review artifacts.
- Skill outputs must not prescribe final coordinates, exact colors, z-order,
  arrow geometry, shape geometry, renderer object IDs, or exact icon assets.

## Before You Start

- Open an issue or draft PR for broad behavior changes.
- Use the GitHub issue forms for reproducible bugs and user-visible feature
  proposals so triage starts with version, reproduction, boundary, and
  validation evidence.
- Maintainers should keep labels used by issue forms and generated release
  notes aligned with `docs/github-labels.md`.
- Keep changes scoped to one purpose.
- Prefer improving MDPR itself when the change affects deterministic rendering,
  layout, theme rules, object selection, overflow handling, or PPTX generation.
- Use `mdpr-skill` for agent-side review workflows, hint schemas, validation
  artifacts, and documentation about the MDPR handoff.

## Pull Request Requirements

Every PR should include:

- A short summary of what changed.
- The reason the change is needed.
- The validation commands that were run.
- Any known limitations or follow-up work.

For presentation, visual-review, theme, layout, icon, or artifact changes,
please also include before/after evidence when possible:

- Before and after PNG screenshots.
- Before and after PPTX files.
- A link to generated review artifacts.
- A short note explaining what visual issue changed, such as overflow,
  alignment, readability, contrast, object coherence, theme feel, or diagram
  connectivity.

If the change updates generated assets, include the source Markdown and the
generated outputs together so reviewers can reproduce the result.

## Validation

Run the repository validation pack before opening a PR:

```bash
npm run validate
```

When the change depends on the local MDPR checkout or MDPR handoff, also run:

```bash
npm run install:mdpr
npm run check:mdpr
npm run check:mdpr-pandoc
```

For visual-review or theme-decoration work, run the relevant review loop:

```bash
npm run review:theme-decoration
npm run eval:external-md
```

If a command cannot be run, state why in the PR.

## Documentation

Update documentation when behavior, workflow, generated artifacts, or repository
boundaries change.

Useful places to update:

- `README.md` for user-facing usage and repository boundaries.
- `docs/mdpr-installation.md` for MDPR checkout and handoff behavior.
- `docs/actions-page-materials.md` for public preview/gallery material.
- `docs/mdpr-vs-skill-results.md` for comparison artifacts.
- `todo/` for review-driven follow-up records.

Keep project-internal Markdown files in English unless a file is explicitly a
localized README.

## Generated Artifacts

Generated PPTX, PNG, JSON, and report files are acceptable when they document a
review result or public preview. Keep them reproducible:

- Commit the Markdown or script input used to generate the artifact.
- Prefer compact artifacts over large raw dumps.
- Do not commit downloaded reference PPT files, source thumbnails, copied
  layouts, copied images, or brand-like objects from external reference
  corpora.
- Do not commit local caches or private checkout directories.

## Review Expectations

Reviewers should check:

- The MDPR and `mdpr-skill` responsibilities remain separate.
- Visual claims are backed by PNG/PPTX evidence when applicable.
- Generated artifacts are reproducible from committed inputs.
- Validation commands and limitations are stated.
- Documentation matches the changed behavior.

Small documentation-only PRs may skip visual evidence when no rendered output is
affected.
