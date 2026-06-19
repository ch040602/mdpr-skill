# Phase 12 — CLI / Config / Inspect

## Goal

사용자가 rule-based style selection을 CLI/config로 제어하고 디버깅할 수 있게 한다.

## Tasks

- [x] config schema 확장.
- [x] config loader merge order 정의.
- [x] `--style-engine design-components` 추가.
- [x] `--style-select rule-based` 추가.
- [x] `--profile <id>` 추가.
- [x] `--style-gallery <ids>` 추가.
- [x] `--rulebook <path>` 추가.
- [x] `inspect-style` 명령 추가.
- [x] `lint-style` 명령 추가.
- [x] JSON output 지원.
- [x] human-readable table output 지원.

## Inspect fields

- [x] deck profile.
- [x] coherence lock.
- [x] slide features.
- [x] recipe candidates.
- [x] hard reject reasons.
- [x] score breakdown.
- [x] selected recipe.
- [x] selected variants.
- [x] lint findings.

## Acceptance

- [x] inspect-style output만으로 선택 과정을 재현할 수 있다.
- [x] lint-style strict mode가 CI에 적합한 exit code를 반환한다.
