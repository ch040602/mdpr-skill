# Phase 00 — Preflight

## Goal

기존 MDPR pipeline을 깨지 않고 `design-components-rule-based` pipeline을 추가할 준비를 한다.

## Tasks

- [x] 현재 `packages/cli`, `packages/core`, `packages/layout`, `packages/override`, `packages/render-html`, `packages/render-pdf`, `design_components/pptx`의 public API를 확인한다.
- [x] 기존 `build`, `inspect`, `plan`, `validate` 명령의 입력/출력 snapshot을 저장한다.
- [x] 신규 pipeline mode 이름 확정: `design-components-rule-based`.
- [x] 신규 design integration root 확정: `design_components/`.
- [x] 기존 `theme-gallery`와 신규 `style-gallery`의 책임 차이를 문서화한다.
- [x] Design Components upstream ref를 고정한다.
- [x] MIT license notice를 포함한다.
- [x] `third_party/design-source/UPSTREAM.md` 생성 계획을 PR description에 포함한다.
- [x] CI baseline을 통과시킨다.

## Acceptance

- [x] legacy build snapshot이 phase 전후 동일하다.
- [x] 신규 pipeline은 flag/config 없이는 실행되지 않는다.
- [x] vendor/license 정책이 리뷰 가능하다.
