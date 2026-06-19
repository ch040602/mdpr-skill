# mdpr-skill

`mdpr-skill` is a thin Codex skill companion for [MDPR](https://github.com/ch040602/mdpr).

MDPR is the presentation runtime. It parses Markdown, preserves graphs and tables, selects layouts, applies theme/color rules, renders editable PPTX/HTML/PDF output, and validates overflow/coherence without requiring an LLM.

This repository only adds optional agent-side reasoning support around MDPR: compact semantic hints, review checklists, reference seeds, and validation artifacts. It must not own final slide coordinates, colors, typography, shape choices, z-order, arrows, or renderer objects.

## Difference from MDPR

| Area | MDPR | mdpr-skill |
| --- | --- | --- |
| Primary role | Deterministic Markdown-to-presentation runtime | Optional Codex skill wrapper |
| Runtime dependency | No LLM required | Uses an agent only before MDPR selection |
| Final design decisions | Owns parsing, splitting, layout, theme colors, typography, charts, tables, diagrams, PPTX objects, and validation | May suggest short intent/grouping/importance hints |
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

Key generated QA artifacts include:

- `artifacts/release-check/mdpr-skill-release-check.md`
- `artifacts/release-check/mdpr-skill-release-check.pptx`
- `artifacts/release-check/mdpr-skill-release-check-report.json`
- `docs/assets/pipeline-overview.pptx`
- `docs/assets/pipeline-overview.png`
- `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`

The release check deck is generated from bullet-style Markdown through MDPR and verifies readable font size, PowerPoint-rendered PNG output, and editable PPTX text/shape content.
