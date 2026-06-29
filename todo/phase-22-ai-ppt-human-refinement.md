# Phase 22 - AI PPT Human Refinement Loops

## Goal

Register source-grounded TODOs from the video
`AI로 만든 PPT 그냥 쓰지 마세요`
(`https://www.youtube.com/watch?v=GX0Fn-5YqKE&t=464s`) so MDPR and
`mdpr-skill` can improve AI-generated deck quality without weakening the
deterministic MDPR boundary.

The video's practical workflow is: treat AI output as a draft that needs human
refinement, quickly replace deck-wide fonts, restore emphasis hierarchy with
font weights, inspect alignment and empty space, improve highlight and cover
pages with relevant imagery, polish charts and numeric units, compare
before/after output, and finish with a repeatable final-check workflow.

## Source Mapping

Source checked on 2026-06-29:

- Video title: `AI로 만든 PPT 그냥 쓰지 마세요`
- Uploader: `피프`
- Upload date: 2026-06-28
- Duration: 10:23
- Requested timestamp: 464 seconds, near the transition into detail refinement.

Chapter-derived improvement areas:

| Video chapter | MDPR / mdpr-skill improvement area |
| --- | --- |
| Intro | Human-in-the-loop AI PPT refinement workflow and source-grounded cleanup gates |
| Changing Fonts | Deck-wide typography normalization and emphasis hierarchy review |
| Setting the Layout | Alignment, occlusion, whitespace, and time-boxed layout triage |
| Creating Highlight Pages | Semantic image-brief generation for impact slides |
| Creating the Cover | Cover image/story fit review |
| Refining Details | Chart label typography, series-color association, unit scale, and visual noise review |
| Comparing Before and After | Baseline-vs-refined evaluation and regression gates |
| Wrapping Up | Final refinement checklist and docs for repeatable AI PPT cleanup |

## Boundary

- `mdpr-skill` may emit findings, semantic prompts, content suggestions,
  evidence ledgers, and approval-bound proposals.
- MDPR remains responsible for final layout, coordinates, typography, theme
  colors, image placement, object ordering, clipping, overflow, coherence, and
  renderer output.
- Generated image prompts are allowed only as semantic briefs. They must not
  select final assets, crop boxes, exact placement, or renderer object IDs.
- PowerPoint manual edits may become approved rail evidence or pack/override
  candidates only through `mdpr-ppt`, not agent hints.

## Registered TODOs

### AI-PPT-P0-000 - Add human-in-the-loop AI PPT refinement workflow

Priority: P0
Owner: `mdpr-skill`

Work:

- Document AI-generated PPTs as drafts that require review before practical
  use.
- Add a workflow entry that runs refinement review in this order: typography,
  emphasis, layout, highlight/cover story fit, chart-detail polish, before/after
  comparison, and final checklist.
- Keep each step evidence-grounded and optionally skippable for time-boxed human
  cleanup.

Acceptance:

- The workflow can be followed from Markdown, MDPR manifests, rendered previews,
  and review artifacts.
- Every step states whether it emits review findings, semantic hints, source
  cleanup suggestions, image briefs, or approval-bound proposals.
- The workflow explicitly says MDPR validation remains authoritative for final
  pass/fail status.

### AI-PPT-P0-001 - Add AI-generated deck refinement review profile

Priority: P0
Owner: `mdpr-skill`

Work:

- Add a review profile for AI-generated PPT cleanup that aggregates typography,
  emphasis, layout, highlight, cover, chart-detail, and before/after findings.
- Consume MDPR manifests, design locks, rendered preview paths, and source
  Markdown summaries.
- Emit only evidence-grounded review notes and MDPR policy/config suggestions.

Acceptance:

- Findings cite slide IDs, block IDs, rendered evidence paths, MDPR report
  finding IDs, or source excerpts.
- Findings never include final coordinates, raw color decisions, exact fonts,
  exact image assets, crop boxes, z-order, recipe IDs, variants, or renderer IDs.
- Existing review-core boundary tests are extended for this profile.

### AI-PPT-P0-002 - Add typography and emphasis hierarchy review

Priority: P0
Owner: `mdpr-skill`, with deterministic policy follow-up for MDPR

Work:

- Detect inconsistent deck-wide font families, mixed fallback fonts, overuse of
  generic bold flags, and missing emphasis hierarchy.
- Recommend theme-token or approved-pack normalization instead of exact font
  choices inside hints.
- Propose a deterministic MDPR policy for named font-weight roles such as body,
  emphasis, title, and data-label.

Acceptance:

- Review output says which slides or text roles need normalization, not which
  final font file to use.
- Agent hints cannot carry exact font names, font weights, or typography sizes.
- MDPR-side follow-up records how approved theme/pack tokens own final font
  family and weight choices.

### AI-PPT-P1-003 - Add layout triage for fast human polish

Priority: P1
Owner: `mdpr-skill`, MDPR validation remains authoritative

Work:

- Review rendered/manifest evidence for likely off-center groups, hidden or
  covered content, excessive empty space, alignment drift, and distracting
  repeated decorations.
- Classify findings as required fixes or optional polish so users can time-box
  cleanup.
- Keep MDPR's deterministic overflow, clipping, alignment, and coherence gates
  as the source of truth.

Acceptance:

- Required findings are grounded in MDPR validation or explicit rendered
  evidence.
- Optional findings include a rationale and do not block release unless a
  deterministic MDPR gate also fails.
- Suggested fixes are expressed as source cleanup, semantic grouping hints, or
  MDPR rulebook/config changes.

### AI-PPT-P1-004 - Add semantic image-brief helper for highlight slides

Priority: P1
Owner: `mdpr-skill`

Work:

- Given a slide claim, audience, tone, and source text, generate 1-3 semantic
  image briefs for impact/highlight slides.
- Preserve provenance from source headings, slide IDs, claims, and optional
  source notes.
- Mark generated image use as approval-bound and outside `agent-hint.json`.

Acceptance:

- Briefs describe subject, mood, evidence connection, and avoid-list only.
- Briefs do not include exact image URLs, final crops, coordinates, dimensions,
  layer order, or renderer object IDs.
- The helper can be disabled without changing MDPR's deterministic deck build.

### AI-PPT-P1-005 - Add cover-story fit review

Priority: P1
Owner: `mdpr-skill`

Work:

- Review whether a cover image candidate matches the deck's topic, emotional
  stance, audience, and first-slide claim.
- Compare candidates semantically when multiple cover options are provided.
- Require source/evidence provenance for the recommendation.

Acceptance:

- Output ranks or comments on candidates by narrative fit only.
- Output does not select final placement, crop, color grade, or image asset.
- If candidates are missing, the helper emits a semantic image brief instead of
  inventing a final visual.

### AI-PPT-P1-006 - Add chart and numeric-detail polish review

Priority: P1
Owner: `mdpr-skill`, with MDPR manifest support as needed

Work:

- Review chart text roles for font-token consistency, label readability,
  series-label color association, unit scale, and numeric emphasis.
- Flag visual noise such as redundant numbering, unnecessary arrows, or
  decorations that compete with the main number or claim.
- Request any missing chart metadata from MDPR manifests instead of inferring
  final geometry from screenshots.

Acceptance:

- Findings cite chart IDs, data-label roles, series IDs, rendered evidence, or
  source claims.
- Suggestions stay at policy level, such as "unit labels should use a subordinate
  data-label role" or "series labels should reference theme chart tokens."
- The helper does not emit exact label coordinates, font sizes, or raw colors.

### AI-PPT-P2-007 - Add baseline-vs-refined deck evaluation

Priority: P2
Owner: `mdpr-skill`

Work:

- Extend eval workflows so an AI-generated baseline and a refined deck can be
  compared using MDPR validation, review-core findings, rendered contact sheets,
  and source coverage.
- Track whether refinements reduce findings without introducing new boundary
  violations or validation regressions.
- Add a compact before/after report suitable for release review.

Acceptance:

- Eval report distinguishes content/narrative improvement, visual-policy
  improvement, and deterministic MDPR validation status.
- Guided/refined output fails the gate if it increases MDPR validation errors or
  introduces forbidden final-decision fields.
- The report includes rendered evidence paths and a concise change summary.

### AI-PPT-P2-008 - Capture manual PowerPoint refinements through approved rail

Priority: P2
Owner: future `mdpr-ppt`

Work:

- Capture human edits for fonts, emphasis, layout grouping, cover/highlight
  image choice, chart labels, unit scale, and decorative removals.
- Export the result as approved selection, change-request, pack, or override
  candidates.
- Keep exact PowerPoint geometry and style snapshots out of `agent-hint.json`.

Acceptance:

- Captured manual edits carry explicit approval metadata and provenance.
- mdpr-skill rejects the same exact fields if they are supplied as agent hints.
- MDPR can consume approved candidates only after its validation gates pass.

### AI-PPT-P3-009 - Add synthetic before/after fixture deck

Priority: P3
Owner: `mdpr-skill`

Work:

- Build a small synthetic AI-generated deck fixture that exhibits the video's
  improvement categories without copying the video's original assets or deck.
- Include baseline, refined, manifest, rendered preview, and review report
  artifacts.
- Use the fixture in docs and regression tests for the refinement profile.

Acceptance:

- Fixture demonstrates font normalization, emphasis hierarchy, layout triage,
  highlight/cover image briefs, chart detail polish, and before/after review.
- Fixture sources are project-owned or license-safe.
- Tests can run without network access and without the original YouTube assets.

### AI-PPT-P3-010 - Add final AI PPT cleanup checklist documentation

Priority: P3
Owner: `mdpr-skill`

Work:

- Add a concise final-check document for AI PPT cleanup based on the video's
  wrap-up: fonts/emphasis, alignment/empty space, highlight and cover imagery,
  chart/detail polish, before/after review, and MDPR validation status.
- Link each checklist item to the corresponding CLI helper or review artifact
  once implemented.
- Include guidance for when to stop at "good enough" versus when to escalate to
  MDPR rulebook/config work.

Acceptance:

- Checklist is repeatable without watching the video again.
- Checklist does not include manual final coordinates, raw colors, exact fonts,
  exact image assets, or renderer IDs.
- Docs make clear that generated decks should not be shipped until deterministic
  MDPR gates and the human refinement checklist are both reviewed.

## Acceptance

- All registered work preserves the MDPR/mdpr-skill ownership split.
- All LLM-assisted outputs are semantic, evidence-grounded, and optional.
- Final typography, layout, colors, images, chart rendering, clipping, overflow,
  and coherence decisions remain deterministic MDPR responsibilities.
- The video source and timestamp are recorded in `SOURCES.md`.

## Progress

- 2026-06-29: Registered this phase from YouTube metadata and Korean automatic
  captions extracted with `yt-dlp`; no implementation work has started.
