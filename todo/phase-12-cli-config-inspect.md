# Phase 12 - CLI / Config / Inspect

## Goal

Let users control and debug rule-based style selection through CLI and config.

## Tasks

- [x] Extend config schema.
- [x] Define config loader merge order.
- [x] Add `--style-engine design-components`.
- [x] Add `--style-select rule-based`.
- [x] Add `--profile <id>`.
- [x] Add `--style-gallery <ids>`.
- [x] Add `--rulebook <path>`.
- [x] Add `inspect-style` command.
- [x] Add `lint-style` command.
- [x] Support JSON output.
- [x] Support human-readable table output.

## Inspect Fields

- [x] Deck profile.
- [x] Coherence lock.
- [x] Slide features.
- [x] Recipe candidates.
- [x] Hard reject reasons.
- [x] Score breakdown.
- [x] Selected recipe.
- [x] Selected variants.
- [x] Lint findings.

## Acceptance

- [x] The selection process can be reproduced from `inspect-style` output alone.
- [x] `lint-style` strict mode returns CI-appropriate exit codes.
