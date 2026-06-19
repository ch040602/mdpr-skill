# LLM Hint Before/After PPT Comparison

This artifact set compares MDPR output before and after optional LLM-style semantic hints.

- `source-before.md`: original Markdown with less explicit semantic grouping.
- `source-after.md`: same topic rewritten as semantic hints an agent may provide: intent, grouping, quote emphasis, table proof, and pipeline structure.
- `mdpr-before-executive.pptx`: MDPR output from `source-before.md` with the executive theme.
- `mdpr-before-editorial.pptx`: MDPR output from `source-before.md` with the editorial theme.
- `llm-hint-after-executive.pptx`: MDPR output from `source-after.md` with the executive theme.
- `llm-hint-after-editorial.pptx`: MDPR output from `source-after.md` with the editorial theme.
- `previews/`: PowerPoint-rendered PNG exports for each deck.
- `llm_before_after_contact_sheet.png`: combined rendered preview.
- `llm_before_after_report.json`: slide counts and preview paths.

The LLM does not choose colors, coordinates, typography, z-order, or renderer objects. MDPR owns rendering and applies the selected theme and color-combination rules.
