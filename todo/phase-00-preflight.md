# Phase 00 - Preflight

## Goal

Prepare the `design-components-rule-based` pipeline without breaking the existing MDPR pipeline.

## Tasks

- [x] Review the public APIs of `packages/cli`, `packages/core`, `packages/layout`, `packages/override`, `packages/report-html`, `packages/report-pdf`, and `design_components/pptx`.
- [x] Save input/output snapshots for existing `build`, `inspect`, `plan`, and `validate` commands.
- [x] Confirm the new pipeline mode name: `design-components-rule-based`.
- [x] Confirm the new design integration root: `design_components/`.
- [x] Document the responsibility split between existing `theme-gallery` and new `style-gallery`.
- [x] Pin the upstream Design Components reference.
- [x] Include MIT license notice.
- [x] Include the `third_party/design-source/UPSTREAM.md` plan in the PR description.
- [x] Pass the CI baseline.

## Acceptance

- [x] Legacy build snapshots are unchanged before and after the phase.
- [x] The new pipeline does not run unless enabled by flag or config.
- [x] Vendor and license policy is reviewable.
