# ADR-0002 — Rule-based Design Selection

## Status

Proposed

## Decision

Slide recipes and element variants are selected by deterministic rule engine. Agent output cannot directly choose recipes or variants.

## Consequences

- Rulebook, scoring, hard filters, and selection traces are required.
- Results are reproducible.
- Debugging uses inspect-style.
