# MDPR Corpus: Runtime vs Review Evidence

This deck is generated from Markdown files inside the local MDPR checkout.

## Difference at a glance

| Area | MDPR runtime | mdpr-skill review companion |
|---|---|---|
| Role | Markdown to Presentation IR and rendered output | Optional semantic hints, review findings, and evidence |
| Parser | Built-in parser or Pandoc parser mode | Does not parse Markdown; reads MDPR evidence |
| Layout | Owns deterministic layout, typography, and theme rules | Does not set final coordinates, font sizes, or theme values |
| Output | Editable PPTX, HTML, PDF, manifests, and previews | JSON hints, review reports, and comparison evidence |

## Pipeline boundary

Markdown => MDPR parser => BlockIR => Outline Tree => Split Planner => Presentation IR => Layout IR => Renderer

MDPR manifest and previews => mdpr-skill hints or review findings => MDPR remains the only renderer

## Architecture

- Flow
- Package Roles
- Design Principles
- core does not know renderers. It emits Presentation IR only.
- layout owns coordinates, regions, slots, typography, and safe areas.
- Renderers implement target-format output only; they must not redo split or layout decisions.
- Overrides are the final exception layer after automatic planning.

```text
Markdown
  -> Parser (simple Markdown or Pandoc JSON)
  -> Outline Builder
  -> Split Planner
  -> Coherence Grouping
  -> Presentation IR
```

## Page Splitting Rules

- Heading Rules
- cover or section
- slide candidate
- subsection or autosplit boundary
- Procedure
- Parse CommonMark/GFM Markdown into an AST.
- Convert the AST into MDPR BlockIR while preserving presentation-relevant
- Normalize Pandoc JSON into BlockIR when --parser pandoc is selected.
- Build the heading tree.

| Field | Value |
|---|---|
| Element | Default Score |
| Short paragraph | 1 |
| Long paragraph | 2 |
| Bullet item | 1 |

```text
#     cover or section
##    slide candidate
###   subsection or autosplit boundary
####  in-body heading
```

## Layout Selection Rules

- Selection Formula
- Intent Detection
- Count-Based Layouts
- Presets
- Pipeline Diagram Routing
- Use the deck title as the single header.
- Select the first pipeline diagram in source order as the hero object.
- Synthesize one *-teaser-overview bullet list from up to four source sections.
- Keep the first chart, table, and image in source order as proof objects.

| Field | Value |
|---|---|
| Condition | Intent |
| Before/After, As-Is/To-Be, pros/cons, two opposed groups | comparison |
| Dates, stages, phases, repeated steps | timeline |
| Large table | table |

```text
SlideIntentScoreProfile + itemCount + blockType + density
  -> candidate LayoutPresets
  -> deterministic score + bounded recent-geometry reuse penalty
  -> selected LayoutPreset
```

## Rendering Rules

- Shared Renderer Contract
- PPTX Renderer
- Decoration Styles
- Color and Theme Policy
- Surface Policy
- consumes { Presentation IR, Layout IR }
- uses Layout IR slide size, regions, theme fonts, colors, z-order, and overflow policy
- emits editable text boxes for titles, paragraphs, lists, code, and fallback text
- emits native PowerPoint tables for table blocks

```text
{ Presentation IR, Layout IR } -> PPTX
{ Presentation IR, Layout IR } -> HTML
{ Presentation IR, Layout IR } -> PDF
```

## Validation and Overflow Policy

- Validation Checks
- Overflow Resolution Order
- Diagnostics
- Text Normalization
- Title Regions
- text overflow
- table overflow
- missing images
- invalid asset paths

```text
- text overflow
- table overflow
- missing images
- invalid asset paths
- overlapping page numbers
- safe-area violations
```

## Example decks from MDPR

- basic/deck.md covers core flow and expected effects.
- comparison/deck.md exercises before/after content.
- pipeline/deck.md exercises diagram conversion.
- diagram-arrangements/deck.md exercises multiple diagram structures.
- theme-preview decks exercise preset variety.

## Example: examples/basic/deck.md

| Current Approach | Improved Approach |
|---|---|
| Owners manually prepare documents | Meeting notes and report drafts are generated automatically |
| Quality depends on individual skill | Documents follow a consistent structure |
| Search and reuse are difficult | Materials are found with semantic search |

## Example: examples/comparison/deck.md

| Current Approach | Improved Approach |
|---|---|
| Documents are written manually | Drafts are generated automatically |
| Format varies by person | Format is standardized by template |
| Search is difficult | Semantic search is available |

## Example: examples/pipeline/deck.md

- Pipeline Example
- Publishing Flow
- Five-Part Method
  - Capture source
  - Split structure
  - Plan layout
  - Render outputs

## Example: examples/diagram-arrangements/deck.md

- Diagram Arrangement Examples
- Horizontal Flow
- Vertical Flow
- U-Shaped Flow
- Reverse-U Flow
- Cycle-Like Flow

## Example: examples/five-methods/deck.md

- Five-Item Layout Example
- Five Execution Steps
  - Select a pilot team
  - Analyze repetitive document types
  - Design automation templates
  - Build a knowledge search index

## Example: examples/theme-preview-en/deck.md

- MDPR Design Grammar
- Teaser Summary
  - Preview styles: 9 distinct decoration grammars, not palette-only swaps.
  - Pattern range: 36+ decoration and layout patterns selected by content role.
  - Object support: native tables, charts, proof objects, diagrams, images, and icon slots.
  - Validation contract: readable text, bounded objects, aligned connectors, and editable PPTX output.
- Composition Contract
- Pruned Style Families
- Semantic Blocks
- Pipeline Diagram

## Current skill output expectations

- Text-only slides may receive one quiet monotone-icon-aside slot.
- Dense content should stay readable instead of gaining decorative icons.
- Infographic families are selected by text length, relation, item count, and importance.
- Coherence validation checks color role, alignment, object variety, font floor, and z-order.

## End state

> MDPR remains the content and rendering runtime. mdpr-skill adds optional semantic hints, review findings, and evidence without owning final visual decisions.
