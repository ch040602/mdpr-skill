# MDPR Pandoc Parser Boundary

This skill pack does not replace MDPR and does not port MDPR into `design_components/`.

MDPR remains the Markdown presentation runtime. Its role is to convert source Markdown into semantic presentation structure:

```text
Markdown
  -> MDPR parser(simple or Pandoc)
  -> MDPR BlockIR
  -> MDPR Outline Tree
  -> MDPR Split Planner
  -> MDPR Presentation IR
```

The Design Components skill starts after that content contract:

```text
MDPR Presentation IR
  -> Slide Element IR
  -> content metrics and importance tags
  -> deterministic recipe selection
  -> Styled Deck IR
  -> editable PPTX/HTML/PDF rendering
```

## MDPR Responsibilities

MDPR owns:

- Markdown parsing and Pandoc JSON normalization.
- Heading tree construction.
- Explicit slide separators such as `---`.
- Sentence, list, table, image, quote, code, and diagram block normalization.
- Slide splitting, autosplitting, density scoring, and semantic slide intent.
- Renderer-neutral `Presentation IR`.

MDPR should not own:

- Design recipe selection.
- Color palette expansion.
- Shape variant selection.
- Infographic layout family selection.
- Visual emphasis, z-order, shadow, radius, or decoration decisions.

## Skill Pack Responsibilities

This repository owns:

- Design Components-derived visual diversification under `design_components/`.
- Coherence rules for typography, spacing, alignment, colors, arrows, shadows, z-order, and text bounds.
- Infographic seeds for cycle, ordered, ranked, chart-like, and pictorial layouts.
- PowerPoint render comparison and visual validation.
- Skill packaging, installation guidance, and MDPR availability checks.

## Pandoc Mode

The MDPR update adds an explicit parser mode:

```bash
mdpresent build deck.md --parser pandoc --to pptx,html --out dist
```

Pandoc mode runs Pandoc with `--to json`, converts Pandoc blocks into MDPR `BlockIR`, and then continues through the normal MDPR outline, split, layout, and renderer pipeline. The default parser remains the built-in simple parser unless `--parser pandoc` is provided.

This keeps Pandoc as a structured Markdown front end, not a competing renderer or a design engine.

Runtime note: `--parser pandoc` requires the `pandoc` executable on `PATH`. The built-in simple parser remains available without Pandoc.

## Validation

After installing MDPR with this skill pack, verify the local MDPR checkout:

```bash
npm run check:mdpr-pandoc
```

The check confirms that `.cache/mdpr` exposes:

- `packages/core/src/parser/parsePandoc.ts`
- `parsePandocJson`
- `parseMarkdownWithPandoc`
- `ParserMode`
- CLI help and orchestration support for `--parser simple|pandoc`
