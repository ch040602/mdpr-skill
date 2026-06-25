# Phase 04 - Visual Profile Catalog

## Goal

Define `DeckVisualProfile` and `CoherenceLock`, the units used for design diversity and deck consistency.

## Tasks

- [x] Define `DeckVisualProfile`.
- [x] Define `CoherenceLock`.
- [x] Add profile catalog loader.
- [x] Add seven default profiles:
  - [x] `friendly-dashboard`
  - [x] `layered-product`
  - [x] `sharp-technical`
  - [x] `editorial-brief`
  - [x] `command-dense`
  - [x] `expressive-hero`
  - [x] `minimal-system`
- [x] Implement profile auto-selection scoring.
- [x] Handle user-forced profiles.
- [x] Handle unsupported profile errors.
- [x] Create deck coherence locks.

## Acceptance

- [x] When a profile is specified, only that profile is used.
- [x] Profile auto-selection is deterministic.
- [x] Coherence lock is passed into every slide selection.
