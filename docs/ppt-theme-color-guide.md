# PPT Theme Color Guide

PowerPoint output uses `ThemeColorRef` and scheme slots by default. Fallback hex values are preview-only and rejected in final PPTX style plans unless an explicit debug override is enabled.

## Adobe Color Wheel Harmony Rules

Deck profiles declare a `colorHarmony` axis based on Adobe Color Wheel-style harmony rules: `monochromatic`, `analogous`, `complementary`, `split-complementary`, and `triadic`.

The runtime does not hardcode raw hue values. Theme authors place actual hues into PowerPoint scheme slots, then the Design Components layer selects semantic purposes from those slots:

| Harmony rule | Main use | PPT slot behavior |
| --- | --- | --- |
| `monochromatic` | Ordered depth, progress, ranking, technical UI | Uses the base accent with tint/base/shade brightness steps. |
| `analogous` | Neighboring sections and calm variation | Uses `accent1`, `accent2`, and `accent3` as nearby families. |
| `complementary` | Proof points, warnings, validation markers | Keeps normal flow on the base accent and uses a contrast accent only for deliberate emphasis. |
| `split-complementary` | One strong point with two supporting accent families | Uses the base accent plus two contrast-side accents without turning every object into a different color. |
| `triadic` | Three peer categories with equal visual status | Uses three accent families with matched geometry, typography, and spacing. |

## Brightness Sequence

Sequential expression should come from brightness before additional hues:

```text
accent1 tint 45 -> accent1 tint 20 -> accent1 -> accent1 shade 18
```

Use tint for lower or earlier states, the base color for normal emphasis, and shade for the strongest or current state. This gives ordered pages a clear progression without relying on unrelated colors.

## Contrast

Every foreground/background pair must be checked with WCAG contrast ratio before final render:

- Body text: `4.5:1` or higher.
- Large text: `3:1` or higher.

Contrast accents are scarce. They are allowed for proof points, warnings, validation marks, and editorial interruptions, but should not become default section backgrounds.

## Implementation Contract

`design_components/decoration/src/tokens/colorHarmony.ts` builds the harmony plan from the profile's `colorHarmony` axis and `PptThemeBinding`. The plan returns `ThemeColorRef` objects only, including optional `tint` and `shade`, so PPTX output stays editable and theme-bound.

MDPR core also exposes `DesignTokens.paletteSeed` from the resolved preset. The seed records:

- `sourceModel: adobe-color-wheel`
- the active harmony rule
- the base accent color
- `sequence` colors for tint/base/shade brightness progression
- `contrast` colors for proof, warning, validation, or editorial emphasis
- `chart` colors that must match the generated PowerPoint theme accents

Renderers should choose colors from these resolved slots only. Ordered depth, ranking, and progress use the `sequence` colors; deliberate emphasis uses `contrast` colors sparingly.
