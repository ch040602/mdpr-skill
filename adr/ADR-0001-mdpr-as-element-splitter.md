# ADR-0001 — MDPR as Element Splitter in Design Components Mode

## Status

Proposed

## Decision

In `design-components-rule-based` mode, MDPR owns only parsing, slide splitting, element splitting, and semantic metadata. It does not decide visual layout, element boxes, component variants, or decoration.

## Consequences

- New `Slide Element IR` is required.
- Existing layout pipeline remains as legacy mode.
- Design Components composition owns layout decisions.
