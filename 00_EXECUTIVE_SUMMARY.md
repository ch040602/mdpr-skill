# 00. Executive Summary

## Implementation Goal

Add a Design Components based `design-components-rule-based` pipeline around
MDPR. MDPR splits Markdown into slides and slide elements, while the Design
Components layer uses deterministic rules to choose layout, element sizing,
placement, component variants, decoration, and effects.

## Current MDPR Assumption

```text
Markdown
  -> Parser
  -> Outline Builder
  -> Split Planner
  -> Presentation IR
  -> Layout Planner
  -> Layout IR
  -> Override Resolver
  -> QA / Overflow Checker
  -> Renderer
```

The new mode adds a parallel path without breaking the existing runtime:

```text
Markdown
  -> Parser
  -> Outline Builder
  -> Split Planner
  -> Presentation IR
  -> Slide Element IR
  -> Design Components Rule Engine
  -> Styled Deck IR
  -> Renderer
```

## Design Decisions

| Area | Decision |
| --- | --- |
| MDPR responsibility | Element splitting, type/role/importance/density/group inference |
| Design Components responsibility | Visual profile, slide recipe, element variant, composition, decoration, effects |
| Selection model | Deterministic rule-based selector |
| Agent usage | Optional semantic hints only |
| Color | PPT theme slots by default; raw hex is blocked in final style plans |
| Legacy layout | Kept as legacy/simple mode or reduced to fallback utility |
| Debugging | Inspect output exposes features, candidates, reject reasons, and selected recipes |

## Deliverables

1. `packages/element-ir`
2. `design_components/rule-engine`
3. `design_components/composition`
4. `design_components/decoration`
5. Renderer adapter extensions
6. Config schema extensions
7. CLI command and option extensions
8. Style gallery
9. Coherence lint
10. Optional agent hints

## Definition of Done

- One `Slide Element IR` can produce multiple `DeckVisualProfile` outputs.
- `inspect-style` prints selected recipes, variants, and reject reasons.
- PPTX output keeps primary text and shapes editable.
- In `color.mode: ppt-theme`, raw hex does not remain in final PPTX style plans.
- High-density slides automatically suppress expressive effects.
- With agent hints disabled, identical input produces identical output.
- Agents cannot change recipes or variants without rulebook support.
