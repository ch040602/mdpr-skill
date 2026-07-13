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

| Decision boundary | MDPR | Current skill |
| --- | --- | --- |
| Primary job | Markdown-to-presentation runtime | Optional semantic hint and review companion |
| Input ownership | Markdown files, parser modes, Presentation IR, and Layout IR | MDPR manifests, semantic source context, and evidence paths |
| Typography authority | Resolves exact family, point size, floors, and text geometry | Suggests copy or split changes only; exact typography remains forbidden |
| Strict font handling | Required `fontHierarchy` checks the deck-wide `16pt` Layout IR floor, including code/caption regions | Mirrors `MDPR_POLISH_GATE_FAILED`; it cannot soften or replace the runtime result |
| Template font handling | Preserves master/layout/theme OOXML while generated text uses resolved MDPR typography | Reports mismatches without replacing template typography |
| Main output | Editable PPTX, HTML, PDF, manifests, and previews | Hint files, review reports, evidence ledgers, and comparison decks |

The current cross-repository schema/boundary check is stored in
`artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json` and is tied
to the MDPR commit recorded inside that artifact.
