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

## Forbidden Uses

- Adding PptxGenJS, python-pptx, or another generator as an implicit dependency.
- Treating another generator as a fallback renderer when MDPR fails validation.
- Using another generator to bypass MDPR overflow, text clipping, overline,
  coherence, editability, theme, or object-policy gates.
- Letting `mdpr-skill` choose final coordinates, colors, typography, z-order,
  object IDs, icon assets, or renderer objects.

External generators can help describe what good PPTX tooling supports. They do
not change the runtime contract: the LLM can suggest; MDPR renders and gates.
