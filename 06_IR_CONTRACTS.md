# 06. IR Contracts

## Slide Element IR

`Slide Element IR`은 MDPR이 출력하는 headless content contract다. 시각 필드를 포함하지 않는다.

### Allowed fields

- deck metadata
- slide id
- slide intent
- density
- reading order
- element type
- element role
- element importance
- element content
- content metrics
- semantic groups
- source mapping

### Forbidden fields

- `x`, `y`, `w`, `h`
- `fontSize`, `fontFamily`
- `color`, `background`, `border`
- `radius`, `shadow`
- `component`, `variant`
- `animation`, `effect`

## Styled Deck IR

`Styled Deck IR`은 Design Components rule engine이 출력하는 visual contract다. renderer는 이를 소비한다.

### Required fields

- profile
- coherenceLock
- slides
- recipeId
- elements
- box
- variantId
- style specs
- effects
- theme color refs
- source element mapping

## Source mapping rule

모든 `StyledElement`는 원본 `ElementNode`와 연결되어야 한다.

```ts
type StyledElement = {
  id: string;
  sourceElementId: string;
  variantId: string;
  box: Box;
  // ...styles
};
```

## No-loss policy

- [x] title은 반드시 남긴다.
- [x] footnote/caption은 density가 높으면 collapse 가능하되 source mapping을 유지한다.
- [x] content collapse는 `canCollapse: true`가 있는 요소에만 허용한다.
- [x] summarization은 기본 금지. 별도 explicit option이 있을 때만 허용한다.

## Element type catalog

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

## Slide intent catalog

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
