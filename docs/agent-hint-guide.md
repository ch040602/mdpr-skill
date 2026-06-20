# Agent Hint Guide

Agent hints may suggest semantic intent, grouping, importance, or compact icon-search keywords. They cannot specify recipe IDs, variant IDs, boxes, coordinates, colors, effects, or exact icon asset paths. Builds must remain valid with agents disabled.

For icon hints, use short meaning words rather than asset names:

```text
Good: validation, database, workflow, color palette, chart evidence
Avoid: use icon file X, place Tabler icon Y at coordinates, make it large
```

MDPR owns the final deterministic icon catalog search. The skill can only suggest candidate meaning keywords when the slide semantics are ambiguous.
