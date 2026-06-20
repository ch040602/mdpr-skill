# Actions Page Materials

This document lists the stable images that can be shown in GitHub Actions summaries, release notes, pull requests, and the repository README. Every image is copied from a generated MDPR PPTX render, not from a hand-edited mockup.

## Stable Preview Images

| Asset | Purpose | Source |
| --- | --- | --- |
| `docs/assets/theme-style-cover-contact-sheet.png` | Compact cover-slide preview across theme style and color combinations | `artifacts/theme-style-color-matrix/theme-style-color-cover-contact-sheet.png` |
| `docs/assets/theme-style-proof-contact-sheet.png` | Main README and Actions proof preview for theme/object coherence | `artifacts/theme-style-color-matrix/theme-style-color-proof-contact-sheet.png` |
| `docs/assets/theme-decoration-review-matrix.png` | Object-shape grammar and structural diversity review preview | `artifacts/theme-decoration-review/png/슬라이드3.PNG` |
| `docs/assets/theme-glass-proof.png` | Focus preview for glass-style PPT-native effects | `artifacts/theme-style-color-matrix/glass-violet-split/png/슬라이드6.PNG` |
| `docs/assets/theme-newmorphism-proof.png` | Focus preview for soft paired-shadow newmorphism surfaces | `artifacts/theme-style-color-matrix/newmorphism-slate-analogous/png/슬라이드6.PNG` |
| `docs/assets/theme-minimalism-proof.png` | Focus preview for whitespace-first minimalism surfaces | `artifacts/theme-style-color-matrix/minimalism-ink-mono/png/슬라이드6.PNG` |

## Recommended Actions Summary

Use this Markdown block when a workflow publishes visual QA output:

```md
## MDPR Visual QA

![Theme style proof contact sheet](docs/assets/theme-style-proof-contact-sheet.png)

- Theme/style/color matrix: `artifacts/theme-style-color-matrix/theme-style-color-report.json`
- Decoration review deck: `artifacts/theme-decoration-review/theme-decoration-review.pptx`
- Iteration report: `artifacts/theme-decoration-review/theme-decoration-review-iteration-report.json`
- Stable README assets: `docs/assets/theme-*.png`
```

## Refresh Procedure

1. Run `npm run theme:matrix`.
2. Run `npm run audit:theme-decoration`.
3. Run `npm run review:theme-decoration`.
4. Copy the selected generated PNGs into `docs/assets/theme-*.png`.
5. Verify copied images are nonblank and keep all filenames ASCII.

The current image set was checked for nonblank PNG output and includes cover, proof, glass, newmorphism, minimalism, and object-diversity previews.
