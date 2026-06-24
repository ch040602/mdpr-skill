# Proposed Package Tree

```text
packages/
  mdpr-adapter/
    src/
      index.ts

  hints-core/
    src/
      index.ts

  review-core/
    src/
      index.ts

  eval-core/
    src/
      index.ts              baseline/guided MDPR runner, metric comparison, eval report

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

  report-html/
    src/
      renderReportDeck.ts
      cssVariables.ts
      motionCss.ts

  report-pdf/
    src/
      renderReportDeck.ts

  cli/
    src/
      commands/hint.ts
      commands/review.ts
      commands/compare.ts
      commands/inspectBoundary.ts
      commands/validateSchemaSync.ts
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
