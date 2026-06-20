# Structural Pattern Taxonomy for MDPR

This note records a source-neutral structural reference analysis used to improve MDPR's deterministic visual-diversification rules. The repository stores only aggregate metrics and derived object grammar. It does not store source names, URLs, downloaded presentations, thumbnails, copied layouts, copied images, or brand-like objects from the reference corpus.

## Corpus Scope

Local structural report:

- `artifacts/reference-pattern-analysis/derived-object-rules.json`
- `artifacts/reference-pattern-analysis/structural-summary.json`
- downloaded presentation files analyzed locally: `50`
- decks analyzed: `50`
- slides analyzed structurally: `492`
- PowerPoint-rendered PNG slides: `984`
- PNG samples analyzed: `100`
- aggregate objects: `4,769` shapes, `3,626` text frames, `44` tables, `19` charts, `51` pictures

Regenerate the pass with a private or local approved corpus:

```bash
npm run reference:rules
```

The command intentionally requires corpus location environment variables. Source-specific corpus locations are not stored in the repository.

## Element Families

| Family | Use in MDPR | Coherence guard |
| --- | --- | --- |
| Simple shape system | section labels, support panels, number badges, thin accent rules | One radius/border/side-accent grammar per slide. No decorative shape unless it encodes grouping, order, evidence, or emphasis. |
| Table grid system | comparisons, checklists, validation summaries, risk matrices | Header owns strongest fill; first column may be row-label bold; numeric columns align right; subtle row banding only. |
| Small icon marker | text-only support, status cue, row marker | Icon stays small, monotone, and secondary. It must not fill empty space or become a large card. |
| Pictorial metaphor anchor | only when content or provided image justifies a metaphor | Labels anchor to the object; no invented brand-like icons or untracked assets. |
| Chart proof object | native charts, editable arc/ring proof objects, gauge proof objects, connected strips, trend backdrops | One dominant chart family per slide; labels attach to marks; same-role connectors share one style; background charts remain lower contrast than foreground claims. |

## Table Coherence Rules

- Strip simple Markdown emphasis markers inside cells before PPT rendering.
- Header row is bold, centered, and uses the strongest theme fill.
- First column is a row-label column and may be bold when the table has two or more columns.
- Numeric columns align right.
- Body rows may use subtle banding from the active surface color.
- Text is vertically centered inside cells.
- Minimum rendered table text size should stay at or above `14pt` unless a future explicit appendix mode is introduced.

## Text Box Rules

- Preserve semantic bold/italic in paragraph/list rich text.
- Do not emit hard tab characters into PPT text boxes; use deterministic spacing or paragraph-level indentation instead.
- Render plain `listItem` or plain list entries as separate editable text boxes when PowerPoint rich-text line breaks would collapse adjacent entries.
- Normalize long spaces before measurement and rendering.
- Parent labels should use a font size greater than or equal to child labels. Child emphasis may use bold, but not a larger size.
- Text boxes inside shapes should use middle vertical alignment when the shape is a card, callout, or row label.

## Icon Rules

Icons are not a whitespace-filling device.

- Use one icon at most for a text-only support slide.
- Render the icon as a small monotone marker, not a large card.
- Do not use icon slots on chart, table, image, code, or already visually rich slides.
- The icon must be subordinate to title/body hierarchy and should not compete with proof objects.
- When a circle, rounded badge, alphabet marker, number marker, or icon is used like a bullet, the marker shape and the marker text/icon must share the same center point on both axes.
- The adjacent text first-line midpoint must align to the marker center on the vertical axis; reserve a fixed gutter before measuring the text box.

## Rule-Based Diversity Roadmap

Accepted implementation families:

- `table-grid-system`: stronger column width heuristics and appendix mode.
- `small-icon-marker`: row/status marker variants with fixed max size.
- `chart-proof-object`: native bar charts plus editable `arc-ring`, `gauge`, and `connected-strip` variants in MDPR PPTX output.
- `pictorial-metaphor-anchor`: only for provided or detected imagery.
- `simple-shape-system`: deterministic section labels, rules, and proof callouts.
- `derived-object-patterns`: 60 reusable object/decorator seeds covering accent rails, tabs, brackets, chips, notches, image sidecars, metric lead cards, connector dots, document metaphors, browser/window frames, speech callouts, timeline rails, hub/spoke diagrams, matrix layouts, chart proof objects, image-caption splits, status tables, and a plain-safe high-density fallback.

Rejected pattern:

- Large decorative icon cards added only to balance empty space. This breaks coherence and creates a template-like look.

## Card Decoration Selection Inputs

The seed catalog is selected by rulebase inputs rather than visual copying:

- `hasImage`: enables image sidecar, caption underlay, and floating label pin styles.
- `hasKeyNumber`: enables metric lead, rank ribbon, bottom meter, arc corner, and target-ring badge styles.
- `importance`: reserves stronger treatments for importance 4 or 5.
- `textChars`: keeps long text in plain-safe, vertical rail, side-notch, or image-sidecar forms.
- `relation`: distinguishes plain list, sequence, ranking, comparison, proof, constraint, checklist, and flow cards.
- `density`: prevents decoration from consuming space when readability is the primary risk.

## Derived Object Pattern Families

The reference pass stores 60 object rules in `visual-diversification-seeds.json` under `derivedObjectPatterns`. They are grouped as method vocabulary rather than copied slide templates:

| Family | Example object rules | Selection signal |
| --- | --- | --- |
| Card/list decorators | `accent-rail-card`, `top-rule-card`, `number-tab-card`, `bracket-note-card`, `plain-safe-card` | relation, importance, text length, density |
| Semantic markers | `dot-marker-row`, `micro-icon-marker`, `proof-chip-inline`, `status-dot-table` | text-only, status, proof, row labels |
| Document metaphors | `rounded-ticket-panel`, `paperclip-corner`, `binder-hole-strip`, `folded-corner-card`, `stacked-paper-cards` | explicit document/notebook/workbook intent |
| Diagram systems | `horizontal-step-rail`, `vertical-step-rail`, `loop-arrow-cycle`, `center-hub-spokes`, `axis-quadrant-map`, `timeline-marker-strip` | sequence, cycle, hub, matrix, timeline |
| Chart proof objects | `donut-label-ring`, `gauge-score-card`, `small-multiple-bars`, `trend-line-backdrop`, `stair-progress-meter` | ratio, score, comparison, trend, progress |
| Image-aware objects | `floating-label-pin`, `caption-underlay`, `image-sidecar-card`, `photo-window-mask`, `image-caption-split`, `pictorial-anchor-labels` | provided image, image caption, metaphor need |

Selection rules must still prefer readability over decoration. High-density text, crowded tables, code, and already rich chart/image slides fall back to `plain-safe-card` or to the native object renderer rather than adding ornament.
