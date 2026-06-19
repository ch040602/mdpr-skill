# Phase 10 — PPT Theme Colors

## Goal

사용자가 PPT 안에서 색상 조합을 바꿀 수 있도록 모든 주요 style color를 PPT theme slot에 바인딩한다.

## Tasks

- [x] `ThemeColorRef` 타입 구현.
- [x] `PptThemeSlot` 타입 구현.
- [x] semantic token -> theme slot mapping 구현.
- [x] tint/shade/transparency 지원 범위 결정.
- [x] `allowRawHexInPptx` config 추가.
- [x] raw hex lint 구현.
- [x] `design_components/pptx` adapter 구현.
- [x] shape fill/line color mapping.
- [x] text run color mapping.
- [x] chart series color mapping.
- [x] fallback hex preview-only 검증.

## Acceptance

- [x] `color.mode: ppt-theme`에서 final style plan에는 theme refs만 남는다.
- [x] fallback hex는 `previewOnly: true` 없이는 거부된다.
- [x] PPTX 렌더링 smoke test가 통과한다.
