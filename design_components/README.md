# Design Components

`design_components/` is a reference grammar and proposal workspace for MDPR visual diversification.

This directory is not a mirror of `external-design-source`. Upstream attribution and license metadata stay in `third_party/design-source/`; adapted concepts, renderer-neutral examples, and proposal artifacts live here until they are promoted into MDPR itself.

MDPR owns runtime parsing, layout, theme selection, object geometry, renderer object plans, and final PPTX/HTML/PDF output. mdpr-skill may keep reference seeds, review checks, and proposal grammars here, but these files must not become the final decision engine for slide coordinates, colors, typography, z-order, arrows, exact icons, or renderer objects.

## Structure

- `rule-engine/`: proposal rules and trace examples for deterministic visual grammar selection.
- `composition/`: proposal layout primitives and safety checks used for research artifacts, not MDPR final coordinates.
- `decoration/`: proposal typography, surface, radius, border, shadow, accent, effect, and coherence checks.
- `design-source-adapter/`: Design Components token, skin, motion, component, and pattern mappings translated into reference data.
- `pptx/`: artifact-generation helpers for review decks and examples, not MDPR's production renderer.

## Visual Diversification Seeds

`design-source-adapter/seeds/visual-diversification-seeds.json` defines reusable color roles and infographic structures for slides that need more than simple theme hue shifts.

The seed pack separates:

- flow colors for reading order and normal arrows;
- accent colors for section identity;
- contrast colors for proof points, warnings, and validation markers;
- support surfaces for warm/cool balance;
- Adobe Color Wheel-style harmony rules for `monochromatic`, `analogous`, `complementary`, `split-complementary`, and `triadic` palettes;
- human-made infographic patterns such as proof callouts, editorial annotations, rails, chips, metric swatches, and quiet monotone icon asides.

These seeds should be selected by deterministic rules and then checked by coherence validation so a slide can become more expressive without mixing arbitrary styles.

`composition/src/infographicPlanner.ts` is a proposal bridge from content metadata to these seeds. It selects `cycle-loop`, `ordered-rail`, or `ranked-stack` from relation intent, item count, text length, and importance for review artifacts. When a pattern becomes production behavior, the deterministic selector should move into MDPR.

For slides that contain only text and feel visually flat, `planMonotoneIconSlot()` can reserve one secondary `monotone-icon-aside` region. That region accepts either a PowerPoint built-in icon or a licensed free SVG icon, rendered in black or white only, aligned to the adjacent text block midpoint, and limited to a quiet support role.

## PPTX Policy

The target is full Design Components-to-MDPR portability through editable PPTX output:

- text remains PowerPoint text where possible;
- surfaces, cards, badges, buttons, and overlays become editable shapes;
- chart, table, and KPI components keep semantic object plans;
- motion maps to static PPTX/PDF fallbacks and optional HTML behavior;
- z-order is deterministic and validated by rendered PNG comparison;
- colors prefer PowerPoint theme slots over raw hex values.
- sequence colors use theme-slot tint/base/shade brightness steps before introducing extra hues.

## Boundary

`third_party/design-source/` is limited to source metadata and license material. Anything used by MDPR at runtime belongs in MDPR. mdpr-skill keeps only companion hints, review material, reference grammars, and generated artifacts.
