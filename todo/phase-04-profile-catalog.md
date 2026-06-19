# Phase 04 — Visual Profile Catalog

## Goal

디자인 다양화의 단위인 `DeckVisualProfile`과 `CoherenceLock`을 정의한다.

## Tasks

- [x] `DeckVisualProfile` 타입 정의.
- [x] `CoherenceLock` 타입 정의.
- [x] profile catalog loader 작성.
- [x] 기본 profile 7개 작성:
  - [x] friendly-dashboard
  - [x] layered-product
  - [x] sharp-technical
  - [x] editorial-brief
  - [x] command-dense
  - [x] expressive-hero
  - [x] minimal-system
- [x] profile auto selection scoring 구현.
- [x] user-forced profile 처리.
- [x] unsupported profile error 처리.
- [x] deck coherence lock 생성.

## Acceptance

- [x] profile을 지정하면 해당 profile만 사용한다.
- [x] profile 자동 선택은 deterministic하다.
- [x] coherence lock이 모든 slide selection에 전달된다.
