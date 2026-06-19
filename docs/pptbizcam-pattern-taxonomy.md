# PPT BIZCAM Pattern Taxonomy for MDPR

This note records a structural reference analysis used to improve MDPR's deterministic visual-diversification rules. PPT BIZCAM examples are used only as design-method references. MDPR must not copy source assets, layouts, or brand-like objects.

## Source Scope

Reference entry points:

- `https://pptbizcam.co.kr/?cat=3`
- adjacent sampled category IDs: `2, 7, 9, 10, 11, 12, 14, 19, 21, 30, 37, 39, 67`

Local structural report:

- `artifacts/pptbizcam-analysis/pptbizcam-analysis.json`
- visited posts: `120`
- PPTX files analyzed: `32`
- slides analyzed: `314`
- aggregate objects: `3,065` shapes, `2,282` text frames, `38` tables, `14` charts, `31` pictures

## Element Families

| Family | Use in MDPR | Coherence guard |
| --- | --- | --- |
| Simple shape system | section labels, support panels, number badges, thin accent rules | One radius/border/side-accent grammar per slide. No decorative shape unless it encodes grouping, order, evidence, or emphasis. |
| Table grid system | comparisons, checklists, validation summaries, risk matrices | Header owns strongest fill; first column may be row-label bold; numeric columns align right; subtle row banding only. |
| Small icon marker | text-only support, status cue, row marker | Icon stays small, monotone, and secondary. It must not fill empty space or become a large card. |
| Pictorial metaphor anchor | only when content or provided image justifies a metaphor | Labels anchor to the object; no invented brand-like icons or untracked assets. |
| Chart proof object | native charts, arc/ring charts, gauges, connected strips, trend backdrops | One dominant chart family per slide; labels attach to marks; background charts remain lower contrast than foreground claims. |

## Table Coherence Rules

MDPR table rendering should treat a table as row/column grammar, not as a card grid.

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
- Normalize long spaces before measurement and rendering.
- Parent labels should use a font size greater than or equal to child labels. Child emphasis may use bold, but not a larger size.
- Text boxes inside shapes should use middle vertical alignment when the shape is a card, callout, or row label.

## Icon Rules

Icons are not a whitespace-filling device.

- Use one icon at most for a text-only support slide.
- Render the icon as a small monotone marker, not a large card.
- Do not use icon slots on chart, table, image, code, or already visually rich slides.
- The icon must be subordinate to title/body hierarchy and should not compete with proof objects.

## Rule-Based Diversity Roadmap

Accepted future implementation families:

- `table-grid-system`: stronger column width heuristics and appendix mode.
- `small-icon-marker`: row/status marker variants with fixed max size.
- `chart-proof-object`: native chart plus arc/ring/gauge/connected-strip variants.
- `pictorial-metaphor-anchor`: only for provided or detected imagery.
- `simple-shape-system`: deterministic section labels, rules, and proof callouts.

Rejected pattern:

- Large decorative icon cards added only to balance empty space. This breaks coherence and creates a template-like look.
