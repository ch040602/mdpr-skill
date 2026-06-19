# Phase 07 — Composition Engine

## Goal

선택된 recipe와 variants를 실제 boxes/regions로 변환한다.

## Tasks

- [x] `design_components/composition` 생성.
- [x] `Box`, `RegionRule`, `GridSpec`, `SafeArea` 타입 정의.
- [x] primitive layout 구현:
  - [x] hero
  - [x] split
  - [x] two-column
  - [x] three-column
  - [x] card-grid
  - [x] dashboard
  - [x] timeline
  - [x] process-flow
  - [x] comparison-matrix
  - [x] code-focus
- [x] region allocation 구현.
- [x] element assignment 구현.
- [x] min readable size 적용.
- [x] box collision 검사.
- [x] overflow fallback 구현.
- [x] density-based spacing scale 적용.

## Acceptance

- [x] 모든 StyledElement에 box가 있다.
- [x] box는 canvas safe area 안에 있다.
- [x] dense slide는 compact layout으로 downshift된다.
- [x] overflow fallback trace가 남는다.
