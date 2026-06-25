# Phase 10 - PPT Theme Colors

## Goal

Bind all major style colors to PPT theme slots so users can change color combinations inside PowerPoint.

## Tasks

- [x] Implement `ThemeColorRef`.
- [x] Implement `PptThemeSlot`.
- [x] Implement semantic token to theme slot mapping.
- [x] Decide the supported tint/shade/transparency range.
- [x] Add `allowRawHexInPptx` config.
- [x] Add raw hex lint.
- [x] Implement `design_components/pptx` adapter.
- [x] Map shape fill and line colors.
- [x] Map text run colors.
- [x] Map chart series colors.
- [x] Validate fallback hex as preview-only.

## Acceptance

- [x] In `color.mode: ppt-theme`, the final style plan contains only theme refs.
- [x] Fallback hex is rejected unless `previewOnly: true`.
- [x] PPTX rendering smoke test passes.
