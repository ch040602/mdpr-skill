# Generator Comparison Boundary

`mdpr-skill` may reference external PPTX generators as comparison points only.
They are not dependencies, not fallback renderers, and not alternate runtimes
for this repository.

MDPR remains the deterministic runtime for Markdown parsing, slide splitting,
layout, validation, rendering, and editable PPTX output. The skill may use the
external tools below to describe capability coverage or review vocabulary, but
must not route deck generation through them.

## Comparison Points Only

| Tool | Useful comparison vocabulary | Boundary |
| --- | --- | --- |
| PptxGenJS | PPTX object coverage, charts, tables, media, masters, and shape capabilities | Reference vocabulary only; do not add it as a runtime dependency. |
| python-pptx | Document inspection, placeholders, tables, notes, and low-level PPTX object model concepts | Reference vocabulary only; do not add it as a fallback renderer. |
| Other Markdown/PPTX generators | Template workflows, visual preview loops, and export ergonomics | Compare workflows only; do not replace MDPR validation or renderer ownership. |

## Allowed Uses

- Document gaps in MDPR capability language.
- Name review categories consistently, such as chart coverage, speaker notes,
  comments, placeholder roles, and media handling.
- Inform benchmark comparisons when explaining why MDPR needs a deterministic
  rule, schema, or renderer feature.
- Build evidence-only scorecards from MDPR artifacts and review findings.
- Normalize visual guidance into categories such as editability risk,
  decoration noise, theme fit, evidence grounding, and accessibility.

## Forbidden Uses

- Adding PptxGenJS, python-pptx, or another generator as an implicit dependency.
- Treating another generator as a fallback renderer when MDPR fails validation.
- Using another generator to bypass MDPR overflow, text clipping, overline,
  coherence, editability, theme, or object-policy gates.
- Letting `mdpr-skill` choose final coordinates, colors, typography, z-order,
  object IDs, icon assets, or renderer objects.

External generators can help describe what good PPTX tooling supports. They do
not change the runtime contract: the LLM can suggest; MDPR renders and gates.

## Evidence-Based Scorecards

`review-core` exposes `buildVisualGuidance(findings)` and
`buildGeneratorComparisonScorecard(input)` for comparison reports.

`buildVisualGuidance` maps existing deterministic review findings into
normalized categories. It carries evidence references such as finding type,
slide id, object kind, role, block ids, layout slide ids, and region ids. It
must not echo raw coordinates, colors, typography, object ids, or renderer
geometry back into the report.

Visual comparisons must distinguish topology from surface styling. Current
MDPR evidence names horizontal `card-row-3`/`card-row-4` geometry separately
from grids and stacks, while open horizontal rows avoid counting a geometry
change that still looks like the same repeated white-card treatment.

`buildGeneratorComparisonScorecard` compares MDPR against external generator
references using measurable evidence: editable object coverage, design decision
trace presence, layout validation references, overflow/density finding counts,
native table/chart proof support, and whether manual review is required. Manual
preference remains separate from deterministic evidence. The scorecard may say
which system has stronger evidence on a dimension, but it must not claim that
one output is objectively prettier or bypass MDPR validation gates.
