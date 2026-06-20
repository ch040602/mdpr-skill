# mdpr-skill

`mdpr-skill` is a thin Codex skill companion for [MDPR](https://github.com/ch040602/mdpr).

MDPR is the presentation runtime. It parses Markdown, preserves graphs and tables, selects layouts, applies theme/color rules, renders editable PPTX/HTML/PDF output, and validates overflow/coherence without requiring an LLM.

This repository only adds optional agent-side reasoning support around MDPR: compact semantic hints, icon-search keyword ideas, review checklists, reference seeds, and validation artifacts. It must not own final slide coordinates, colors, typography, shape choices, z-order, arrows, exact icon assets, or renderer objects.

![MDPR theme style proof contact sheet](docs/assets/theme-style-proof-contact-sheet.png)

The image above is generated from MDPR-rendered PPTX output and is reused by the README and Actions-page validation materials. The stable image set is documented in [`docs/actions-page-materials.md`](docs/actions-page-materials.md).

## Difference from MDPR

| Area | MDPR | mdpr-skill |
| --- | --- | --- |
| Primary role | Deterministic Markdown-to-presentation runtime | Optional Codex skill wrapper |
| Runtime dependency | No LLM required | Uses an agent only before MDPR selection |
| Final design decisions | Owns parsing, splitting, layout, theme colors, typography, charts, tables, diagrams, icon catalog search, PPTX objects, and validation | May suggest short intent/grouping/importance/icon-keyword hints |
| Output | Editable PPTX, HTML, PDF, reports, previews | Hint files, review artifacts, generated QA decks |
| Safety boundary | Hints can be ignored and the deck still builds | Must not replace MDPR rules |

## Installation

```bash
git clone https://github.com/ch040602/mdpr-skill.git
cd mdpr-skill
npm install
```

The `postinstall` hook prepares MDPR in `.cache/mdpr` from `https://github.com/ch040602/mdpr`.

Use an existing local MDPR checkout when needed:

```bash
MDPR_SOURCE_DIR=/path/to/mdpr npm install
```

Install or refresh MDPR dependencies:

```bash
npm run install:mdpr
```

Verify the MDPR checkout:

```bash
npm run check:mdpr
npm run check:mdpr-pandoc
```

## Validation

Run the local validation pack:

```bash
npm run validate
```

Run the theme-decoration review deck loop:

```bash
npm run review:theme-decoration
```

Key generated QA artifacts include:

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
- `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`

The release check deck is generated from bullet-style Markdown through MDPR and verifies readable font size, PowerPoint-rendered PNG output, and editable PPTX text/shape content.

The theme-decoration review deck verifies source-neutral visual diversity from an expanded local reference pass: 80 PPT files, 797 slides, 1,594 PowerPoint-rendered PNG slides, 160 sampled PNGs, and 60 derived structural object patterns. The public repository stores only aggregate counts and derived grammar, not source URLs or slide thumbnails.

Actions-page visual material is kept under `docs/assets/theme-*.png` so workflow summaries, pull requests, and release notes can point to the same rendered previews without depending on generated artifact paths.

## MDPR Documentation

The long-form design and object rules live in the prepared MDPR checkout:

- `.cache/mdpr/docs/12-design-methodology.md`
- `.cache/mdpr/docs/13-object-forms-and-icons.md`
- `.cache/mdpr/docs/07-rendering-rules.md`

## Acknowledgements

Pipeline preview assets are generated at `docs/assets/pipeline-overview.svg`, `docs/assets/pipeline-overview.pptx`, and `docs/assets/pipeline-overview.png`.

Inside MDPR, SVG-backed PPT surfaces are implemented at `.cache/mdpr/packages/render-pptx/src/designPresets.ts`, and the local SVG icon catalog is implemented at `.cache/mdpr/packages/render-pptx/src/iconCatalog.ts`.
