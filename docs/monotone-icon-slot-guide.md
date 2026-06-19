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

## Visual Rules

- Use one icon only.
- Use black on light backgrounds or white on dark backgrounds.
- Keep the icon quiet: no gradients, multicolor fills, heavy shadow, or decorative container.
- Align the icon center to the adjacent text block midpoint.
- Keep a gutter of at least one body line-height between icon and text.
- The icon region is secondary; it must never replace title, body, evidence, or callout content.

## Recipe Contract

The sample recipe is `content.textWithMonotoneIcon`. It exposes:

```text
body       primary reading region
iconAside  quiet visual support slot
```

The matching variant is `icon.monotoneAside`.

