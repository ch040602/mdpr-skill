# 06. IR Contracts

## Slide Element IR

`Slide Element IR` is the headless content contract emitted by MDPR. It must not contain visual decision fields.

### Allowed Fields

- Deck metadata.
- Slide id.
- Slide intent.
- Density.
- Reading order.
- Element type.
- Element role.
- Element importance.
- Element content.
- Content metrics.
- Semantic groups.
- Source mapping.

### Forbidden Fields

- `x`, `y`, `w`, `h`
- `fontSize`, `fontFamily`
- `color`, `background`, `border`
- `radius`, `shadow`
- `component`, `variant`
- `animation`, `effect`

## Styled Deck IR

`Styled Deck IR` is the visual contract emitted by the Design Components rule engine. Renderers consume this IR.

### Required Fields

- Profile.
- Coherence lock.
- Slides.
- Recipe id.
- Elements.
- Box.
- Variant id.
- Style specs.
- Effects.
- Theme color refs.
- Source element mapping.

## Source Mapping Rule

Every `StyledElement` must remain connected to its source `ElementNode`.

```ts
type StyledElement = {
  id: string;
  sourceElementId: string;
  variantId: string;
  box: Box;
  // ...styles
};
```

## No-Loss Policy

- [x] Titles must be preserved.
- [x] Footnotes and captions may collapse under high density, but source mapping must remain.
- [x] Content collapse is allowed only for elements with `canCollapse: true`.
- [x] Summarization is disabled by default and requires an explicit option.

## Element Type Catalog

```text
title
subtitle
paragraph
bulletList
numberedList
quote
callout
table
chart
image
figure
code
equation
kpi
metric
timeline
process
comparison
prosCons
definition
warning
success
reference
footnote
caption
```

## Slide Intent Catalog

```text
cover
section
agenda
content
data
comparison
process
timeline
diagram
code
summary
appendix
```
