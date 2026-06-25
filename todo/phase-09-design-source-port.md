# Phase 09 - Design Source Port

## Goal

Port Design Components rules, tokens, skins, motion, and patterns into MDPR's renderer-neutral format.

## Tasks

- [x] Create `third_party/design-source` attribution and license boundary.
- [x] Create applied data structure under `design_components/design-source-adapter`.
- [x] Record upstream commit/tag.
- [x] Include `LICENSE`.
- [x] Write `UPSTREAM.md`.
- [x] Write import script.
- [x] Copy `DESIGN-LANGUAGE.md` into `design_components/design-source-adapter/reference` as a rule reference.
- [x] Copy `VISUAL-CRAFT.md` into `design_components/design-source-adapter/reference` as a coherence lint reference.
- [x] Map tokens into MDPR style tokens.
- [x] Map skins into visual profile axes and fallback preview colors.
- [x] Map motion seeds/keywords into renderer capabilities.
- [x] Do not directly import React component implementation at runtime.

## Acceptance

- [x] Design Components upstream attribution is retained.
- [x] Final PPTX path does not contain skin hardcoded hex values.
- [x] Design Components motion has static fallback in PPTX/PDF.
