# 11. CLI and Config

## CLI options

```bash
mdpresent build deck.md \
  --style-engine design-components \
  --style-select rule-based \
  --profile friendly-dashboard \
  --to pptx
```

```bash
mdpresent build deck.md \
  --style-gallery friendly-dashboard,layered-product,sharp-technical,minimal-system \
  --to pptx,html
```

```bash
mdpresent inspect-style deck.md \
  --show-features \
  --show-selected-recipes \
  --show-rejected-candidates \
  --json
```

```bash
mdpresent lint-style deck.md \
  --style-engine design-components \
  --strict
```

## Config schema addition

```yaml
pipeline:
  mode: design-components-rule-based

mdpr:
  role: element-splitter
  output: slide-element-ir
  split:
    inferIntent: true
    inferElementTypes: true
    inferImportance: true
    inferGroups: true
    computeContentMetrics: true

designComponents:
  selection:
    mode: rule-based
    profile:
      strategy: auto
      candidates:
        - friendly-dashboard
        - layered-product
        - sharp-technical
        - editorial-brief
        - command-dense
        - expressive-hero
        - minimal-system
    allowAgentHints:
      enabled: false
      allowedFields:
        - possibleIntent
        - possibleGroups
        - possiblePrimaryElementId
        - possibleImportance
      forbid:
        - recipeId
        - variantId
        - x
        - y
        - w
        - h
        - color
        - effect
  diversity:
    avoidSameLayoutKindInLast: 3
    avoidSameAccentPositionInLast: 2
    maxDecorativeEffectsPerSlide: 2
  coherence:
    lockDeckAxes: true
    lintMixedRadius: error
    lintMixedShadow: error
    lintMixedTypeScale: error
    lintMixedSpacing: error
    lintMultiplePrimaryAccents: error
  color:
    mode: ppt-theme
    allowRawHexInPptx: false
    themeBinding:
      background: background1
      surface: background1
      foreground: text1
      muted: text2
      primaryAccent: accent1
      secondaryAccent: accent2
      success: accent3
      warning: accent4
      danger: accent5
      info: accent6
```

## Inspect output

```json
{
  "slideId": "s04",
  "features": {
    "slideIntent": "data",
    "density": "medium",
    "kpiCount": 3,
    "hasChart": true,
    "hasCallout": true
  },
  "selectedRecipe": "data.kpiRailChart",
  "selectedVariants": {
    "title-1": "title.sectionRule",
    "kpi-1": "kpi.cardWithTrend",
    "chart-1": "chart.cardWithContext"
  },
  "rejectedRecipes": [
    {
      "id": "content.editorialBody",
      "reason": "Low data fit"
    }
  ]
}
```
