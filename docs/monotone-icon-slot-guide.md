# Monotone Icon Slots

Text-only slides can look unfinished when every object is paragraph or list text. The Design Components layer may open one quiet icon slot for those slides, but only when the icon improves visual anchoring without competing with the content.

## Selection Rule

Use `monotone-icon-aside` only when all of these are true:

- The slide is text-only: no image, chart, table, code block, or KPI object.
- Density is low or medium.
- Text length is large enough to need a visual anchor, but not so large that the icon would steal reading space.
- The selected layout has an aside or corner support region.

Do not use it for chart, image, code, dense table, or already visually rich slides.

## Icon Source

Preferred source:

- PowerPoint built-in icon, inserted as an editable/vector object when the renderer supports it.

Allowed fallback:

- Free SVG icon with a permissive license record and attribution.

The renderer must not use untracked web icons or multicolor icon packs.

## Semantic Search

Icon choice should come from keyword search over the tracked local catalog, not from index rotation alone. Search terms should be derived from the slide title, body text, list labels, table/chart labels, and diagram node labels.

When this repository is used as an MDPR skill, an agent may suggest a few extra meaning keywords for ambiguous slides. Those hints must stay semantic, for example `workflow`, `validation`, `database`, `palette`, or `chart evidence`. MDPR still chooses the final icon through its deterministic catalog scoring.

If the requested icon would need to be large enough to act as the main visual,
or if the metaphor is too ambiguous for a small monotone symbol, the skill should
suggest a `generated-image` visual asset candidate instead of forcing an icon.
That candidate must stay semantic; it must not include a final image path,
coordinates, style recipe, or exact renderer choice.

## Visual Rules

- Use one icon only.
- Use black on light backgrounds or white on dark backgrounds.
- Keep the icon quiet: no gradients, multicolor fills, heavy shadow, or decorative container.
- Keep the icon small. It is a semantic marker, not a large card used to fill empty space.
- Align the icon center to the adjacent text block midpoint.
- If the icon or an `a/b/c` marker is placed inside a circle or rounded badge, the glyph box must be horizontally and vertically centered inside that shape.
- The badge center and adjacent text first-line center must share the same vertical coordinate.
- Keep a gutter of at least one body line-height between icon and text.
- The icon region is secondary; it must never replace title, body, evidence, or callout content.

## Recipe Contract

The sample recipe is `content.textWithMonotoneIcon`. It exposes:

```text
body       primary reading region
iconAside  quiet visual support slot
```

The matching variant is `icon.monotoneAside`.
