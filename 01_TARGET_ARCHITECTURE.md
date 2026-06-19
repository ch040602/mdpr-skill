# 01. Target Architecture

## Target pipeline

```text
┌────────────────────────┐
│ Markdown / Input       │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ MDPR Parser / Splitter │
│ - parse markdown       │
│ - outline              │
│ - slide split          │
│ - element split        │
│ - semantic tags        │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Slide Element IR       │
│ no visual fields       │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Feature Extractor      │
│ - density              │
│ - count                │
│ - element mix          │
│ - size risk            │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Design Components Rule Engine  │
│ - profile selection    │
│ - recipe selection     │
│ - variant selection    │
│ - conflict resolve     │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Composition Engine     │
│ - regions              │
│ - boxes                │
│ - fit                  │
│ - safe area            │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Decoration Engine      │
│ - typography           │
│ - surface              │
│ - border/radius/shadow │
│ - accent/effects       │
│ - theme color binding  │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Styled Deck IR         │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Renderer               │
│ PPTX / HTML / PDF      │
└────────────────────────┘
```

## Ownership table

| Concern | Owner | Notes |
|---|---|---|
| Markdown parsing | MDPR core | existing parser 유지 |
| Heading-based split | MDPR core | existing split policy 재사용 |
| Element extraction | MDPR core / element-ir | 신규 contract |
| Element type inference | MDPR core | rule-first, agent hint optional |
| Slide intent | MDPR core | deterministic first, optional agent hint validated |
| Layout decision | Design Components composition | recipe 기반 |
| Element box size | Design Components composition | region rule + fit policy |
| Component variant | Design Components rule engine | deterministic selector |
| Decoration | Design Components decoration | profile axes + variant policy |
| Effects | Design Components decoration | effect budget + renderer capability |
| PPT theme colors | Design Components decoration + design_components/pptx | ColorRef -> scheme color |
| Editable object rendering | design_components/pptx | no text flattening |
| HTML motion | render-html | reduced motion respect |
| PDF static output | render-pdf | HTML print/static |

## New packages

```text
packages/element-ir
design_components/rule-engine
design_components/composition
design_components/decoration
design_components/design-source-adapter
```

## Existing packages affected

```text
packages/core
packages/cli
design_components/pptx
packages/render-html
packages/render-pdf
schemas/config.schema.json
examples/
tests/
```

## Legacy compatibility

기존 `layout.engine: rule` 경로는 유지한다. 신규 경로는 아래 config로만 활성화한다.

```yaml
pipeline:
  mode: design-components-rule-based

designComponents:
  selection:
    mode: rule-based
```

또는 CLI:

```bash
mdpresent build deck.md --style-engine design-components --style-select rule-based
```
