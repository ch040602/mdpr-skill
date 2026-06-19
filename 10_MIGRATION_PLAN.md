# 10. Migration Plan

## Strategy

기존 pipeline을 바로 제거하지 않는다. `legacy/layout` 경로와 `design-components-rule-based` 경로를 병렬 운영한다.

## Config modes

```yaml
pipeline:
  mode: legacy
```

```yaml
pipeline:
  mode: design-components-rule-based
```

## Compatibility requirements

- [x] 기존 config가 그대로 동작한다.
- [x] 기존 `layout.engine: rule`은 deprecated가 아니다.
- [x] 신규 mode가 명시된 경우에만 StyledDeckIR path를 탄다.
- [x] renderer는 당분간 LayoutIR와 StyledDeckIR를 모두 받을 수 있다.

## Migration steps

1. `SlideElementIR`를 기존 PresentationIR에서 파생한다.
2. Design Components mode에서만 `Layout Planner`를 건너뛴다.
3. Renderer entrypoint를 overload한다.
4. 기존 `theme.designPreset`은 legacy mode에서 유지한다.
5. Design Components mode에서는 `designComponents.profile`과 `designComponents.color.themeBinding`을 사용한다.
6. 충분히 안정화된 뒤 `packages/layout` 일부 utility를 composition 내부로 이전할지 결정한다.

## Deprecation candidates

아래 항목은 당장 제거하지 않는다.

- `layout.defaultPreset`
- `theme.designPreset`
- `pptx.designPreset`
- `theme-gallery`

신규 equivalent:

- `designComponents.profile`
- `designComponents.selection.mode`
- `style-gallery`

## Rollback plan

- feature flag를 끄면 legacy pipeline으로 복귀.
- `StyledDeckIR` renderer path 문제 발생 시 HTML/PDF/PPTX별로 legacy fallback 가능.
- rulebook load 실패 시 명시적 error. silent fallback 금지.
