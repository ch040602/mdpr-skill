# Proposed Package Tree

```text
packages/
  core/
    src/
      buildSlideElementIR.ts
      inferElementTypes.ts
      inferSlideIntent.ts
      inferGroups.ts
      computeContentMetrics.ts

  element-ir/
    src/
      schema.ts
      validators.ts
      normalize.ts
      metrics.ts
      index.ts

  render-html/
    src/
      renderStyledDeck.ts
      cssVariables.ts
      motionCss.ts

  render-pdf/
    src/
      renderStyledDeck.ts

  cli/
    src/
      commands/inspectStyle.ts
      commands/lintStyle.ts
      commands/buildStyleGallery.ts
```

```text
design_components/
  rule-engine/
    src/
      features/
      profiles/
      rules/
      select/
      trace/
      index.ts

  composition/
    src/
      primitives/
      recipes/
      regionSolver.ts
      fit.ts
      overflow.ts
      index.ts

  decoration/
    src/
      tokens/
      decorators/
      effects/
      lint/
      index.ts

  design-source-adapter/
    src/
      upstream.ts
      tokenMapper.ts
      skinMapper.ts
      motionMapper.ts
      componentMapper.ts
      index.ts

  pptx/
    src/
      renderStyledDeck.ts
      themeColors.ts
      renderStyledElement.ts
```
