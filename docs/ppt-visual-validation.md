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

Environment note:

LibreOffice/PowerPoint rendering is not installed in this environment, so the visual proof is generated as a deterministic PNG from parsed PPTX XML geometry and colors. The PPTX itself is inspected directly for shape z-order.
