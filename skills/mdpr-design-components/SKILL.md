# mdpr-design-components

## Purpose

Provide optional semantic hints and review guidance around MDPR's built-in design
component runtime. MDPR remains the deterministic presentation engine.

## Responsibilities

- Read MDPR Slide Element IR or Presentation IR as the content contract.
- Suggest compact intent, grouping, importance, and icon-keyword hints when useful.
- Keep hints semantic and schema-valid.
- Explain design review findings in terms of MDPR rulebook/config changes.
- Preserve the ability to build the same deck with all hints disabled.

## Non-goals

- Do not choose recipes, variants, coordinates, shape sizes, typography, colors, z-order, arrows, effects, or exact icon assets.
- Do not add required LLM/API calls to MDPR.
- Do not duplicate MDPR renderer behavior in this skill pack.
- Do not mutate source Markdown content unless the user explicitly asks for a cleaned source draft.

## Commands

```bash
/mdpr-design-components hint deck.md --json
/mdpr-design-components review deck.md --strict
/mdpr-design-components inspect-boundary deck.md
```

## Workflow

1. Build Slide Element IR.
2. Optionally infer semantic hints.
3. Validate hints against `schemas/agent-hint.schema.json`.
4. Pass accepted hints to MDPR as weak semantic inputs.
5. Let MDPR select layouts, themes, objects, colors, typography, arrows, z-order, and renderers.
6. Review generated outputs and report rule/config issues without taking over final design selection.
