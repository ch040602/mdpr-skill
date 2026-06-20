# External Markdown Visual Evaluation

This evaluation checks whether MDPR can take many unrelated Markdown documents
through one deterministic rule path and still produce bounded, readable,
PowerPoint-rendered slides.

## Corpus

- 23 downloaded Markdown files were collected from public GitHub README sources.
- The minimum acceptance threshold is 20 sources.
- The corpus is merged into one deck per iteration. It is not manually tuned per
  source file.
- The pipeline slide is ordinary Markdown arrow syntax and is rendered through
  MDPR's normal parser, layout planner, PPTX renderer, and PNG export path.

## Generated Artifacts

- Summary report: `artifacts/external-markdown-visual-eval/external-markdown-visual-eval-report.json`
- Final PPTX: `artifacts/external-markdown-visual-eval/iteration-04/build/deck.pptx`
- Final rendered PNGs: `artifacts/external-markdown-visual-eval/iteration-04/png/`
- Final all-slide contact sheet: `artifacts/external-markdown-visual-eval/iteration-04/contact-sheet.png`

## Iteration Result

| Iteration | Build path | Rendered slides | Result |
| --- | --- | ---: | --- |
| 1 | Markdown download -> corpus deck -> PPTX/PNG | 48 | Pass after TOC splitting fix |
| 2 | Bounded bullet extraction applied | 51 | Pass |
| 3 | Corpus evidence chart added | 28 | Pass |
| 4 | Rule-based composition diversification and local pipeline Markdown | 38 | Pass |

The final report records 23 sources, 4 iterations, 4 generated PPTX decks, 4
PowerPoint PNG export sets, and all-slide contact sheets for VLM review.

## Composition Gate

The evaluation now reads MDPR's normal `plan` output and scores layout
composition in addition to overflow, font size, nonblank rendering, and contrast.
The gate fails decks with excessive repeated card-heavy layout sequences, weak
title/body scale hierarchy, or too few layout families on larger decks.

Observed improvement in the final iteration:

- Card-heavy layout ratio changed from `0.778` in the previous final deck to
  `0.235`.
- Maximum consecutive card-heavy run changed from `13` to `2`.
- Layout families in the final deck: `vertical-list`, `pipeline`,
  `table-focus`, `chart-table`, `grid`, `key-message`, and `comparison`.
- Source title selection now prefers stable source hints over incidental README
  setup headings such as virtual-environment or checkout instructions.

## Fix Applied

The first evaluation exposed a real MDPR rule issue: generated TOC slides could
place more than 20 entries on one slide, causing out-of-bounds regions. MDPR now
splits generated TOC slides into bounded continuation slides before layout.

Regression coverage:

- `packages/core/test/core.test.mjs`: large TOC splits into continuation slides.
- `packages/layout/test/layout.test.mjs`: large TOC decks produce no region
  bounds overflow.

## Visual Review Notes

The generated slides are readable and bounded after the TOC and composition
fixes. The fourth iteration is stronger than the earlier card-heavy result
because source sections are deterministically routed across quote/key-message,
chart, comparison, table, pipeline, and compact bullet forms while still using
one MDPR parser, layout planner, PPTX renderer, and PowerPoint PNG export path.

Remaining improvements for paper/product-teaser quality:

- Add stronger hero/key-message composition for the first slide. The current
  cover is safe but less memorable than recent research/product teasers.
- Improve low-density continuation slides that are mostly URLs or sparse
  extracted bullets. They pass bounds checks but still look less editorial than
  strong paper/product teaser pages.
- Add a stronger first-slide hero/proof composition, preferably driven by corpus
  summary statistics rather than a custom drawing path.
- Unify README teaser asset generation with the MDPR build path so pipeline
  previews and external-eval pipeline slides share the same renderer contract.
