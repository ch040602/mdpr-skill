# ADR-0003 — PPT Theme Color Binding

## Status

Proposed

## Decision

In `color.mode: ppt-theme`, all final PPTX colors use PowerPoint theme slots. Design Components skin colors may be used only as fallback/preview references.

## Consequences

- `ThemeColorRef` is required.
- raw hex lint is required.
- renderer adapters must support theme slots.
