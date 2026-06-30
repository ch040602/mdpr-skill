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
- Each iteration also creates a `codex-ppt-skill` image-only baseline by copying
  the rendered page PNGs into `origin_image/slide_XX.png` and assembling them
  with `codex-ppt`'s `assemble_ppt.py`. This tests the codex-ppt output model
  without pretending that an image backend generated those pages.

## Generated Artifacts

- Summary report: `artifacts/external-markdown-visual-eval/external-markdown-visual-eval-report.json`
- Request completion ledger:
  `artifacts/external-markdown-visual-eval/request-completion-ledger.json`
- Dominance comparison ledger:
  `artifacts/external-markdown-visual-eval/dominance-comparison-ledger.json`
- Final MDPR editable PPTX: `artifacts/external-markdown-visual-eval/iteration-05/build/deck.pptx`
- Final codex-ppt image-only PPTX baseline: `artifacts/external-markdown-visual-eval/iteration-05/codex-ppt-baseline/external-md-codex-ppt-iter-05/external-md-codex-ppt-iter-05.pptx`
- `Presentations` probe PPTX/contact sheets:
  `artifacts/presentations-probe/external-md-visual-eval/` contains five
  five-slide probe decks across engineering, product, GTM, strategy, and
  finance profiles.
- `Presentations` 23-prompt battle outputs:
  `artifacts/presentations-probe/external-md-visual-eval-23/` contains 23
  editable artifact-tool PPTX probes, 23 per-probe contact sheets, 46 retained
  first/proof slide PNG evidence images, and two aggregate contact sheets.
- Final rendered PNGs: `artifacts/external-markdown-visual-eval/iteration-05/png/`
- Final all-slide contact sheet: `artifacts/external-markdown-visual-eval/iteration-05/contact-sheet.png`

## Iteration Result

| Iteration | Build path | Rendered slides | Result |
| --- | --- | ---: | --- |
| 1 | Markdown download -> corpus deck -> PPTX/PNG | 48 | Pass after TOC splitting fix |
| 2 | Bounded bullet extraction applied | 51 | Pass |
| 3 | Corpus evidence chart added | 28 | Pass |
| 4 | Rule-based composition diversification and local pipeline Markdown | 38 | Pass |
| 5 | Same diversified rule path plus codex-ppt image-only assembly baseline | 41 | Pass |

The final report records 23 sources, 5 iterations, 5 generated MDPR PPTX decks,
5 codex-ppt image-only PPTX baselines, 5 PowerPoint PNG export sets, and
all-slide contact sheets for VLM review.

The request completion ledger joins the scattered evidence into one release
gate. It checks codex-ppt compatibility coverage, 20+ Markdown comparison data,
five-pass iteration, 20+ visual criteria, codex-ppt baselines, 20+ Presentations
probe completions, page-image evidence, superiority dimensions, and final
artifact presence.

The dominance ledger adds one comparison row per source document. Each row
links a final MDPR page PNG, the final MDPR PPTX, the codex-ppt image-only
baseline PPTX, and the `Presentations` comeback-rubric reference. The current
ledger records 23 comparisons, 25 criteria, minimum final criteria score `5`,
and wins on coherence, visual guidance, polish, readability, native editability,
image-only baseline delta, and `Presentations` rubric alignment.

## Comparison Criteria

The visual battle now records 25 scoring dimensions, including coherence,
visual guidance, pretty, readability, claim-title strength, proof-object
strength, thumbnail rhythm, macro-layout diversity, contrast, whitespace,
native editability, image-only baseline delta, and alignment with the
`Presentations` comeback rubric.

The `Presentations` skill is recorded as both a rubric reference and generated
probes. The first direct run exposed an environment issue: when `HOME` was not
set for Node, the harness searched the repo-local `.cache` path and could not
find `@oai/artifact-tool`. Running with `HOME=C:\Users\hcslab_523` and
`PYTHON=python` produced the 23-prompt artifact-tool battle. The manifest
`artifacts/presentations-probe/external-md-visual-eval-23/presentations-probe-battle-manifest.json`
records 23 prompts, 23 PPTX files, 23 per-probe contact sheets, 23 first-slide
PNGs, 23 proof-slide PNGs, minimum score `44`, and average score `46.3`.

## Composition Gate

The evaluation now reads MDPR's normal `plan` output and scores layout
composition in addition to overflow, font size, nonblank rendering, and contrast.
The gate fails decks with excessive repeated card-heavy layout sequences, weak
title/body scale hierarchy, or too few layout families on larger decks.

Observed improvement in the diversified final iterations:

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
