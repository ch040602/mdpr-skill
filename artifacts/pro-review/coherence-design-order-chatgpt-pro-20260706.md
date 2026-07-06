# ChatGPT Pro Review: Coherence And Design Order

Source artifact:
`artifacts/pro-review/coherence-design-order-chatgpt-pro-20260706.json`

Pinned conversation:
`https://chatgpt.com/c/6a4b3ee7-b9e8-83e8-9b63-72a60aebc5ca`

## Assessment

The current implementation has a strong chart-level base, but deck-level design
order is still too weak. Chart reports now sequence evidence, chart intent,
semantic visual guidance, renderer capability request, and review notes, but the
broader deck coherence layer does not yet enforce a single chain from narrative
spine to evidence ledger, slide role, chart intent, visual guidance, theme
binding, MDPR validation refs, and review notes.

## Locally Actionable TODOs

1. Add a deck-level design-order trace schema.
   - Add ordered stages for narrative spine, source evidence, slide role, chart
     intent, semantic visual guidance, theme binding request, MDPR validation
     refs, and review notes.
   - Warn when later-stage guidance exists without required earlier-stage
     evidence.

2. Connect chart visual guidance to narrative spine and slide role.
   - Add or infer narrative claim refs, slide role, section refs, and evidence
     ledger refs for chart intent entries.
   - Warn when primary/supporting charts are not anchored to a claim or when a
     chart intent conflicts with slide role.

3. Add cross-slide semantic motif consistency checks.
   - Detect chart role or semantic motif drift across a section using chart
     role, theme-slot category, background treatment, and density strategy.
   - Do not compare raw colors or geometry.

4. Make same-slide evidence binding stricter.
   - Warn when claims and evidence blocks do not share metric, entity, source
     ref, or declared semantic role.
   - Keep this warning-level and evidence-only.

5. Structure density guidance as machine-checkable review data.
   - Add fields such as density class, label budget class, recommended
     downshift, and aggregation required.
   - Warn when dense evidence is primary without downshift, aggregation, small
     multiple, or fallback notes.

6. Add an explicit design-order validator for generated review artifacts.
   - Validate chart intent reports, visual guidance reports, evidence ledgers,
     and future deck design-order traces.
   - Reject or flag missing evidence refs, out-of-order stages, and final
     renderer leakage.

## External Or Manual TODOs

- MDPR final validation-ref contract.
- MDPR renderer capability matrix for scientific and non-basic charts.
- Manual final deck visual approval.

## Non-Goals

- Do not add raw workbook values, formulas, extracted chart coordinates, raw
  colors, or fixed PPTX geometry to `mdpr-skill`.
- Do not make `mdpr-skill` the final owner of chart rendering, layout, theme
  resolution, PPTX objects, or validation pass/fail.
- Do not convert semantic chart guidance into exact coordinates, palettes,
  object IDs, or renderer primitives.
- Do not use subjective visual preference as a local release gate.

