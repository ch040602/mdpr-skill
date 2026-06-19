# 02. Roadmap TODO

## Phase 00 — Preflight / Repository alignment

- [x] 현재 `packages/*` 구조를 확인한다.
- [x] 기존 `Layout IR` pipeline을 유지할 compatibility policy를 정한다.
- [x] Design Components upstream commit/tag를 기록한다.
- [x] Design Components license notice를 `third_party/design-source`에 포함한다.
- [x] 신규 feature flag 이름을 확정한다: `design-components-rule-based`.
- [x] baseline test를 실행하고 snapshot을 저장한다.
- [x] 기존 `theme-gallery`와 신규 `style-gallery`의 차이를 문서화한다.

## Phase 01 — Slide Element IR

- [x] `packages/element-ir` 생성.
- [x] `SlideElementIR`, `SlideNode`, `ElementNode`, `ElementGroup` TypeScript 타입 추가.
- [x] JSON schema 추가.
- [x] MDPR core에서 `Presentation IR -> Slide Element IR` adapter 추가.
- [x] 시각 필드 금지 validator 추가.
- [x] content metrics 계산: text chars, list count, table cells, code lines, image aspect ratio.
- [x] unit tests 추가.

## Phase 02 — Feature Extractor

- [x] `extractSlideFeatures()` 구현.
- [x] `extractElementFeatures()` 구현.
- [x] density score, dataWeight, narrativeWeight, visualComplexity 계산.
- [x] overflow risk estimate 추가.
- [x] fixtures 기반 golden feature tests 추가.

## Phase 03 — Rule Engine Foundation

- [x] `design_components/rule-engine` 생성.
- [x] Rule condition DSL 정의.
- [x] hard filter evaluator 구현.
- [x] scoring evaluator 구현.
- [x] deterministic tie breaker 구현.
- [x] selection trace 구조 추가.
- [x] conflict resolution priority 구현.

## Phase 04 — Deck Visual Profile / Coherence Lock

- [x] `DeckVisualProfile` 타입 추가.
- [x] `CoherenceLock` 타입 추가.
- [x] profile catalog v1 작성.
- [x] automatic profile selector 구현.
- [x] user-forced profile option 구현.
- [x] radius/shadow/spacing/type/accent/effect axes lock 적용.

## Phase 05 — Slide Recipe Catalog

- [x] recipe schema 정의.
- [x] cover recipes 작성.
- [x] section recipes 작성.
- [x] content recipes 작성.
- [x] data recipes 작성.
- [x] comparison recipes 작성.
- [x] process/timeline recipes 작성.
- [x] code/technical recipes 작성.
- [x] summary recipes 작성.
- [x] recipe selection tests 추가.

## Phase 06 — Element Variant Registry

- [x] `ElementVariant` schema 정의.
- [x] title variants 추가.
- [x] paragraph variants 추가.
- [x] list variants 추가.
- [x] KPI/metric variants 추가.
- [x] chart variants 추가.
- [x] table variants 추가.
- [x] code variants 추가.
- [x] callout/quote variants 추가.
- [x] image/caption variants 추가.
- [x] variant selection tests 추가.

## Phase 07 — Composition Engine

- [x] `design_components/composition` 생성.
- [x] canonical layout primitives 구현: hero, split, grid, dashboard, timeline, comparison.
- [x] region rule -> box 계산 구현.
- [x] safe area와 aspect ratio 처리.
- [x] readable size constraint 처리.
- [x] density adaptation 구현.
- [x] fit/overflow fallback 구현.

## Phase 08 — Decoration Engine

- [x] `design_components/decoration` 생성.
- [x] typography policy 구현.
- [x] surface policy 구현.
- [x] border/radius/shadow policy 구현.
- [x] accent placement policy 구현.
- [x] effect budget 구현.
- [x] chart/table/KPI/code 전용 decoration 구현.
- [x] coherence lint와 연결.

## Phase 09 — Design Components Vendor / Adapter

- [x] `third_party/design-source` 구조 생성.
- [x] upstream metadata 기록.
- [x] Design Components tokens/rules/motion/skins import script 작성.
- [x] React/shadcn specific dependency를 renderer-neutral token으로 매핑.
- [x] skin color는 fallback/preview only로 제한.
- [x] motion keywords를 PPTX static / HTML motion / PDF static으로 매핑.

## Phase 10 — PPT Theme Color Binding

- [x] `ColorRef` / `ThemeColorRef` 타입 추가.
- [x] semantic token -> PPT theme slot mapping 구현.
- [x] raw hex 금지 validator 구현.
- [x] `design_components/pptx` color adapter 구현.
- [x] chart series theme slot mapping 구현.
- [x] template theme extraction과 fallback contrast QA 연결.

## Phase 11 — Renderer Integration

- [x] `StyledDeckIR -> PPTX` renderer path 추가.
- [x] `StyledDeckIR -> HTML` renderer path 추가.
- [x] `StyledDeckIR -> PDF` renderer path 추가.
- [x] editable object 보장 tests 추가.
- [x] HTML CSS variables 생성.
- [x] PDF static output snapshot 추가.

## Phase 12 — CLI / Config / Inspect

- [x] config schema 확장.
- [x] CLI 옵션 추가: `--style-engine`, `--style-select`, `--profile`, `--style-gallery`.
- [x] `inspect-style` 명령 추가.
- [x] `lint-style` 명령 추가.
- [x] selected recipe/variant/reject reason 출력.
- [x] rulebook path override 옵션 추가.

## Phase 13 — Coherence Lint

- [x] mixed radius lint.
- [x] mixed shadow lint.
- [x] mixed spacing lint.
- [x] mixed type scale lint.
- [x] multiple primary accent lint.
- [x] raw hex lint.
- [x] effect budget lint.
- [x] repetitive layout rhythm lint.
- [x] dense slide expressive effect lint.

## Phase 14 — Style Gallery

- [x] 동일 Element IR을 여러 profile로 렌더링.
- [x] output folder convention 결정.
- [x] gallery manifest JSON 생성.
- [x] profile별 inspect output 생성.
- [x] theme color 유지 테스트.

## Phase 15 — Optional Agent Hints

- [x] `AgentHint` schema 추가.
- [x] allowed fields validator 추가.
- [x] forbidden recipe/variant/box/color/effect field reject.
- [x] agent disabled mode snapshot 추가.
- [x] agent hint가 selector를 직접 override하지 못하는 test 추가.

## Phase 16 — Regression / Docs / Release

- [x] sample decks 10개 추가.
- [x] golden StyledDeckIR snapshots 추가.
- [x] PPTX smoke tests 추가.
- [x] docs 작성.
- [x] migration guide 작성.
- [x] release checklist 완료.
