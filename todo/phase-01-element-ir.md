# Phase 01 — Element IR

## Goal

MDPR이 Design Components에 넘길 headless `Slide Element IR`을 만든다.

## Tasks

- [x] `packages/element-ir/package.json` 생성.
- [x] `src/schema.ts`에 `SlideElementIR`, `SlideNode`, `ElementNode`, `ElementGroup` 정의.
- [x] `src/validators.ts`에 forbidden visual fields 검증 추가.
- [x] `src/metrics.ts`에 content metrics 계산 추가.
- [x] `src/normalize.ts`에 missing role/importance fallback 추가.
- [x] `schemas/slide-element-ir.schema.json`과 동기화.
- [x] `packages/core`에 `buildSlideElementIR()` adapter 추가.
- [x] `source.markdownRange`, `source.headingPath` 보존.
- [x] fixture 5개 작성.
- [x] snapshot test 추가.

## Forbidden fields validator

- [x] `x` rejected.
- [x] `y` rejected.
- [x] `w` rejected.
- [x] `h` rejected.
- [x] `color` rejected.
- [x] `background` rejected.
- [x] `fontSize` rejected.
- [x] `radius` rejected.
- [x] `shadow` rejected.
- [x] `effect` rejected.

## Acceptance

- [x] `SlideElementIR`가 renderer-independent다.
- [x] 모든 요소는 source mapping을 가진다.
- [x] visual field가 들어오면 test가 실패한다.
