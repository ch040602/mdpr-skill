# MDPR Corpus: Baseline vs Design Components Skill

This deck is generated from Markdown files inside the local MDPR checkout.

## Difference at a glance

| Area | MDPR baseline | Current skill pack |
|---|---|---|
| Role | Markdown to Presentation IR and renderer output | Visual diversification after MDPR content structure |
| Parser | Built-in parser or Pandoc parser mode | Does not parse Markdown; consumes MDPR semantic output |
| Layout | Rule layout and theme presets | Recipe, variant, icon, infographic, coherence, and validation rules |
| PPTX | Editable text, tables, images, diagrams | Editable PPTX with richer component planning and visual QA |

## Source manifest

- README.md: mdpresent (13 headings, 15017 chars)
- docs/00-product-definition.md: 00. Product Definition (6 headings, 1546 chars)
- docs/01-architecture.md: 01. Architecture (4 headings, 3366 chars)
- docs/02-requirements.md: 02. Requirements (12 headings, 3070 chars)
- docs/03-page-splitting.md: 03. Page Splitting Rules (16 headings, 5370 chars)
- docs/04-layout-rules.md: 04. Layout Selection Rules (10 headings, 3787 chars)
- docs/05-overrides-for-llm.md: 05. Override Manifest (9 headings, 4030 chars)
- docs/06-cli-spec.md: 06. CLI Specification (7 headings, 4187 chars)
- docs/07-rendering-rules.md: 07. Rendering Rules (11 headings, 6360 chars)
- docs/08-roadmap.md: 08. Roadmap (10 headings, 3462 chars)
- docs/09-codex-implementation-guide.md: 09. Codex Implementation Guide (8 headings, 1595 chars)
- docs/10-template-and-master-policy.md: 10. PPT Template and Slide Master Policy (8 headings, 1248 chars)
- docs/11-qa-overflow.md: 11. Validation and Overflow Policy (12 headings, 10704 chars)
- docs/references.md: References (8 headings, 756 chars)
- docs/adr/0001-presentation-ir-schema-contract.md: ADR 0001: Presentation IR Schema Contract (5 headings, 1226 chars)
- examples/basic/deck.md: AI Workflow Automation Proposal (10 headings, 1255 chars)
- examples/comparison/deck.md: Comparison Structure Example (4 headings, 307 chars)
- examples/pipeline/deck.md: Pipeline Example (3 headings, 186 chars)
- examples/diagram-arrangements/deck.md: Diagram Arrangement Examples (6 headings, 457 chars)
- examples/five-methods/deck.md: Five-Item Layout Example (2 headings, 200 chars)
- examples/theme-preview-en/deck.md: MDPR Design Grammar (16 headings, 4905 chars)

## Pipeline boundary

Markdown => MDPR parser => BlockIR => Outline Tree => Split Planner => Presentation IR => Layout IR => Renderer

Presentation IR => Slide Element IR => Feature Extractor => Design Components Rule Engine => Styled Deck IR => Editable PPTX

## Parser and splitting topics

## 01. Architecture

- 01. Architecture
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

## 03. Page Splitting Rules

- 03. Page Splitting Rules
- Heading Rules
- cover or section
- slide candidate
- subsection or autosplit boundary
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

## 04. Layout Selection Rules

- 04. Layout Selection Rules
- Selection Formula
- Intent Detection
- Count-Based Layouts
- Presets
- id: footer

| Field | Value |
|---|---|
| Condition | Intent |
| Before/After, As-Is/To-Be, pros/cons, two opposed groups | comparison |
| Dates, stages, phases, repeated steps | timeline |
| Large table | table |

```text
SlideIntentScoreProfile + itemCount + blockType + density
  -> candidate LayoutPresets
  -> deterministic score
  -> selected LayoutPreset
```

## 07. Rendering Rules

- 07. Rendering Rules
- Shared Renderer Contract
- PPTX Renderer
- Decoration Styles
- Color and Theme Policy
- consumes { Presentation IR, Layout IR }
- uses Layout IR slide size, regions, theme fonts, colors, z-order, and overflow policy
- emits editable text boxes for titles, paragraphs, lists, code, and fallback text
- emits native PowerPoint tables for table blocks

```text
{ Presentation IR, Layout IR } -> PPTX
{ Presentation IR, Layout IR } -> HTML
{ Presentation IR, Layout IR } -> PDF
```

## 11. Validation and Overflow Policy

- 11. Validation and Overflow Policy
- Validation Checks
- Overflow Resolution Order
- Diagnostics
- Text Normalization
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

- AI Workflow Automation Proposal
- Problem Definition
- Repetitive Work Is Growing
- Search Costs Are Growing
- Current Approach and Improved Approach
- Current Approach
- Meeting note cleanup
- Report draft writing
- Data collection
- Source location is unclear

## Example: examples/comparison/deck.md

- Comparison Structure Example
- Current Approach and Improved Approach
- Current Approach
- Improved Approach
- Documents are written manually
- Format varies by person
- Search is difficult
- Drafts are generated automatically

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
- Composition Contract
- Pruned Style Families
- Semantic Blocks
- Pipeline Diagram
- Preview styles: 5 pruned decoration grammars, not palette-only swaps.
- Pattern range: 36+ decoration and layout patterns selected by content role.
- Object support: native tables, charts, proof objects, diagrams, images, and icon slots.
- QA contract: readable text, bounded objects, aligned connectors, and editable PPTX output.

## Current skill output expectations

- Text-only slides may receive one quiet monotone-icon-aside slot.
- Dense content should stay readable instead of gaining decorative icons.
- Infographic families are selected by text length, relation, item count, and importance.
- Coherence validation checks color role, alignment, object variety, font floor, and z-order.

## End state

> MDPR remains the content and rendering runtime. The current skill pack adds deterministic visual decisions after MDPR has produced semantic structure.
