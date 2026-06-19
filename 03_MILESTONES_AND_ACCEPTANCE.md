# 03. Milestones and Acceptance Criteria

## M0 — Baseline alignment

### Deliverables

- feature flag 설계
- existing pipeline snapshot
- third-party license metadata

### Acceptance

- [x] 기존 `mdpresent build` 결과가 바뀌지 않는다.
- [x] 신규 모드는 config/CLI flag 없이는 실행되지 않는다.
- [x] Design Components import 범위와 license notice가 문서화된다.

## M1 — Element IR ready

### Deliverables

- `SlideElementIR` types/schema
- `PresentationIR -> SlideElementIR` adapter
- content metrics

### Acceptance

- [x] 모든 slide element에는 `type`, `role`, `importance`, `contentMetrics`가 있다.
- [x] IR validator가 `x/y/w/h/color/radius/shadow`를 거부한다.
- [x] sample deck 5개가 Element IR snapshot을 통과한다.

## M2 — Rule selector ready

### Deliverables

- feature extractor
- rule DSL
- hard/scoring/tie-break selector
- selection trace

### Acceptance

- [x] 같은 입력은 항상 같은 recipe를 선택한다.
- [x] reject reason이 inspect output에 남는다.
- [x] agent hint 없이도 selector가 작동한다.

## M3 — Profile + recipe + variant ready

### Deliverables

- profile catalog
- slide recipe catalog
- element variant registry

### Acceptance

- [x] cover/content/data/comparison/process/code/summary 계열이 최소 1개 이상 동작한다.
- [x] high-density slide에서 hero-only recipe가 hard reject된다.
- [x] KPI+chart slide에서 data recipe가 content recipe보다 높은 점수를 받는다.

## M4 — Composition + decoration ready

### Deliverables

- regions/boxes 계산
- typography/surface/accent/effect policy
- coherence lock

### Acceptance

- [x] 모든 StyledElement에는 box가 있다.
- [x] 모든 style token은 profile axes와 coherence lock을 따른다.
- [x] effect budget이 초과되면 lint error 또는 automatic downshift가 발생한다.

## M5 — Renderer integration ready

### Deliverables

- PPTX/HTML/PDF renderer adapter
- theme color binding
- raw hex lint

### Acceptance

- [x] PPTX 주요 텍스트는 editable text object다.
- [x] PPTX 주요 도형은 editable shape다.
- [x] `color.mode: ppt-theme`에서 final StyledDeckIR에 non-preview raw hex가 없다.
- [x] HTML preview에는 CSS variables가 생성된다.

## M6 — CLI and inspect ready

### Deliverables

- `inspect-style`
- `lint-style`
- `--style-gallery`
- config schema 확장

### Acceptance

- [x] `inspect-style --json`이 features, selected recipe, selected variants, rejected candidates를 출력한다.
- [x] `style-gallery`가 동일 Element IR로 여러 profile output을 만든다.
- [x] strict lint가 CI에서 실패 신호를 반환한다.

## M7 — Agent hint safety ready

### Deliverables

- `AgentHint` schema
- validation
- override 방지 tests

### Acceptance

- [x] agent가 recipeId를 주면 reject된다.
- [x] agent가 x/y/w/h/color/effect를 주면 reject된다.
- [x] agent disabled/enabled 결과 차이가 허용된 semantic fields에만 기인한다.

## M8 — Release ready

### Deliverables

- docs
- examples
- migration guide
- snapshots

### Acceptance

- [x] 기존 legacy mode test 통과.
- [x] design-components-rule-based mode test 통과.
- [x] release note에 breaking change 없음 또는 명확히 기재.
