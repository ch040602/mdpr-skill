# mdpr-skill

`mdpr-skill` is a thin Codex skill companion for
[MDPR](https://github.com/ch040602/mdpr).

Use this repository when you want LLM-advised presentation review around MDPR:
compact semantic hints, icon-keyword ideas, visual-review loops, and review
artifacts. MDPR remains the deterministic presentation runtime.

For LLM-advised high-quality output, run the skill before MDPR finalizes the
deck. For normal Markdown-to-PPTX generation, use MDPR directly.

![MDPR theme style proof contact sheet](docs/assets/theme-style-proof-contact-sheet.png)

## Difference from MDPR

| Area | MDPR | mdpr-skill |
| --- | --- | --- |
| Primary role | Markdown-to-presentation runtime | Optional Codex skill wrapper |
| Runtime dependency | No LLM required | Agent used only for hints and review |
| Final decisions | Parsing, splitting, layout, theme colors, typography, charts, tables, diagrams, icon catalog search, PPTX objects, validation | Short intent/grouping/importance/icon-keyword hints and critique notes |
| Output | Editable PPTX, HTML, PDF, reports, previews | Hint files, review artifacts, generated review decks |
| Safety boundary | Builds must work without hints | Must not choose final coordinates, colors, z-order, arrows, geometry, exact icons, or renderer object IDs |

## Repository Structure

```text
skills/             Codex skill instructions for the optional wrapper
docs/               Skill-side guides, handoff notes, and preview materials
scripts/            Installation, review, validation, and artifact helpers
design_components/  Source-neutral review seeds and design grammar scaffolds
artifacts/          Generated review/example outputs
reports/            Local validation reports
schemas/            Hint, rulebook, and intermediate schema contracts
todo/               Development and review-driven task records
```

MDPR source code is not vendored in this repository. The installer prepares a
local MDPR checkout for development and validation; that local checkout is an
install artifact, not the mdpr-skill repository structure. See
[docs/mdpr-installation.md](docs/mdpr-installation.md).

## Installation

```bash
git clone https://github.com/ch040602/mdpr-skill.git
cd mdpr-skill
npm install
```

Prepare or refresh the local MDPR runtime used by the skill checks:

```bash
npm run install:mdpr
```

Use an existing MDPR checkout when needed:

```bash
MDPR_SOURCE_DIR=/path/to/mdpr npm install
```

Verify the MDPR handoff:

```bash
npm run check:mdpr
npm run check:mdpr-pandoc
```

## Usage

Run MDPR directly when you only need deterministic presentation output. MDPR is
where parser, layout, theme, object, and renderer changes should land.

Run mdpr-skill when you want a review pass before MDPR builds or rebuilds the
deck:

```text
Markdown source
  -> optional mdpr-skill semantic hints and review notes
  -> MDPR deterministic parsing, layout, validation, and rendering
  -> editable PPTX / HTML / PDF
```

Allowed skill outputs:

- semantic intent tags
- grouping and importance hints
- icon-search keyword ideas
- visual concern notes with evidence paths
- Markdown cleanup suggestions

Forbidden skill outputs:

- final coordinates
- exact colors
- z-order
- arrow geometry
- shape geometry
- renderer object IDs
- exact icon asset choices

## Validation

Run the local validation pack:

```bash
npm run validate
```

Run the theme-decoration review deck loop:

```bash
npm run review:theme-decoration
```

Run the external Markdown visual evaluation loop:

```bash
npm run eval:external-md
```

Generated review artifacts include:

- `artifacts/release-check/mdpr-skill-release-check.md`
- `artifacts/release-check/mdpr-skill-release-check.pptx`
- `artifacts/release-check/mdpr-skill-release-check-report.json`
- `artifacts/theme-decoration-review/theme-decoration-review.pptx`
- `artifacts/theme-decoration-review/theme-decoration-review-iteration-report.json`
- `docs/assets/theme-style-cover-contact-sheet.png`
- `docs/assets/theme-style-proof-contact-sheet.png`
- `docs/assets/theme-decoration-review-matrix.png`
- `docs/assets/pipeline-overview.pptx`
- `docs/assets/pipeline-overview.png`
- `artifacts/external-markdown-visual-eval/external-markdown-visual-eval-report.json`
- `artifacts/external-markdown-visual-eval/iteration-04/build/deck.pptx`
- `artifacts/external-markdown-visual-eval/iteration-04/contact-sheet.png`
- `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`

The public repository stores aggregate reference metrics and derived structural
grammar only. It does not store source URLs, downloaded reference PPT files,
source thumbnails, copied layouts, copied images, or brand-like objects from the
reference corpus.

## Documentation

- [MDPR installation and handoff](docs/mdpr-installation.md)
- [Agent hint guide](docs/agent-hint-guide.md)
- [MDPR vs skill results](docs/mdpr-vs-skill-results.md)
- [Structural pattern taxonomy](docs/structural-pattern-taxonomy.md)
- [Actions page materials](docs/actions-page-materials.md)

MDPR runtime documentation lives in the MDPR repository:

- [MDPR](https://github.com/ch040602/mdpr)
- [mdpr-skill](https://github.com/ch040602/mdpr-skill)

## Acknowledgements

This skill uses source-neutral design vocabulary and local SVG/icon references.
Relevant upstream references include:

- [MDPR](https://github.com/ch040602/mdpr)
- [Google Material Design Icons](https://github.com/google/material-design-icons)
- [Simple Icons](https://github.com/simple-icons/simple-icons)
- [SVG Repo](https://www.svgrepo.com/)
- [Tabler Icons](https://github.com/tabler/tabler-icons)
