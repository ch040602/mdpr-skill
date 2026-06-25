# Phase 07 - Composition Engine

## Goal

Convert the selected recipe and variants into concrete boxes and regions.

## Tasks

- [x] Create `design_components/composition`.
- [x] Define `Box`, `RegionRule`, `GridSpec`, and `SafeArea`.
- [x] Implement primitive layouts:
  - [x] hero
  - [x] split
  - [x] two-column
  - [x] three-column
  - [x] card-grid
  - [x] dashboard
  - [x] timeline
  - [x] process-flow
  - [x] comparison-matrix
  - [x] code-focus
- [x] Implement region allocation.
- [x] Implement element assignment.
- [x] Apply minimum readable size.
- [x] Check box collisions.
- [x] Implement overflow fallback.
- [x] Apply density-based spacing scale.

## Acceptance

- [x] Every `StyledElement` has a box.
- [x] Boxes remain inside the canvas safe area.
- [x] Dense slides downshift into compact layouts.
- [x] Overflow fallback traces are emitted.
