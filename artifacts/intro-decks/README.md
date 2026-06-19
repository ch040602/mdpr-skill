# Intro Deck Artifacts

This folder contains reusable MDPR-generated introduction decks.

- `mdpr-intro-refined.md`: reusable LLM-hint source. It is already compacted into semantic presentation text, but MDPR still owns final layout, colors, charts, and PPTX objects.
- `element-catalog-refined.md`: a bullet-style catalog of slide elements and object families supported by the current MDPR path.
- `theme-gallery/deck.pptx`: one PowerPoint deck that repeats the intro source across every built-in MDPR theme.
- `element-catalog/deck.pptx`: one PowerPoint deck that lists supported slide elements and proof-object families.
- `theme-gallery-contact-sheet.png` and `element-catalog-contact-sheet.png`: PowerPoint-rendered visual QA sheets.
- `validation-report.json`: slide counts, exported PNG counts, native chart-part counts, and basic rendered-content checks.

The LLM only prepares reusable bullet-style source wording. Runtime decisions remain deterministic MDPR behavior.
