# ADR-0004 — Agent Hints Boundary

## Status

Proposed

## Decision

Agent may provide semantic hints only: possible intent, groups, primary element,
importance candidates, and compact icon-search keywords. It must not provide
recipe, variant, box, coordinate, color, typography, z-order, arrow, effect,
exact icon asset, or style decisions.

## Consequences

- AgentHint schema and validators are required.
- Rule engine remains the only selection authority.
