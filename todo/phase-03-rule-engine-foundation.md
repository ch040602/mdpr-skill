# Phase 03 - Rule Engine Foundation

## Goal

Create the deterministic rule engine foundation for recipe and variant selection.

## Tasks

- [x] Create `design_components/rule-engine`.
- [x] Define `RuleCondition`.
- [x] Implement condition evaluator: `eq`, `in`, `gt`, `gte`, `lt`, `lte`, `min/max`, `all`, `any`, and `not`.
- [x] Implement hard filter stage.
- [x] Implement scoring stage.
- [x] Implement priority and tie-breaker.
- [x] Define `SelectionTrace`.
- [x] Collect reject reasons.
- [x] Collect score breakdown.
- [x] Add stable sort helper.
- [x] Add no-random lint/test.

## Acceptance

- [x] The same input and rulebook always produce the same result.
- [x] Reject reasons and score breakdown are inspectable.
- [x] Empty rulebooks produce explicit errors.
