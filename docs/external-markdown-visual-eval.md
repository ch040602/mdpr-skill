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
| 1 | Markdown download -> corpus deck -> PPTX/PNG | 30 | Pass after TOC splitting fix |
| 2 | Bounded bullet extraction applied | 30 | Pass |
| 3 | Corpus evidence chart added | 30 | Pass |
| 4 | Local pipeline Markdown included through MDPR diagram path | 30 | Pass |

The final report records 23 sources, 4 iterations, 4 generated PPTX decks, 4
PowerPoint PNG export sets, and all-slide contact sheets for VLM review.

## Fix Applied

The first evaluation exposed a real MDPR rule issue: generated TOC slides could
place more than 20 entries on one slide, causing out-of-bounds regions. MDPR now
splits generated TOC slides into bounded continuation slides before layout.

Regression coverage:

- `packages/core/test/core.test.mjs`: large TOC splits into continuation slides.
- `packages/layout/test/layout.test.mjs`: large TOC decks produce no region
  bounds overflow.

## VLM Review Notes

The generated slides are readable and bounded after the TOC fix. The fourth
iteration is stronger than the first because source cards use a 2x2 structure,
the evidence chart gives the deck a proof object, and the pipeline slide is no
longer a special drawing path.

Remaining improvements for paper/product-teaser quality:

- Add stronger hero/key-message composition for the first slide. The current
  cover is safe but less memorable than recent research/product teasers.
- Add more non-card continuation layouts. Several source continuation slides
  still rely on simple row cards and could use comparison, timeline, or proof
  object variants when the source semantics support them.
- Improve source-title extraction. Some README files expose setup headings
  before the real project name.
- Add a visual-quality score that penalizes excessive repeated card grammar even
  when overflow and font checks pass.
- Unify README teaser asset generation with the MDPR build path so pipeline
  previews and external-eval pipeline slides share the same renderer contract.
