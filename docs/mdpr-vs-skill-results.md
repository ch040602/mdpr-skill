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
- Exact MDPR build manifest: `artifacts/mdpr-vs-skill/mdpr-runtime-manifest.json`
- Machine-readable report: `artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json`

Regenerate and validate both decks:

```bash
npm run compare:mdpr-skill
```

## Current Evidence Scope

| Evidence | Current value |
| --- | ---: |
| MDPR commit | `41a84af` |
| Markdown files | 21 |
| Headings | 186 |
| Source characters | 104,352 |
| MDPR baseline slides | 32 |
| Review evidence slides | 9 |
| Minimum generated font in each PPTX | 16pt |
| Native MDPR tables | 5 |

The 21 files comprise 13 product/runtime documents, six example decks, one
root README, and one ADR. The manifest remains a JSON evidence artifact instead
of being repeated across sparse presentation slides.

## Boundary Comparison

| Decision boundary | MDPR | mdpr-skill review evidence |
| --- | --- | --- |
| Primary job | Deterministic Markdown parsing, splitting, layout, validation, and rendering | Optional semantic hints, critique, and evidence |
| Input | Markdown, parser mode, Presentation IR, Layout IR, templates | MDPR source context, manifests, rendered slides, and evidence paths |
| Typography | Owns exact family, size, floor, wrapping, and editable text runs | May suggest copy reduction or splitting, but cannot prescribe exact typography |
| Font portability | Owns host probing, OpenType `fsType` checks, explicit EOT packaging, face coverage, post-render hash-bound caller attestations, and manifest pass/fail | Reviews MDPR evidence only; never creates license evidence, selects or embeds font files, interprets legal sufficiency, or overrides runtime pass/fail |
| Visual pass/fail | Owns required polish chapters and manifest pass/fail through `validation.polish.requiredFailureCount` | Mirrors runtime failures as `MDPR_POLISH_GATE_FAILED` and adds review findings without weakening them |
| Output | Editable PPTX, HTML, PDF, manifests, and previews | Hint files, review reports, and comparison evidence |

## Visual Revalidation Findings

Every slide is exported through its own PowerPoint process after a layout
stabilization delay. Preview files are cleared first, exact slide counts are
required, and a failed or partial export cannot fall back to stale PNGs. Each
accepted PowerPoint PNG is then stored as true-color RGB before visual review;
this prevents indexed-palette viewer artifacts from becoming false findings.

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
- recorded the export host font catalog separately from portability, added the
  optional `--require-font-installed` gate, and now accepts explicit
  `--embed-font` faces with `--require-font-embedded` coverage gating;
- preserved source heading ancestry in the comparison corpus, promoting only
  explicit current/improved sibling groups to editable two-column tables;
- compacted short one- and two-item continuation regions around their measured
  content while retaining full capacity for long controls;
- serialized comparison exports with an OS file lock so a timed-out caller
  cannot leave a second writer corrupting PNG evidence.

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
| 25 | Pro cycle 5 proposed splitting slash paths into multiple identical text runs, but a unique-path true-color render showed that the supposed repeated suffix was an indexed-palette review-display artifact. | Reject the runtime run-segmentation change; normalize comparison PNGs atomically to RGB after each isolated PowerPoint export and add a pixel-preservation regression. | PPTX text and geometry stay unchanged; slide 3 shows items 10 and 13 once in true-color evidence; all 8 tracked previews are RGB; 35/35 + 9/9 exports, 16pt floor, invalid 0, overflow 0, and report `ok:true` remain. |
| 26 | Follow-up Pro cycle 1 found that slide 4 gave its short `Area` labels the same one-third width as the two evidence columns, wasting space and increasing evidence wrapping. | For eligible three-column comparison tables only, measure short one-line body labels, clamp the first column to at least 1.35in and at most 24%, and split the remainder equally; preserve equal widths for long-label controls. | Slide 4 changes from 3.733/3.733/3.733in to 1.350/4.925/4.925in, keeps every source cell once as a native editable table, and passes fresh RGB visual review; 35/35 + 9/9 exports, 16pt floor, invalid 0, overflow 0, and report `ok:true` remain. |
| 27 | Follow-up Pro cycle 2 found no new defect in the current attached evidence after inspecting MDPR slides 1–4 and mdpr-skill slide 4. | Accept `NO_ACTION`: do not turn consistent Agenda alignment or table tracking into a subjective gate without a failing negative control, and do not repeat completed wrapping, ordinal, column-width, or RGB work. | No runtime or artifact change was justified; the push records the exact Pro session and retains the validated 35/35 + 9/9, 16pt, invalid 0, overflow 0 baseline. |
| 28 | Follow-up Pro cycle 3 found a 11.2×0.08in blue bar below slide 15's title with no source or content anchor; local OOXML traced it to the separate `body` branch of `addRegionAccents`, not the already-removed generic title rule. | Restrict automatic region accents to semantic `item` regions. Do not add a wide-line validator heuristic; preserve pipeline, list-item, table, code-surface, comparison, and key-message boundaries through their existing paths. | The exact slide 15 regression changes red→green, item-accent negative control retains all three triptych accents, and fresh unique-path RGB exports show only the three unassigned body title bands on slides 11, 14, and 15 removed; 35/35 + 9/9 exports, 16pt floor, invalid 0, overflow 0, and report `ok:true` remain. |
| 29 | Follow-up Pro cycle 4 found that horizontal and elbow-final pipeline connectors lost their visible direction markers while vertical terminals remained visible. | Verify the target markers already exist, then split z-order only: nonterminal segments behind node surfaces, terminal segments above surfaces and below decorations, badges, and text. | Slides 5 and 8 retain route points, node geometry, labels, and shape counts while fresh PowerPoint RGB exports show every right-, left-, up-, and down-facing arrowhead without card-text intrusion; renderer 62/62 and the full workspace pass. |
| 30 | Follow-up Pro cycle 5 found that skill slide 3 separated 13 Docs and 1 ADR while slide 8 silently labelled the same 14-file aggregate as Docs. | Reuse one source-family grouping helper and conditionally label the existing three-category slide-8 aggregate `Docs + ADR`; keep slide 3's separate cards and every numeric value unchanged. | Fresh PowerPoint RGB evidence shows `Docs + ADR` once on the native chart axis and once in the editable table, slide 3 remains 13 Docs + 1 ADR, and the regenerated comparison passes 35/35 + 9/9, 16pt floor, invalid 0, overflow 0, report `ok:true`. |
| 31 | Additional Pro cycle 1 claimed the current font hierarchy report treated a configured family as host-availability evidence. | Reject after inspecting MDPR `6f26467`: the gate checks configured family presence and its evidence already says installed-font availability requires export-environment validation. | No duplicate status fields or OS-specific font probe were added; the 16pt floor and honest external host-font limitation remain unchanged. |
| 32 | Additional Pro cycle 2 inspected current low-density continuation evidence for a new grouping or splitting defect. | Accept `NO_ACTION`: the sparse slides preserve small coherent source groups and contain no missing/duplicated block, orphaned context, or justified cross-section merge. | No speculative merge rule was added; moving items would only transfer whitespace or violate semantic boundaries, so the residual low density remains an explicit source-preservation limitation. |
| 33 | Additional Pro cycle 3 found that mapped content regions with zero, negative, or non-finite geometry could bypass the slide-edge-only bounds predicate. | Accept as `RDD-T-00000048`: require finite geometry and positive extents only for title/block-bearing content, preserving the general all-region slide-boundary check. | Red failed 14/15; green passes 15/15 plus the full MDPR workspace. Invalid content emits one reasoned diagnostic, while an empty zero-size icon remains a passing false-positive control. |
| 34 | Additional Pro cycle 4 found that the comparison assigned the literal `MDPR_POLISH_GATE_FAILED` finding type to MDPR even though review-core emits that mirror finding from MDPR manifest evidence. | Accept as `RDD-T-00000130`: state that MDPR owns pass/fail through `validation.polish.requiredFailureCount`, while mdpr-skill emits the named mirror finding without recalculating it. | Boundary regression failed 8/9 before the one-row correction and passes 9/9 after it; README still records both the mdpr-skill mirror action and `runtimeOwner: "MDPR"`. |
| 35 | Additional Pro cycle 5 proposed grouping slide 26 accents as three current-state items and one improved-state item. | Reject as `RDD-F-ca515d2be3`: current IR marks the slide as `grid`, all four items are flat level-0 peers in one split bullet block, and no comparison-side ancestry survives in the Markdown input. | No source-ungrounded A/A/A/B rule was added. Fresh contact-sheet review keeps the neutral peer-item alternation, while the comparison remains 35/35 + 9/9, 16pt, invalid 0, and overflow 0. |
| 36 | The practical follow-up found three residual gaps: no host-font preflight, oversized short 1–2 item continuations, and a flattened comparison corpus. A timed-out comparison command also exposed concurrent writers using the same RGB temporary path. | Add manifest font-environment evidence plus strict opt-in failure, content-measured focal geometry with long-text controls, headingPath-based paired-table extraction with an unrelated-section negative control, and a cross-platform single-writer export lock. | Fresh PowerPoint review passes 32/32 + 9/9, 16pt minimum, invalid 0, named-container overflow 0, five native MDPR tables, and report `ok:true`. Slides 22–23 show complete editable current/improved columns without synthetic title rules; slide 25 preserves a compact coherent continuation. |
| 37 | The comparison report could pass from aggregate PPTX, typography, overflow, and preview counts without proving that the same MDPR build passed runtime layout-composition and coherence validation. | Copy the exact generated `mdpresent-manifest.json`, bind it by SHA-256 and MDPR commit, and consume MDPR-owned polish/coherence status without duplicating its geometry heuristics. | Missing, stale, commit-mismatched, polish-failing, or coherence-error evidence fails closed. MDPR warnings remain warnings. The regenerated 32/32 + 9/9 export keeps the 16pt floor, zero invalid frames, and zero named-container overflow. |
| 38 | Five consecutive skill evidence slides used the same enclosing-card surface even though their semantic topologies differed; slides 5 and 7 were near-identical six-item catalogs. | Track generator-owned semantic surface history, fail closed on a five-slide run, and render the later repeated catalog as editable open cells without changing source order or content. | Slide 5 remains the enclosed-card control; slide 7 retains all six items exactly once with no enclosing cards. `skillSurfaceEvidence` reports `maxSameSurfaceRun: 4` and no saturated windows. |
| 39 | A required MDPR layout-composition chapter could report `passed:true` with zero eligible slides and no applicability explanation, so a hash-bound but vacuous diversity result still passed the comparison gate. | Keep eligibility ownership in MDPR: MDPR now emits `applicable:false` plus a reason when every slide is an excluded specialized object layout; mdpr-skill rejects an otherwise passing zero-population result with `RUNTIME_LAYOUT_COMPOSITION_EVIDENCE_VACUOUS`. | Red reproduced the false positive; green preserves populated evidence, explicit runtime-owned N/A, existing failures, and skill surface checks. The regenerated comparison is 32/32 + 9/9, 16pt minimum, invalid 0, overflow 0, and `ok:true` against MDPR `b055bb8`. |
| 40 | The generator-selected example set contained six families, but the MDPR overview named only five and introduced `five-methods` later without an overview cue. | Derive overview coverage from the same selected summaries used for the later sections. Pair adjacent source paths into three readable rows and retain the exact `Five-Item Layout Example` heading for the previously omitted family; add no caption, decorative title rule, or runtime geometry override. | Red found `five-methods` zero times. Two rejected candidates either created a 33rd continuation slide or added two coherence warnings. The accepted RGB-rendered three-row result keeps 32/32 + 9/9, 16pt minimum, invalid 0, overflow 0, warning count 11, and `ok:true`. |

## Resolved Practical Limits

| Previous limit | Current behavior | False-positive control |
| --- | --- | --- |
| A configured family could silently substitute on an unknown host. | Every build records requested/installed/missing families and probe source; `--require-font-installed` fails a proven absence. | An unreadable host catalog emits `FONT_ENVIRONMENT_UNAVAILABLE`, not one missing-font error per family. |
| Host checks could not make a PPTX portable. | Repeatable explicit `--embed-font` faces are checked against OpenType `fsType`, packaged as uncompressed EOT parts, and recorded with hashes and part paths; `--require-font-embedded` gates actual planned family/style coverage. | Preflight never sets `performed: true`; restricted, preview/print-only, bitmap-only, malformed, duplicate, unused, and incomplete required faces fail. |
| Technical `fsType` checks could not carry per-font distribution authorization evidence. | `--font-license-evidence` binds caller-provided license source and authorization statements to each font SHA-256; `--require-font-license-evidence` rebinds the evidence to renderer-reported hashes after PPTX mutation. | Missing, malformed, unauthorized, duplicate, unused, stale, and post-render mismatched records fail; `legalDetermination: external` prevents a legal-sufficiency claim. |
| Short continuation tails used regions sized for much denser content. | One short item narrows to a centered focal card; two short items keep their source-mapped columns and content-size the shared height. | Long or wrapped items retain full capacity; no cross-section merge, extra caption, code, or decorative rule is invented. |
| Example headings and bullets were flattened before comparison review. | The corpus records each list item's `headingPath`; explicit current/improved siblings become native editable tables. | Two unrelated sibling sections remain neutral and are covered by a negative regression. |
| Two comparison processes could mutate the same export directory. | An OS-backed lock permits one writer for the artifact set. | The lock is released by process termination and a nested-writer regression must fail before artifact mutation. |
| A required diversity chapter could pass with an empty evaluated population. | MDPR distinguishes positive-population evidence from an explicit runtime-owned not-applicable result; mdpr-skill rejects an unexplained zero-population pass. | A real failed chapter stays failed, missing fields stay missing, and mdpr-skill never derives eligibility from rendered shapes or pixels. |

## Remaining Limitations

- Font embedding is explicit, not a family-name autodiscovery or download
  service. TTC/OTC/WOFF containers remain unsupported. MDPR can bind a caller's
  attestation to exact bytes, but only the caller or license owner can establish
  that the attestation is legally sufficient.
- Large semantic blocks retain full regions even when a continuation page is
  visually sparse. This is a source-fidelity choice, not permission to merge
  unrelated sections or invent filler.
- A presentation viewer can still misdisplay a valid RGB image. Review findings
  must be checked against RGB pixel data, PPTX text/XML, and a fresh unique-path
  export before changing runtime behavior.
- Structural card accents and data separators remain when they communicate a
  real grouping; the rule removes only isolated or title-repeating lines.
- The nine-slide review deck explains evidence and boundaries. It must not be
  interpreted as a styled replacement for the 32-slide MDPR runtime output.

Cross-repository schema and boundary validation is stored in
`artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json`.
