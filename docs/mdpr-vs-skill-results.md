# MDPR vs mdpr-skill Review Evidence

This comparison uses the current sibling MDPR checkout, not the stale cached
copy. MDPR renders the shared Markdown corpus; the mdpr-skill deck explains the
review boundary and records evidence. It is not a second renderer.

## Result Files

- MDPR baseline PPTX: `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- Review evidence PPTX: `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`
- Evidence copy tied to the actual MDPR run: `artifacts/mdpr-vs-skill/mdpr-skill-from-actual-md-run.pptx`
- Shared Markdown source: `artifacts/mdpr-vs-skill/mdpr-source-corpus.md`
- Source manifest: `artifacts/mdpr-vs-skill/source-manifest.json`
- Machine-readable report: `artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json`

Regenerate and validate both decks:

```bash
npm run compare:mdpr-skill
```

## Current Evidence Scope

| Evidence | Current value |
| --- | ---: |
| MDPR commit | `3f1d3e5` |
| Markdown files | 21 |
| Headings | 184 |
| Source characters | 93,383 |
| MDPR baseline slides | 35 |
| Review evidence slides | 9 |
| Minimum generated font in each PPTX | 16pt |

The 21 files comprise 13 product/runtime documents, six example decks, one
root README, and one ADR. The manifest remains a JSON evidence artifact instead
of being repeated across sparse presentation slides.

## Boundary Comparison

| Decision boundary | MDPR | mdpr-skill review evidence |
| --- | --- | --- |
| Primary job | Deterministic Markdown parsing, splitting, layout, validation, and rendering | Optional semantic hints, critique, and evidence |
| Input | Markdown, parser mode, Presentation IR, Layout IR, templates | MDPR source context, manifests, rendered slides, and evidence paths |
| Typography | Owns exact family, size, floor, wrapping, and editable text runs | May suggest copy reduction or splitting, but cannot prescribe exact typography |
| Visual pass/fail | Owns required polish chapters and `MDPR_POLISH_GATE_FAILED` | Mirrors runtime failures and adds review findings without weakening them |
| Output | Editable PPTX, HTML, PDF, manifests, and previews | Hint files, review reports, and comparison evidence |

## Visual Revalidation Findings

Every slide is exported through its own PowerPoint process after a layout
stabilization delay. Preview files are cleared first, exact slide counts are
required, and a failed or partial export cannot fall back to stale PNGs.

The current review led to these changes:

- removed synthetic one-line subtitles, title underlines, isolated cover-bottom
  rules, TOC horizontal rules, and bottom takeaway bands;
- removed the slide-based source manifest and empty comparison section that
  created 12 sparse or content-free slides;
- normalized leading document numbers in comparison headings so Agenda does not
  display duplicated numbering;
- raised generated caption, code, list-badge, and diagram-badge behavior to the
  16pt visual floor instead of preserving code/caption exceptions;
- excluded intentional `.github` form checkboxes from unfinished-work detection
  while keeping unchecked boxes in governed documentation as failures;
- isolated PowerPoint exports per slide, waited for full layout, fixed UTF-8
  subprocess decoding, and rejected incomplete export sets.

## Visual Improvement Loop Ledger

| Loop | Visual finding | Accepted change | Rendered result |
| ---: | --- | --- | --- |
| 1 | MDPR rewarded exact layout repetition; review slide 4 clipped its last card rows; slide 9 spent most of its area on a generic rounded icon panel. | Prefer same-family layout alternation, reject named card content outside its container, enlarge the pipeline ownership cards, and replace slide 9 with a flat decision-boundary comparison. | 35 + 9 PowerPoint exports complete; 16pt floor; zero named-container overflow; slide 4 and slide 9 visually rechecked. |
| 2 | Generated continuations greedily produced 14/2 Agenda pages and a 4/4/2 basic-example tail. | Balance entries across the required page count without changing capacity, order, or slide count. | Targeted PowerPoint exports show 8/8 Agenda pages and 4/3/3 example pages with no clipping or content loss. |
| 3 | MDPR and mdpr-skill actor colors reversed between evidence slides 4 and 9. | Bind teal to MDPR and purple to mdpr-skill through explicit role constants on slides 1, 4, and 9. | Slides 1, 4, and 9 visually rechecked; actor-role color test passes and geometry/copy remain unchanged. |
| 4 | The polish gate passed even though 2×2 card geometry dominated across section boundaries. | Score candidate layouts from visible region geometry, track the last five eligible geometries, and fail deck-level saturation above 60% or more than three repeats in five while excluding forced object layouts. | Grid 2×2 use fell to 7 slides and vertical stacks rose to 13; 35 + 9 exports remain valid, 16pt minimum, zero named-container overflow. |
| 5 | A neutral file inventory was misclassified as a semantic comparison because one item mentioned `comparison` and `before/after`, producing two long title-adjacent rules, a blank band, and uneven visible column starts. | Preserve two-column geometry as `neutral-split`, require paired evidence in separate semantic units for full comparison chrome, omit neutral body rules, top-align rows, and fail unqualified full comparison layouts in the polish validator. | Actual slide 21 has zero title-adjacent rules, aligned column starts, and no blank band; 35 + 9 PowerPoint exports remain valid with a 16pt minimum and zero named-container overflow. |

## Remaining Limitations

- Content-preserving MDPR splitting can still produce low-density continuation
  slides when a source section contains only a few large semantic blocks.
- Structural card accents and data separators remain when they communicate a
  real grouping; the rule removes only isolated or title-repeating lines.
- Template master/theme OOXML can be preserved, but this comparison does not
  prove that a requested font is installed or embedded on every host.
- The nine-slide review deck explains evidence and boundaries. It must not be
  interpreted as a styled replacement for the 35-slide MDPR runtime output.

Cross-repository schema and boundary validation is stored in
`artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json`.
