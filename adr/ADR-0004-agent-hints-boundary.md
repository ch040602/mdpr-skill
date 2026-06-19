# ADR-0004 — Agent Hints Boundary

## Status

Proposed

## Decision

Agent may provide semantic hints only: possible intent, groups, primary element, importance candidates. It must not provide recipe, variant, box, color, effect, or style decisions.

## Consequences

- AgentHint schema and validators are required.
- Rule engine remains the only selection authority.
