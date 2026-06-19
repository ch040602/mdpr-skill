# ADR-0002 — Rule-based Design Selection

## Status

Proposed

## Decision

Slide recipes and element variants are selected by deterministic MDPR rules. Agent output cannot directly choose recipes or variants.

## Consequences

- Rulebook, scoring, hard filters, and selection traces belong in MDPR when promoted from prototype/reference material.
- Results are reproducible.
- Debugging should use MDPR-owned inspect/trace output, not a separate skill-only style command.
