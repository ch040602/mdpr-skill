# Phase 14 - Style Gallery

## Goal

Generate multiple visual profile outputs from the same Slide Element IR so design diversity can be reviewed.

## Tasks

- [x] Implement `--style-gallery` CLI.
- [x] Generate Element IR once and reuse it across profiles.
- [x] Generate `StyledDeckIR` per profile.
- [x] Generate PPTX/HTML/PDF output per profile.
- [x] Generate gallery manifest JSON.
- [x] Save inspect JSON per profile.
- [x] Verify theme color slots are preserved.
- [x] Decide whether failed profiles stop the whole gallery or produce partial output.

## Output Convention

```text
dist/style-gallery/
  manifest.json
  friendly-dashboard/deck.pptx
  friendly-dashboard/inspect.json
  layered-product/deck.pptx
  layered-product/inspect.json
  minimal-system/deck.pptx
  minimal-system/inspect.json
```

## Acceptance

- [x] Every profile shares the same Element IR checksum.
- [x] Per-profile recipe and variant differences are recorded in inspect output.
- [x] PPTX theme color binding is preserved.
