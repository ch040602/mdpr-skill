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
| MDPR commit | `f547e1c` |
| Markdown files | 21 |
| Headings | 185 |
| Source characters | 97,285 |
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
  subprocess decoding, retried two consecutive transient process failures, and
  rejected incomplete export sets.
- removed redundant continuous vertical rails and the TOC center separator;
- added history-driven triptych/quartet topology, named it in the validator,
  and rendered horizontal rows as open cells rather than repeated white cards;
- corrected font-floor scope to text-bearing regions while keeping code and
  captions governed, and lowered continuation markers to secondary title runs.

## Visual Improvement Loop Ledger

| Loop | Visual finding | Accepted change | Rendered result |
| ---: | --- | --- | --- |
| 1 | MDPR rewarded exact layout repetition; review slide 4 clipped its last card rows; slide 9 spent most of its area on a generic rounded icon panel. | Prefer same-family layout alternation, reject named card content outside its container, enlarge the pipeline ownership cards, and replace slide 9 with a flat decision-boundary comparison. | 35 + 9 PowerPoint exports complete; 16pt floor; zero named-container overflow; slide 4 and slide 9 visually rechecked. |
| 2 | Generated continuations greedily produced 14/2 Agenda pages and a 4/4/2 basic-example tail. | Balance entries across the required page count without changing capacity, order, or slide count. | Targeted PowerPoint exports show 8/8 Agenda pages and 4/3/3 example pages with no clipping or content loss. |
| 3 | MDPR and mdpr-skill actor colors reversed between evidence slides 4 and 9. | Bind teal to MDPR and purple to mdpr-skill through explicit role constants on slides 1, 4, and 9. | Slides 1, 4, and 9 visually rechecked; actor-role color test passes and geometry/copy remain unchanged. |
| 4 | The polish gate passed even though 2×2 card geometry dominated across section boundaries. | Score candidate layouts from visible region geometry, track the last five eligible geometries, and fail deck-level saturation above 60% or more than three repeats in five while excluding forced object layouts. | Grid 2×2 use fell to 7 slides and vertical stacks rose to 13; 35 + 9 exports remain valid, 16pt minimum, zero named-container overflow. |
| 5 | A neutral file inventory was misclassified as a semantic comparison because one item mentioned `comparison` and `before/after`, producing two long title-adjacent rules, a blank band, and uneven visible column starts. | Preserve two-column geometry as `neutral-split`, require paired evidence in separate semantic units for full comparison chrome, omit neutral body rules, top-align rows, and fail unqualified full comparison layouts in the polish validator. | Actual slide 21 has zero title-adjacent rules, aligned column starts, and no blank band; 35 + 9 PowerPoint exports remain valid with a 16pt minimum and zero named-container overflow. |
| 6 | Five section-opening slides repeated their exact title as the first body card or row, wasting one of three or four visible content slots. | Normalize comparison-corpus headings, remove the emitted section title and later exact duplicates before applying the item limit, and keep the remaining unique headings in source order. | Slides 7, 9, 12, 15, and 18 now show each title once and retain the next useful editable item; deck-wide title/body echoes are zero, with 35 + 9 valid exports, a 16pt minimum, and zero named-container overflow. |
| 7 | The balanced two-page Agenda used 01–08 on both pages, creating duplicate navigation identifiers and making the continuation read like a separate list. | Render TOC prefixes from each bound global `toc-item-N` block ID, retaining the slide-local region suffix only as a legacy fallback. | Slide 2 remains 01–08 and slide 3 is 09–16; the 8/8 split, geometry, editable text, 528-shape baseline, 35 + 9 valid exports, 16pt minimum, and zero overflow remain unchanged. |
| 8 | Three-line code snippets occupied a fixed 5.25in white panel and carried a non-semantic folded-corner accent. | Size code-focus regions from line count within the previous safe bound, vertically balance sparse snippets, and use a plain rounded code surface in PPTX and HTML. | Slides 17 and 20 show compact centered code panels with no fold; dense 30-line code retains the 5.25in bound and all code stays editable at 16pt or above. |
| 9 | PowerPoint could export a slide while transiently returning a null `HWND`, but the isolated helper treated that optional cleanup handle as a hard failure. | Guard null/zero window handles while preserving presentation/export errors, COM cleanup, and the final PNG existence gate. | The previously failing slide 17 export succeeds, and the full 35 + 9 isolated export completes without fallback or stale evidence. |
| 10 | Comparison artifacts and README ownership text referred to different runtime revisions, and the MDPR tables omitted the skill-side decorative-line boundary. | Regenerate both decks from MDPR `b1ae7c0`, align English/Korean/Chinese typography and line rules, and add one quick-choice sentence to both repositories. | The report is bound to `b1ae7c0`; 35/35 + 9/9 PowerPoint exports pass, both decks keep a 16pt minimum and zero named-container overflow, and the comparison text now states that the tools are complementary. |
| 11 | Vertical lists had one continuous rail plus per-item accents. | Remove the continuous rail and keep only semantic item accents. | No redundant full-height rail remains. |
| 12 | Two-column Agenda added a center separator despite sufficient whitespace and numbering. | Remove the center rule. | Agenda remains clearly grouped with no title-adjacent or center rule. |
| 13 | Three equal items always used a vertical stack. | Add horizontal triptych with vertical fallback. | Three-item sections alternate row and stack geometry at 16pt+. |
| 14 | Four-item sections repeated 2x2 cards. | Keep 2x2 default; select a compact quartet only after repeated 2x2 history. | A test deck renders 2x2, 2x2, then an equal four-column row. |
| 15 | Image/decorative typography metadata could falsely lower the font floor. | Count only text-bearing regions; retain code/caption coverage and distinguish configured family from host availability. | A 6pt image placeholder passes; a 12pt caption still fails. |
| 16 | Skill critique could treat line presence itself as a defect. | Require semantic-role, repetition, and rendered before/after evidence. | Meaningful borders remain; duplicate/unassigned rules are actionable. |
| 17 | `(Cont. n/m)` used full title weight. | Preserve it as a separate muted PPTX run/HTML span at 16pt+. | Continuation state is legible but secondary. |
| 18 | Triptych/quartet collapsed into generic `freeform-N` validator labels. | Add `card-row-3` and `card-row-4` visible signatures. | Geometry diversity reports the actual row topology. |
| 19 | New row geometry still looked like the same white-card system. | Omit full surfaces only for horizontal rows; retain per-item accents. | Row slides read as open columns and visibly break card repetition. |
| 20 | A transient PowerPoint process could fail twice and invalidate a full comparison. | Permit a third isolated attempt, clear stale output, and regenerate all evidence from `c93ac84`. | 35/35 + 9/9 export, invalid 0, 16pt floor, overflow 0, report `ok:true`. |
| 21 | Pro cycle 1 assumed slide 24 still used stacked full-width strips. | Reject the duplicate row proposal after inspecting the actual PowerPoint export; narrow the next review to triptych height and whitespace balance. | Slide 24 already has an open horizontal triptych, ordered editable source text, and no card surface; no runtime change was justified. |
| 22 | Pro cycle 2 correctly identified that the existing triptych fixed every short continuation item to a 2.75in-tall region. | Reuse the existing variant and font-metric measurer; compact only short text-only continuations while retaining the old center and all horizontal/source geometry. | Slide 24 keeps the same three editable source strings and 3-column topology, while its item accents shrink from 2.75in to 1.55in; 35/35 + 9/9 exports, 16pt floor, and overflow 0 remain. |
| 23 | Pro cycle 3 found that slide 6 used three 1.45in cards for one-line pipeline nodes. The first local test incorrectly modeled them as list items, which rendered evidence exposed as a false positive. | Correct the fixture to the actual `diagram` block and `pipeline` preset, then content-size only the existing diagram region for short 2–3-node continuations. | Slide 6 keeps its editable nodes, numbering, accents, connectors, 8.60in card width, and prior center while card height falls to 0.95in; long-label controls retain 5.75in capacity and the full comparison remains 35/35 + 9/9 with report `ok:true`. |
| 24 | Pro cycle 4 correctly saw repeated path tails in the PowerPoint export of Agenda items 10 and 13, but attributed them to shrink-autofit. | Reject the proposed `fit:none` change after inspecting slide3.xml: it already has no `normAutofit`/`spAutoFit`, each source path occurs once, and each item is one editable shape. | No no-op runtime change was made. The reproducible PowerPoint-only wrap artifact remains explicitly scoped for cycle 5, with slides 8, 26, 28, and 33 retained as unaffected controls. |

## Remaining Limitations

- Content-preserving MDPR splitting can still produce low-density continuation
  slides when a source section contains only a few large semantic blocks; the
  continuation marker hierarchy is fixed, but source-preserving density remains.
- PowerPoint can visually repeat a suffix while wrapping some long slash-delimited
  Agenda paths even though slide XML contains the source once in one text shape
  and has no autofit metadata. The current validators correctly avoid claiming
  source duplication, but the rendered wrap artifact still needs a proven fix.
- Structural card accents and data separators remain when they communicate a
  real grouping; the rule removes only isolated or title-repeating lines.
- Template master/theme OOXML can be preserved, but this comparison does not
  prove that a requested font is installed or embedded on every host.
- The nine-slide review deck explains evidence and boundaries. It must not be
  interpreted as a styled replacement for the 35-slide MDPR runtime output.

Cross-repository schema and boundary validation is stored in
`artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json`.
