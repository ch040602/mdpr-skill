# MDPR vs Current Skill Results

This comparison uses Markdown files from the local MDPR checkout as a shared source corpus. The generated source deck includes root README files, product docs, architecture docs, splitting/layout/rendering docs, validation docs, one ADR, and multiple example decks.

## Result Files

- MDPR baseline PPTX: `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- Current skill PPTX: `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`
- Skill PPTX from actual MDPR run: `artifacts/mdpr-vs-skill/mdpr-skill-from-actual-md-run.pptx`
- Shared Markdown source: `artifacts/mdpr-vs-skill/mdpr-source-corpus.md`
- Source manifest: `artifacts/mdpr-vs-skill/source-manifest.json`
- Validation report: `artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json`

Regenerate the pair:

```bash
npm run compare:mdpr-skill
```

## Source Coverage

The current generated set uses:

- 24 Markdown files from `.cache/mdpr`
- 192 headings
- 48,879 source characters
- README, Korean README, CODEX prompt, docs, ADR, and example deck files

## What MDPR Produces

MDPR is the baseline presentation runtime. In this comparison it:

- parses the shared Markdown corpus;
- creates MDPR `BlockIR`, outline, split plan, and `Presentation IR`;
- renders a PowerPoint deck through the MDPR PPTX renderer;
- keeps the output broad and content-complete, with 46 slides in the current run.

This output is useful for validating coverage, split behavior, renderer correctness, editable text, tables, and stable deck generation.

## What the Current Skill Produces

The current skill does not replace MDPR. It starts after MDPR's semantic content boundary and demonstrates richer visual decisions. The generated `mdpr-skill-from-actual-md-run.pptx` deck records the concrete MDPR CLI run first, then shows the skill-side result from the same Markdown corpus and MDPR run metrics:

- deterministic recipe and variant framing;
- source coverage cards;
- pipeline and responsibility diagrams;
- native chart and table objects;
- monotone text-only icon aside;
- coherence-oriented typography, spacing, object variety, and visual hierarchy.

The current run creates a 9-slide PPTX designed to explain the difference and show how visual diversification changes the output shape without taking over Markdown parsing.

## Practical Difference

| Area | MDPR | Current skill |
| --- | --- | --- |
| Primary job | Markdown to presentation runtime | Visual diversification layer |
| Input ownership | Markdown files and parser modes | MDPR semantic output and content metrics |
| Parser | Built-in parser or Pandoc parser mode | None |
| Main output | Baseline editable PPTX | Styled explanatory PPTX with richer visual variety |
| Design choice | Theme/preset oriented | Rule-based recipes, variants, icon slots, infographic patterns |
| Validation | Build/render viability | Render preview, object variety, font floor, coherence constraints |
