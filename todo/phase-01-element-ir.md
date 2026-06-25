# Phase 01 - Element IR

## Goal

Create the headless `Slide Element IR` that MDPR passes to Design Components.

## Tasks

- [x] Create `packages/element-ir/package.json`.
- [x] Define `SlideElementIR`, `SlideNode`, `ElementNode`, and `ElementGroup` in `src/schema.ts`.
- [x] Add forbidden visual field validation in `src/validators.ts`.
- [x] Add content metric calculation in `src/metrics.ts`.
- [x] Add missing role and importance fallbacks in `src/normalize.ts`.
- [x] Sync with `schemas/slide-element-ir.schema.json`.
- [x] Add `buildSlideElementIR()` adapter in `packages/core`.
- [x] Preserve `source.markdownRange` and `source.headingPath`.
- [x] Add five fixtures.
- [x] Add snapshot tests.

## Forbidden Fields Validator

- [x] Reject `x`.
- [x] Reject `y`.
- [x] Reject `w`.
- [x] Reject `h`.
- [x] Reject `color`.
- [x] Reject `background`.
- [x] Reject `fontSize`.
- [x] Reject `radius`.
- [x] Reject `shadow`.
- [x] Reject `effect`.

## Acceptance

- [x] `SlideElementIR` is renderer-independent.
- [x] Every element has source mapping.
- [x] Tests fail if visual fields enter the IR.
