# MDPR Object Catalog

## Object Family Index

| Family | Usable objects | Rendered as |
| --- | --- | --- |
| Text | cover, title, paragraph, list, quote, code | editable PPT text boxes |
| Cards | single card, comparison, vertical list, 2x2 grid, 3x2 grid, radial pentagon | editable rounded regions |
| Data | table, native bar chart, chart beside prose, chart plus table | native PPT table/chart plus text |
| Proof charts | arc ring, gauge, connected strip, ranked bars, metric dots | editable PPT shapes |
| Media | image focus, image beside text, image stack | PPT image objects |
| Decoration | backgrounds, surfaces, badges, accent rails, icon markers, proof callouts | editable shapes/icons |

## Text Objects

- Cover/title object: large hierarchy entry point.
- Paragraph object: bounded body text with readable minimum size.
- Ordered list object: number badges and stable row spacing.
- Unordered list object: small icon badges when rendered as item cards.
- Quote object: key-message callout surface.
- Code object: monospace code window.

## Card Layouts

- Single-card: one emphasized takeaway.
- Comparison: two balanced regions.
- Vertical-list: three or more row cards.
- Grid 2x2: four peer cards.
- Grid 3x2: six compact peer cards.
- Pentagon/radial: five related cards around a center rhythm.

## Comparison Cards

- Baseline contract: Markdown is source.
- Runtime contract: MDPR owns deterministic layout.

## Vertical List Cards

- Parse semantic Markdown.
- Split slides and objects.
- Select recipe and variant.
- Validate overflow and coherence.

## Grid Cards

- Title/body
- Quote/key message
- Table focus
- Chart proof
- Image focus
- Code focus

## Pentagon Object Set

- Feature extraction
- Recipe selection
- Theme harmony
- Region composition
- Decoration pass

## Table Object

| Element | PPTX object | Coherence rule |
| --- | --- | --- |
| Header row | Native table text | bold and readable |
| Numeric cell | Native table text | right aligned |
| Long label | Native table text | trimmed spacing |
| Body cell | Native table text | stable minimum font |

## Native Bar Chart

```chart
labels: Parser, Layout, Renderer
Coverage: 91, 87, 94
```

## Chart Beside Prose

- Pattern: short interpretation text beside quantitative evidence.
- Owner: MDPR selects body/chart geometry and typography.
- Constraint: text stays compact so the chart keeps visual priority.

```chart
labels: Baseline, Refined, Validated
Score: 61, 84, 93
```

## Chart Plus Table

```chart
labels: Text, Table, Chart, Image
Coverage: 86, 92, 95, 78
```

| Object | Use | Rule |
| --- | --- | --- |
| Text | interpretation | left or lower support |
| Table | precise values | middle aligned cells |
| Chart | visual proof | theme-bound colors |
| Image | evidence | aspect ratio preserved |

## Gauge Proof Object

```chart
kind: gauge
labels: Readiness
Score: 83
```

## Arc Ring Proof Object

```arc-ring
labels: Validated, Remaining
Coverage: 72, 28
```

## Connected Strip Proof Object

```connected-strip
Draft, 20
Render, 68
Validate, 92
```

## Ranked Bars Proof Object

```ranked-bars
Parser, 91
Layout, 87
Renderer, 94
```

## Metric Dots Proof Object

```metric-dots
Draft, 20
Review, 68
Ship, 92
```

## Pipeline Diagram Object

Draft => Parse => Split => Compose => Render => Validate

## Quote Callout Object

> One graph or diagram block must stay on one slide.

- The callout surface is editable.
- The quote keeps a stronger hierarchy than support text.
- Supporting text remains bounded below the proof point.

## Code Window Object

```ts
const deck = parseMarkdown(source);
const layout = planLayout(deck, config);
await renderPptx({ presentation: deck, layout }, options);
```

## Text Icon Aside Object

- Text-only slides may receive one quiet monochrome icon.
- The icon is centered in its slot and stays secondary.
- It must not fill empty space as a large decorative object.

This long explanatory paragraph intentionally triggers the text-icon-aside layout. It gives the renderer enough prose to reserve a small support icon while keeping the content readable, bounded, and aligned to the main text region.

## Image Focus Object

![Mixed object reference](artifacts/design-showcase/assets/mixed_object_reference.png)

## Image Beside Text Object

- Image-aware layouts keep body text and image objects in separate regions.
- The renderer must preserve aspect ratio and avoid covering text.
- The catalog keeps the icon/image role restrained rather than filling blank space.

![Mixed object reference](artifacts/design-showcase/assets/mixed_object_reference.png)

## Decoration Objects

| Decoration | Purpose | Coherence guard |
| --- | --- | --- |
| Preset background | theme identity | low contrast behind content |
| Region surface | grouping | one radius grammar per slide |
| Accent rail | reading order | same-role rails share color |
| Number badge | ordered item marker | centered to item text |
| Icon badge | unordered item marker | small monochrome marker |
| Proof callout | validation emphasis | contrast color used sparingly |
| Theme colors | deck-level palette | accent1-accent6 registered in PPT |
| Template asset | brand support | decorative only, body recalculated |

## Card Decoration Styles A

- left-accent-rail: plain lists with a stable vertical rail.
- top-hairline-rule: quiet cards with a thin top rule.
- number-tab: ordered cards with a compact number tab.
- corner-chip: short high-importance labels.
- bracket-callout: proof or constraint labels with an indented description.
- dot-marker-row: plain list rows with a small centered dot.
- split-tone-row: comparison rows with a restrained label zone.
- proof-chip-inline: validation metric chip.
- thin-outline-card: dense cards with only a surface outline.
- bottom-meter: progress or score cards with data-bound meter.
- side-notch: important cards with a compact side notch.

## Card Decoration Styles B

- floating-label-pin: image cards with a small readable pin.
- caption-underlay: image cards with a caption band.
- rank-ribbon: ranked metric cards.
- micro-icon-marker: one quiet monotone semantic marker.
- double-rule-header: sectioned lists with paired hairlines.
- soft-shadow-lift: one lead card with shallow depth.
- inset-label-bar: category cards with a compact bar.
- vertical-step-rail: long-text sequence cards.
- horizontal-step-rail: short-text sequence cards.
- paired-contrast-edge: true before/after or opposing comparison.
- quote-rule-card: quotation or takeaway cards.

## Card Decoration Styles C

- metric-lead-card: importance-five numeric lead.
- checklist-grid-card: many short checklist items.
- constraint-stack-card: bold label line plus indented description.
- label-overline-card: category label over title/body.
- subtle-band-card: medium density support band.
- arc-corner-emphasis: small arc cue for ratio/progress.
- target-ring-badge: goal or benchmark badge.
- image-sidecar-card: small image beside text.
- table-summary-card: table-adjacent summary.
- connector-dot-card: flow/dependency anchor.
- plain-safe-card: high-density text where decoration would hurt readability.
