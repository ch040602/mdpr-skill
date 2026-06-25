# 10. Migration Plan

## Strategy

Do not remove the existing pipeline immediately. Run the `legacy/layout` path and the `design-components-rule-based` path side by side.

## Config Modes

```yaml
pipeline:
  mode: legacy
```

```yaml
pipeline:
  mode: design-components-rule-based
```

## Compatibility Requirements

- [x] Existing config continues to work.
- [x] Existing `layout.engine: rule` is not deprecated.
- [x] The StyledDeckIR path runs only when the new mode is explicitly enabled.
- [x] Renderers can accept both LayoutIR and StyledDeckIR during the transition.

## Migration Steps

1. Derive `SlideElementIR` from the existing PresentationIR.
2. Skip the legacy `Layout Planner` only in Design Components mode.
3. Overload renderer entry points.
4. Keep existing `theme.designPreset` behavior in legacy mode.
5. Use `designComponents.profile` and `designComponents.color.themeBinding` in Design Components mode.
6. After the new path is stable, decide whether some `packages/layout` utilities should move into composition.

## Deprecation Candidates

Do not remove these immediately:

- `layout.defaultPreset`
- `theme.designPreset`
- `pptx.designPreset`
- `theme-gallery`

New equivalents:

- `designComponents.profile`
- `designComponents.selection.mode`
- `style-gallery`

## Rollback Plan

- Disable the feature flag to return to the legacy pipeline.
- If the `StyledDeckIR` renderer path fails, allow HTML/PDF/PPTX-specific legacy fallback.
- Rulebook load failure must be an explicit error. Silent fallback is not allowed.
