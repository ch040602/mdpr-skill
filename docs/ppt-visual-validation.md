# PPT Visual Validation

The validation harness creates an actual PowerPoint file and verifies draw order from the PPTX XML.

Artifacts:

- `artifacts/ppt/design_components_z_order_validation.pptx`
- `artifacts/ppt/design_components_z_order_validation.svg`
- `artifacts/ppt/design_components_z_order_validation.png`
- `artifacts/ppt/z_order_report.json`

Validation performed:

- Confirms slide shape order in `ppt/slides/slide1.xml`.
- Confirms the expected topmost object at overlapping points through PNG pixel samples.
- Parses `slide1.xml` back out of the generated PPTX and renders the visual proof from parsed geometry and colors.
- For long-running codex-ppt-compatible review loops, validates
  `mdpr-job-state-v1` with `mdpr-skill codex-ppt job-state validate --state`
  or MDPR's mirrored `mdpresent job-state validate <state.json|build-dir>
  --json` command before treating recorded slide work as complete.

Job-state validation requires:

- statuses are one of `pending`, `dispatched`, `recorded`, `blocked`, or
  `accepted`;
- `recorded` and `accepted` tasks include artifact/report evidence;
- `blocked` tasks include a blocker reason;
- the boundary keeps renderer internals and chat-only completion out of the
  state artifact.

## Scientific Chart Intent

SANFC-like research workbooks should be reviewed through semantic chart intent
before visual or template selection. `review-core` exposes
`mdpr-scientific-chart-intent-v1` as an evidence-only report for structures such
as CDF curves, box/whisker distributions, quantile-band fallbacks, mean values
with error bars, matrix series, and heatmap summaries.

The report records structural evidence only: sheet label, row/column density,
numeric/formula cell counts, chart family hints, and whether error bars are
present. It must not store raw workbook values, formulas, extracted chart
coordinates, raw colors, or final PPTX renderer choices.

Design order for these cases is:

1. `data_evidence`
2. `scientific_chart_intent`
3. `semantic_visual_guidance`
4. `renderer_capability_request`
5. `review_notes`

This order prevents a generic chart frame or theme treatment from being chosen
before the scientific meaning is known. CDF guidance must preserve cumulative
probability semantics; distribution guidance must distinguish median, quantile,
and whisker roles; and error-bar guidance must distinguish visual bar presence
from uncertainty meaning such as standard deviation, standard error, confidence
interval, min/max, custom, or unknown.

MDPR remains responsible for workbook/chart parsing, final chart primitives,
layout, theme tokens, PPTX objects, and validation pass/fail. `mdpr-skill`
emits the intent report and review notes so MDPR can decide whether to render a
native chart, a custom editable object, a quantile-band fallback, or a clear
unsupported-capability finding.

## High-Need Non-Basic Chart Recipes

Excel and Office already expose a broad native chart set, including common
column, line, pie, bar, area, scatter, stock, surface, radar, treemap, sunburst,
histogram, Pareto, box and whisker, waterfall, funnel, and map families. Use
Microsoft's available chart type reference as the native-support boundary:
<https://support.microsoft.com/en-us/excel/available-chart-types-in-office>.

`review-core` also exposes `mdpr-high-need-chart-recipe-catalog-v1` for chart
needs that are not direct basic Excel insertions or are only workaround-level
Excel patterns. The catalog currently covers:

- CDF / ECDF curves
- quantile bands
- violin plots
- beeswarm / strip plots
- ridgeline density plots
- slopegraphs
- dumbbell plots
- bullet charts
- Sankey / alluvial flows
- Marimekko / mosaic plots
- ternary plots
- forest plots
- Bland-Altman plots
- control charts

Each recipe records the required data shape, semantic roles, design-order
sequence, MDPR chart-capability request, and fallback strategy. Agents should
consult this catalog before recommending a generic line, bar, scatter, or
native-chart frame for scientific, operational, or comparison-heavy data. The
catalog is still evidence-only: it does not choose final placement, dimensions,
theme values, raw workbook values, or PPTX renderer objects.

Chart optimization also needs a theme-bound visual application step after the
chart kind is selected. `review-core` records this as `visualApplication`:

- `chartChoice` decides whether the chart is the primary visual, supporting
  proof, small multiple, background proof, or comparison strip.
- `toneSlots` names theme slots such as `theme.chart.sequence`,
  `theme.chart.accent`, `theme.chart.warning`, and `theme.text.primary`
  instead of raw colors.
- `backgroundTreatment` requests a theme surface such as
  `theme.surface.chartPanel`, `theme.surface.subtleBand`,
  `theme.surface.transparent`, or `theme.surface.proofHighlight`.
- `labelStrategy` and `densityStrategy` explain how labels, callouts, small
  multiples, aggregation, or downshifting should keep the chart readable.
- `densityClass`, `labelBudgetClass`, `recommendedDownshift`, and
  `aggregationRequired` make the density decision machine-checkable before MDPR
  lays out the final slide.
- `narrativeFit` binds chart guidance back to preferred slide roles, claim
  support, and evidence-binding notes so a valid chart is not placed in the
  wrong narrative position.

This means the agent should not stop at "use a CDF" or "use a violin plot."
It should first choose the semantic chart recipe, then request the appropriate
theme-bound tones and background surface, then leave MDPR to resolve exact
theme colors, panel geometry, PPTX objects, and final validation.

## Deck-Level Design Order

`review-core` also exposes `buildDeckDesignOrderTrace` for deck coherence. The
trace is evidence-only and records this ordered chain:

1. `narrative_spine`
2. `source_evidence`
3. `slide_role`
4. `chart_intent`
5. `semantic_visual_guidance`
6. `theme_binding_request`
7. `mdpr_validation_refs`
8. `review_notes`

Later-stage guidance without earlier evidence creates
`DESIGN_ORDER_PREREQUISITE_MISSING`. Generated review artifacts can also be
checked with `validateReviewArtifactDesignOrder`, which flags missing evidence
refs, out-of-order design stages, and boundary leakage such as raw coordinates,
renderer object ids, fixed geometry, or raw style decisions.

Chart intent does not satisfy the earlier `source_evidence` stage by itself. If
the trace derives source evidence from a chart intent report, it only uses
structural refs such as sheet, row, column, numeric-cell, formula-cell,
chart-family, and error-bar refs, then emits
`DESIGN_ORDER_SOURCE_EVIDENCE_BACKFILLED` so agents know independent source
evidence is still preferred.

`validateReviewArtifactDesignOrder` is nested-artifact aware. It checks deck
order on trace-like artifacts and scientific chart order on nested
`intents[].designOrder` and `recipes[].designOrder`, while recognizing nested
`intents[].evidenceRefs`, recipe data-shape requirements, and semantic roles as
valid review evidence.
Trace-like artifacts are also validated by `entries[].stage` order, so a
malformed deck trace cannot hide out-of-sequence stages by omitting a separate
`designOrder` array.

Each trace stage also checks evidence-ref namespaces. For example,
`source_evidence` accepts source, sheet, rows, columns, numeric-cell,
formula-cell, chart-family, and error-bar refs, while visual, theme, MDPR
validation, and review-note refs belong to later stages. A misplaced namespace
creates `DESIGN_ORDER_REF_STAGE_MISMATCH`.
Stage presence is based on compatible refs, not raw ref count: a stage containing
only misplaced refs is treated as missing for downstream prerequisite checks,
while a mixed stage can remain present and still report the incompatible refs.

Coherence review now includes two deck-level semantic warnings:

- `EVIDENCE_CLAIM_ALIGNMENT_GAP` when a claim and the same-slide evidence block
  share no metric, entity, source ref, or declared semantic role.
- `SEMANTIC_MOTIF_DRIFT` when repeated evidence motifs in the same section drift
  across slide roles without an explicit narrative transition.

`reviewChartNarrativeFit` checks chart intent entries against semantic slide
placements. It emits `CHART_NARRATIVE_FIT_GAP` when the actual slide role is not
one of `visualApplication.narrativeFit.preferredSlideRoles`, and
`CHART_CLAIM_SUPPORT_MISSING` when a chart requiring claim support has no
same-slide claim/title binding. The input is semantic only: source slide id,
optional chart block id, and chart intent entry.

The same review also checks chart placement link integrity before narrative-fit
judgment. `CHART_PLACEMENT_SLIDE_MISSING` flags stale source slide ids,
`CHART_PLACEMENT_BLOCK_MISSING` flags stale chart block ids,
`CHART_PLACEMENT_BLOCK_TYPE_MISMATCH` flags mappings to non-evidence blocks, and
`CHART_PLACEMENT_INTENT_MISMATCH` flags simple semantic mismatches between a
chart block and the supplied chart intent.

Source-slide evidence ledgers can be bridged into deck design order with
`sourceEvidenceRefsFromLedger` or `buildDeckDesignOrderTraceFromLedger`.
Ledger-derived refs use only safe namespaces such as `source:`, `evidence:`,
`claim:`, and `slide:`. Because these refs come from the independent evidence
ledger, they satisfy `source_evidence` without emitting chart-intent backfill
warnings. If explicit trace refs ignore the supplied ledger,
`SOURCE_EVIDENCE_LEDGER_DISCONNECTED` is emitted.

Callers that already use `reviewCoherence` may pass optional `chartPlacements`
there. When present, chart placement and narrative-fit findings are appended to
the normal coherence findings; when absent, the historical coherence path is
unchanged.

Environment note:

LibreOffice/PowerPoint rendering is not installed in this environment, so the visual proof is generated as a deterministic PNG from parsed PPTX XML geometry and colors. The PPTX itself is inspected directly for shape z-order.
