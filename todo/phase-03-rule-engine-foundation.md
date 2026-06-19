# Phase 03 — Rule Engine Foundation

## Goal

Recipe/variant 선택을 수행하는 deterministic rule engine 골격을 만든다.

## Tasks

- [x] `design_components/rule-engine` 생성.
- [x] `RuleCondition` 타입 정의.
- [x] condition evaluator 구현: eq, in, gt, gte, lt, lte, min/max, all/any/not.
- [x] hard filter 단계 구현.
- [x] scoring 단계 구현.
- [x] priority/tie-breaker 구현.
- [x] `SelectionTrace` 타입 정의.
- [x] reject reason 수집.
- [x] score breakdown 수집.
- [x] stable sort helper 작성.
- [x] no-random lint/test 추가.

## Acceptance

- [x] 같은 입력/룰북은 항상 같은 결과다.
- [x] reject reason과 score breakdown이 inspect 가능하다.
- [x] rulebook이 비어 있으면 명시적 error가 난다.
