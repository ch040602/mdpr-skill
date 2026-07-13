# MDPR vs mdpr-skill Review Evidence

This comparison uses the current sibling MDPR checkout, not the stale cached
copy. MDPR renders the shared Markdown corpus; the mdpr-skill deck explains the
review boundary and records evidence. It is not a second renderer.

## Result Files

- MDPR baseline PPTX: `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- Review evidence PPTX: `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`
- Evidence copy tied to the actual MDPR run: `artifacts/mdpr-vs-skill/mdpr-skill-from-actual-md-run.pptx`
- Shared Markdown source: `artifacts/mdpr-vs-skill/mdpr-source-corpus.md`
- Source manifest: `artifacts/mdpr-vs-skill/source-manifest.json`
- Machine-readable report: `artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json`

Regenerate and validate both decks:

```bash
npm run compare:mdpr-skill
```

## Current Evidence Scope

| Evidence | Current value |
| --- | ---: |
| MDPR commit | `5614becde51785ca81c1907a78da692cc8626297` |
| Markdown files | 21 |
| Headings | 184 |
| Source characters | 93,102 |
| MDPR baseline slides | 35 |
| Review evidence slides | 9 |
| Minimum generated font in each PPTX | 16pt |

The 21 files comprise 13 product/runtime documents, six example decks, one
root README, and one ADR. The manifest remains a JSON evidence artifact instead
of being repeated across sparse presentation slides.

## Boundary Comparison

| Decision boundary | MDPR | mdpr-skill review evidence |
| --- | --- | --- |
| Primary job | Deterministic Markdown parsing, splitting, layout, validation, and rendering | Optional semantic hints, critique, and evidence |
| Input | Markdown, parser mode, Presentation IR, Layout IR, templates | MDPR source context, manifests, rendered slides, and evidence paths |
| Typography | Owns exact family, size, floor, wrapping, and editable text runs | May suggest copy reduction or splitting, but cannot prescribe exact typography |
| Visual pass/fail | Owns required polish chapters and `MDPR_POLISH_GATE_FAILED` | Mirrors runtime failures and adds review findings without weakening them |
| Output | Editable PPTX, HTML, PDF, manifests, and previews | Hint files, review reports, and comparison evidence |

## Visual Revalidation Findings

Every slide is exported through its own PowerPoint process after a layout
stabilization delay. Preview files are cleared first, exact slide counts are
required, and a failed or partial export cannot fall back to stale PNGs.

The current review led to these changes:

- removed synthetic one-line subtitles, title underlines, isolated cover-bottom
  rules, TOC horizontal rules, and bottom takeaway bands;
- removed the slide-based source manifest and empty comparison section that
  created 12 sparse or content-free slides;
- normalized leading document numbers in comparison headings so Agenda does not
  display duplicated numbering;
- raised generated caption, code, list-badge, and diagram-badge behavior to the
  16pt visual floor instead of preserving code/caption exceptions;
- excluded intentional `.github` form checkboxes from unfinished-work detection
  while keeping unchecked boxes in governed documentation as failures;
- isolated PowerPoint exports per slide, waited for full layout, fixed UTF-8
  subprocess decoding, and rejected incomplete export sets.

## Remaining Limitations

- Content-preserving MDPR splitting can still produce low-density continuation
  slides when a source section contains only a few large semantic blocks.
- Structural card accents and data separators remain when they communicate a
  real grouping; the rule removes only isolated or title-repeating lines.
- Template master/theme OOXML can be preserved, but this comparison does not
  prove that a requested font is installed or embedded on every host.
- The nine-slide review deck explains evidence and boundaries. It must not be
  interpreted as a styled replacement for the 35-slide MDPR runtime output.

Cross-repository schema and boundary validation is stored in
`artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json`.
