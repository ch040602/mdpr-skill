# ADR-0001 — MDPR as Deterministic Presentation Runtime

## Status

Superseded by the current MDPR-first architecture.

## Decision

MDPR owns the deterministic presentation runtime: parsing, slide/object
splitting, semantic metadata, layout, element boxes, component variants,
decoration, theme colors, typography, arrows, z-order, validation, and renderer
output.

`mdpr-skill` may add optional pre-build semantic hints, but those hints are weak
inputs and can be disabled without breaking the build.

## Consequences

- MDPR can be installed and used without an LLM or agent runtime.
- Agent hints must stay semantic and schema-valid.
- Design choices remain reproducible rule/config outcomes inside MDPR.
