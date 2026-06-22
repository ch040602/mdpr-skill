# Phase 11 — Renderer Integration

## Goal

StyledDeckIR을 PPTX/HTML/PDF로 렌더링한다.

## Tasks

### PPTX

- [x] `renderStyledDeckToPptx()` entrypoint 추가.
- [x] `StyledElement -> editable text/shape/table/chart` mapping.
- [x] surfaces as shapes.
- [x] shadows/radius/borders mapping.
- [x] chart/table/KPI rendering.
- [x] source mapping metadata optional debug output.
- [x] primary text flattening 금지.

### HTML

- [x] `renderStyledDeckReportHtml()` entrypoint 추가.
- [x] CSS variables 생성.
- [x] profile/recipe/variant data attributes 생성.
- [x] optional motion classes 생성.
- [x] reduced motion 대응.

### PDF

- [x] styled HTML print path 연결.
- [x] static fallback 확인.
- [x] print CSS 확인.

## Acceptance

- [x] 동일 StyledDeckIR가 세 포맷으로 렌더링된다.
- [x] PPTX 주요 텍스트/도형이 editable이다.
- [x] HTML은 semantic structure와 CSS variables를 가진다.
- [x] PDF는 static effects만 사용한다.
