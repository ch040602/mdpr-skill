# MDPR Visual Diversity Integration

MDPR now owns the deterministic visual layer that used to live in the prototype skill renderer.

## Responsibility Boundary

- MDPR: parser, slide splitting, layout selection, editable PowerPoint rendering, theme colors, charts, tables, diagrams, and text fit.
- Skill: optional agent hints that describe emphasis, importance, and likely visual intent before MDPR makes deterministic choices.
- Validation: PowerPoint export, PNG previews, minimum font checks, and shape-level inspection.
- Output: one Markdown source can produce coherent PPTX and HTML without a separate handmade renderer.

## Pipeline After Integration

Markdown and Pandoc AST -> Presentation IR -> Layout IR -> PowerPoint Renderer -> Visual Validation

The same deterministic path decides whether arrows connect parent groups or child nodes, keeps same-role arrows consistent, and preserves editable PowerPoint objects.

## Chart And Table Coherence

```chart
labels: Core, Layout, PPTX, Skill
Rules: 18, 14, 22, 5
Visual Assets: 3, 4, 9, 2
Validation Checks: 7, 9, 13, 4
```

| Area | MDPR-owned behavior | Skill-owned behavior |
| --- | --- | --- |
| Theme | Adobe-style color combination and PPT theme colors | Suggest emphasis only |
| Chart | Native editable PowerPoint chart | Provide data importance hints |
| Table | Middle vertical alignment and compact text | Identify comparison intent |
| Layout | No chart/table split across slides | Warn about visual density |

## Text Only Relief

Long text-only slides should not become plain prose walls. MDPR can add a restrained black or white icon aside, keep it secondary, and preserve enough breathing room around the copy. The icon is decorative, the text remains editable, and the minimum readable font size is still enforced by the renderer.

## Visual Rules

- Parent labels use font sizes greater than or equal to child labels.
- Text boxes use internal alignment and margins so text does not visually drift inside a shape.
- Bullets and small lead symbols are vertically centered against their text.
- Shadows, accent rules, and card surfaces are applied by PPT-compatible renderer rules.

## Design Components

- Native charts for quantitative summaries.
- Tables for exact comparisons.
- Pipeline diagrams for ordered process and responsibility flow.
- Item cards for compact rule sets.
- Monotone icons only when a text-only slide needs a quiet visual anchor.

## Validation Summary

The generated deck should contain editable text boxes, native charts, table objects, diagram shapes, icon-aside decoration, and consistent theme colors. The PNG preview is exported from Microsoft PowerPoint so visual validation checks actual PPT rendering, not only XML structure.
