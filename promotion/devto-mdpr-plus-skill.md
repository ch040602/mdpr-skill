---
title: Using LLMs for slide review, not slide layout: MDPR + mdpr-skill
published: false
tags: markdown, powerpoint, typescript, productivity
---

I have been building MDPR, a deterministic Markdown-to-editable-PPTX runtime, and mdpr-skill, an optional Codex companion for review hints.

The problem I wanted to avoid is common in LLM-generated slide decks: the model owns too much. It chooses coordinates, colors, emphasis, spacing, and object geometry directly. The first slide may look plausible, but coherence often drifts across the deck.

MDPR uses a different boundary:

- Markdown is parsed into presentation structure.
- Slide splitting and layout planning are deterministic.
- Theme colors, z-order, object bounds, and renderer output are owned by MDPR.
- The output is editable PPTX first, with HTML/PDF/PNG previews downstream.

mdpr-skill sits before that runtime. It can suggest compact semantic tags, icon-search keywords, Markdown cleanup notes, and visual QA concerns. It cannot own final coordinates, exact colors, z-order, shape geometry, exact icons, or renderer object IDs.

The short version:

> The LLM can suggest; MDPR renders.

Install MDPR:

```bash
npm install -g @mdpresent/cli
mdpresent build deck.md --to pptx,html --out dist
```

Runtime:
https://github.com/ch040602/MdPr

Optional skill:
https://github.com/ch040602/mdpr-skill

npm:
https://www.npmjs.com/package/@mdpresent/cli

Preview gallery:
https://ch040602.github.io/MdPr/theme-preview/

I am looking for Markdown edge cases that usually break when converted into PowerPoint: dense tables, chart/table pairs, diagrams, mixed-language text, captions, and documents where editability matters after generation.
