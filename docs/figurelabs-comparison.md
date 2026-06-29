# FigureLabs Comparison

This note compares the public FigureLabs scientific illustration workflow with
`mdpr-skill` plus MDPR as of 2026-06-30. It is scoped to supported formats,
workflow completeness, and verifiable development artifacts. It does not claim
that `mdpr-skill` replaces FigureLabs for direct scientific illustration
generation.

## Public FigureLabs Baseline

Public FigureLabs pages position the product as an AI scientific illustration
agent for text/reference/sketch-to-figure workflows and research flowcharts. The
public site and help snippets describe exports to editable PPTX and SVG,
high-resolution PNG/JPG, and PDF. Pricing/help snippets also mention vector
export for SVG or PPTX, uploaded PDF/Word references, and a publication
authorization PDF.

Reference pages:

- <https://www.figurelabs.ai/>
- <https://www.figurelabs.ai/help-center>
- <https://www.figurelabs.ai/pricing>
- <https://www.figurelabs.ai/about>
- <https://www.figurelabs.ai/flowchart>
- <https://www.figurelabs.ai/blog/visualize-research-instantly>
- <https://www.figurelabs.ai/blog/sketch-to-science>

## Capability Matrix

Run the local matrix generator:

```bash
node bin/mdpr-skill.js formats \
  --compare figurelabs \
  --out artifacts/figurelabs-format-comparison/format-capabilities.json

node bin/mdpr-skill.js formats \
  --validate artifacts/figurelabs-format-comparison/format-capabilities.json

node bin/mdpr-skill.js formats \
  --compare figurelabs \
  --format markdown \
  --out artifacts/figurelabs-format-comparison/format-capabilities.md

node bin/mdpr-skill.js formats \
  --compare figurelabs \
  --format html \
  --out artifacts/figurelabs-format-comparison/format-capabilities.html
```

The generated report uses schema
`mdpr-skill-format-capabilities-v1` and is governed by
`schemas/mdpr-format-capabilities.schema.json`.
The validation command checks schema identity, required sections, HTTPS source
references, coverage count consistency, and mdpr-skill superiority gates.
The same matrix can be exported as JSON for automation, Markdown for code
review, or self-contained HTML for stakeholder-readable review.
The JSON report also includes `mdprSkill.comparisonReportFormats` and
`coverage.mdprSkill.comparisonReportFormats`, so JSON, Markdown, and HTML report
support is part of the machine-readable contract rather than README-only prose.
It also includes `comparisonTarget.sourceReviewedDate`,
`comparisonTarget.sourceReviewTimezone`, and `comparisonTarget.sourceReviewScope`
so the public-source review window is explicit in the artifact. The
`comparisonTarget.sourceEvidence` claim-to-URL evidence map ties each public
FigureLabs capability claim back to the public reference pages used for this
comparison.

| Area | FigureLabs public workflow | mdpr-skill + MDPR |
| --- | --- | --- |
| Primary focus | Scientific figure generation and editing | Deterministic presentation build, review, validation, and proposal artifacts |
| Public input modes | Text-to-figure, reference-to-figure, sketch/image-to-figure, PDF/Word/reference upload, research flowcharts | Markdown, selection context JSON, agent hints, MDPR manifests, Presentation/Layout IR, rendered-preview evidence, source metadata, DESIGN.md, HTML, layout catalogs |
| Public output formats | PPTX, SVG, PNG, JPG, PDF | PPTX, HTML, PDF, SVG, JSON, Markdown |
| Comparison report formats | Public comparison report exports not visible | JSON, Markdown, HTML through `mdprSkill.comparisonReportFormats` |
| Editable outputs | PPTX/SVG figure exports | Editable PPTX through MDPR; JSON contracts remain editable and reviewable |
| Machine-readable contracts | Public site focuses on product exports; repo-local schemas are not visible | Agent hints, change requests, review reports, narrative/layout/speaker/citation/accessibility/evidence reports, theme candidates, design analysis, eval reports |
| Workflow stages | Generate, edit, vectorize, export, publication authorization | Source-grounded hinting, Markdown-bound selection verification, semantic review, approval-bound change control, deterministic MDPR rendering, rendered-preview critique, source-to-slide evidence ledger, schema sync validation, release preflight, consumer install smoke |
| Assurance artifacts | Publication authorization PDF | Source SHA evidence, schema sync report, review report JSON, change approval state, MDPR manifest evidence, eval regression report, evidence ledger, release preflight log, npm install smoke result, npm audit result |
| Evidence traceability | Source URLs listed at document level | `sourceEvidence` maps public claims to source URLs and validation rejects untrusted refs |
| Source review metadata | Public pages can change over time | `sourceReviewedDate`, timezone, and scope are schema-validated; Source reviewed: 2026-06-30 (Asia/Seoul) |
| Completeness counts | 5 public output format families, 5 public workflow stages, 1 public assurance artifact, 6 public evidence claims | 27 format/contract families, 3 comparison report formats, 10 workflow completion signals, 10 assurance artifacts |

## Source Evidence

The generated JSON, Markdown, and HTML artifacts include a Source Evidence
section. The current evidence map covers:

- `input-text-pdf-reference`
- `input-sketch-photo-reference`
- `output-format-exports`
- `workflow-generate-edit-vectorize-export`
- `flowchart-svg`
- `publication-authorization`

## Improvement Direction

The useful improvement over a FigureLabs-style flow is not to copy a direct
image-generation UI. The stronger path for this repository is to make every
agent-assisted decision replayable and auditable before MDPR renders the final
deck:

- expose the supported format matrix through `mdpr-skill formats`;
- make comparison report formats a schema-validated contract instead of
  README-only command prose;
- compare workflow stages and assurance artifacts, not just file extensions;
- validate the generated matrix before relying on comparison claims;
- keep generated-image requests as bounded semantic candidates;
- require `--markdown` source checks for selection-context based hints and
  PowerPoint proposals;
- show acceptance in MDPR manifests instead of relying on prose advice;
- keep all final coordinates, theme choices, object IDs, and PPTX objects under
  MDPR ownership.
- preserve the gap closure explicitly: FigureLabs-style image generation is a
  semantic request candidate in mdpr-skill, while deterministic rendering and
  final object ownership stay in MDPR.

## Evidence

The current repository has two tracked comparisons:

- `artifacts/icon-image-fallback-comparison/`: concrete before/after example
  where MDPR accepts one generated-image semantic hint with no stale or
  forbidden-field findings.
- `artifacts/figurelabs-format-comparison/format-capabilities.json`: generated
  format/completeness matrix showing broader workflow contracts than the public
  FigureLabs export set.
- `artifacts/figurelabs-format-comparison/format-capabilities.md`: Markdown
  export of the same matrix for repository review.
- `artifacts/figurelabs-format-comparison/format-capabilities.html`: standalone
  HTML export of the same matrix for browser review.
