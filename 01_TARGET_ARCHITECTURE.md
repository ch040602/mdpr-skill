# 01. Target Architecture

## Target Pipeline

```text
Markdown / Input
  -> MDPR Parser / Splitter
      - parse Markdown
      - build outline
      - split slides
      - split elements
      - infer semantic tags
  -> Slide Element IR
      - no visual fields
  -> Feature Extractor
      - density
      - counts
      - element mix
      - size risk
  -> Design Components Rule Engine
      - profile selection
      - recipe selection
      - variant selection
      - conflict resolution
  -> Composition Engine
      - regions
      - boxes
      - fit
      - safe area
  -> Decoration Engine
      - typography
      - surface
      - border/radius/shadow
      - accent/effects
      - theme color binding
  -> Styled Deck IR
  -> Renderer
      - PPTX
      - HTML
      - PDF
```

## Ownership Table

| Concern | Owner | Notes |
| --- | --- | --- |
| Markdown parsing | MDPR core | Keep the existing parser path |
| Heading-based splitting | MDPR core | Reuse the existing split policy |
| Element extraction | MDPR core / element-ir | New contract |
| Element type inference | MDPR core | Rule-first, optional agent hint |
| Slide intent | MDPR core | Deterministic first, validated optional agent hint |
| Layout decision | Design Components composition | Recipe based |
| Element box size | Design Components composition | Region rules plus fit policy |
| Component variant | Design Components rule engine | Deterministic selector |
| Decoration | Design Components decoration | Profile axes plus variant policy |
| Effects | Design Components decoration | Effect budget plus renderer capability |
| PPT theme colors | Design Components decoration + design_components/pptx | `ColorRef` to scheme color |
| Editable object rendering | design_components/pptx | No text flattening |
| HTML report motion | report-html | Respect reduced motion |
| PDF static report output | report-pdf | HTML print/static output |

## New Packages

```text
packages/element-ir
design_components/rule-engine
design_components/composition
design_components/decoration
design_components/design-source-adapter
```

## Existing Packages Affected

```text
packages/core
packages/cli
design_components/pptx
packages/report-html
packages/report-pdf
schemas/config.schema.json
examples/
tests/
```

## Legacy Compatibility

The existing `layout.engine: rule` path remains available. The new path is only
enabled by explicit config:

```yaml
pipeline:
  mode: design-components-rule-based

designComponents:
  selection:
    mode: rule-based
```

or by CLI:

```bash
mdpresent build deck.md --style-engine design-components --style-select rule-based
```
