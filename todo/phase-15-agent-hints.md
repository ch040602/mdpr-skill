# Phase 15 — Agent Hints

## Goal

필요할 때 agent reasoning을 semantic hint로만 활용하고, 디자인 선택은 rule-based로 유지한다.

## Tasks

- [x] `AgentHint` schema 작성.
- [x] allowed fields whitelist 구현.
- [x] forbidden fields blacklist 구현.
- [x] hint merge policy 구현.
- [x] confidence/validation policy 구현.
- [x] agent disabled mode 테스트.
- [x] malicious/invalid hint 테스트.
- [x] inspect에 hint usage 표시.

## Acceptance

- [x] agent hint는 recipe/variant를 직접 지정할 수 없다.
- [x] agent hint는 box/color/effect를 지정할 수 없다.
- [x] agent를 꺼도 build가 성공한다.
- [x] agent hint 결과는 validated semantic features에만 반영된다.
