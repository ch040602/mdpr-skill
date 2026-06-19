# MDPR Runtime Boundary

## Design Ownership Is Explicit

> The LLM may suggest semantic hints, but MDPR owns every final visual decision.

- Runtime owner: MDPR parses Markdown, splits slides, plans layout, renders editable PPTX, and validates overflow.
- Hint owner: mdpr-skill may suggest intent, grouping, importance, or ambiguity notes.
- Forbidden hints: coordinates, colors, z-order, typography, shape variants, effects, and renderer objects.

## Color System Propagates Through PPTX

```chart
labels: Elements, Tables, Charts, Theme XML
Coverage: 4, 3, 4, 6
Validation: 3, 4, 3, 5
```

| Target | MDPR-owned behavior | Validation signal |
| --- | --- | --- |
| Elements | Apply active design preset and color combination | Accents stay coherent |
| Tables | Use preset header fill, border, and readable minimum font | Cells remain aligned |
| Charts | Render native PowerPoint charts from theme chart tokens | Chart series inherit the active harmony |
| PowerPoint | Write `accent1` through `accent6` into document theme XML | User edits keep palette |

## Table And Text Coherence Is Measured Before Rendering

Markdown with      long spaces and tabs		normalizes before layout validation. Table rows carry validation text, so dense tables are measured instead of treated as empty regions.

## Deterministic Pipeline

Markdown => Presentation IR => optional semantic hints => Layout IR => PPTX theme colors => visual QA

## Practical Outcome

The after version is not an LLM-rendered deck. It is the same MDPR renderer receiving clearer semantic structure, which should produce stronger slide intent, cleaner grouping, and more readable proof objects.
