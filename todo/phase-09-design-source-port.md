# Phase 09 — Design Source Port

## Goal

Design Components의 규칙/토큰/스킨/모션/패턴을 MDPR renderer-neutral 형식으로 가져온다.

## Tasks

- [x] `third_party/design-source` attribution/license boundary 생성.
- [x] `design_components/design-source-adapter` 적용 데이터 구조 생성.
- [x] upstream commit/tag 기록.
- [x] `LICENSE` 포함.
- [x] `UPSTREAM.md` 작성.
- [x] import script 작성.
- [x] `DESIGN-LANGUAGE.md`를 `design_components/design-source-adapter/reference` rule reference로 복사.
- [x] `VISUAL-CRAFT.md`를 `design_components/design-source-adapter/reference` coherence lint reference로 복사.
- [x] tokens를 MDPR style tokens로 매핑.
- [x] skins를 visual profile axes/fallback preview colors로 매핑.
- [x] motion seeds/keywords를 renderer capability로 매핑.
- [x] React component implementation은 직접 runtime import하지 않는다.

## Acceptance

- [x] Design Components upstream attribution이 남아 있다.
- [x] final PPTX path에 skin hardcoded hex가 들어가지 않는다.
- [x] Design Components motion은 PPTX/PDF에서 static fallback을 가진다.
