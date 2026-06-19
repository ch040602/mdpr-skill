# mdpr-design-components

## Purpose

Convert MDPR Slide Element IR into Design Components Styled Deck IR using deterministic rule-based selection.

## Responsibilities

- Use MDPR only as an element splitter.
- Select deck visual profile by rules.
- Select slide recipes by rules.
- Select element variants by rules.
- Compose layout and element sizes by rules.
- Apply Design Components decoration and coherence lock.
- Bind colors to PPT theme slots.
- Emit inspect traces.

## Non-goals

- Do not let agent choose recipe/variant.
- Do not generate hardcoded PPTX colors in ppt-theme mode.
- Do not flatten text to images.
- Do not mutate source Markdown content.

## Commands

```bash
/mdpr-design-components apply deck.md --profile layered-product
/mdpr-design-components gallery deck.md --profiles friendly-dashboard,sharp-technical,minimal-system
/mdpr-design-components inspect deck.md --json
/mdpr-design-components lint deck.md --strict
```

## Workflow

1. Build Slide Element IR.
2. Extract features.
3. Load rulebook.
4. Resolve profile/coherence lock.
5. Select recipes.
6. Select variants.
7. Compose slide boxes.
8. Decorate elements.
9. Lint coherence.
10. Render or emit StyledDeckIR.
