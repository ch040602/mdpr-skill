# Design Components

`design_components/` is the project-owned implementation surface for the MDPR x Design Components design system port.

This directory is not a mirror of `external-design-source`. Upstream attribution and license metadata stay in `third_party/design-source/`; adapted runtime concepts, renderer-neutral mappings, and PPTX binding logic live here.

## Structure

- `rule-engine/`: deterministic feature extraction, profile selection, recipe selection, variant selection, and trace ordering.
- `composition/`: layout primitives, region solving, fit constraints, safe area handling, and overflow fallback.
- `decoration/`: typography, surface, radius, border, shadow, accent, effect, and coherence policies.
- `design-source-adapter/`: Design Components token, skin, motion, component, and pattern mappings translated into MDPR renderer-neutral data.
- `pptx/`: editable PowerPoint object planning and theme color binding for Styled Deck IR.

## Visual Diversification Seeds

`design-source-adapter/seeds/visual-diversification-seeds.json` defines reusable color roles and infographic structures for slides that need more than simple theme hue shifts.

The seed pack separates:

- flow colors for reading order and normal arrows;
- accent colors for section identity;
- contrast colors for proof points, warnings, and validation markers;
- support surfaces for warm/cool balance;
- human-made infographic patterns such as proof callouts, editorial annotations, rails, chips, and metric swatches.

These seeds should be selected by deterministic rules and then checked by coherence validation so a slide can become more expressive without mixing arbitrary styles.

`composition/src/infographicPlanner.ts` is the deterministic bridge from content metadata to these seeds. It selects `cycle-loop`, `ordered-rail`, or `ranked-stack` from relation intent, item count, text length, and importance, then returns renderer-neutral slots with emphasis, text scale, and color role.

## PPTX Policy

The target is full Design Components-to-MDPR portability through editable PPTX output:

- text remains PowerPoint text where possible;
- surfaces, cards, badges, buttons, and overlays become editable shapes;
- chart, table, and KPI components keep semantic object plans;
- motion maps to static PPTX/PDF fallbacks and optional HTML behavior;
- z-order is deterministic and validated by rendered PNG comparison;
- colors prefer PowerPoint theme slots over raw hex values.

## Boundary

`third_party/design-source/` is limited to source metadata and license material. Anything used by MDPR at runtime or by renderer validation belongs in this directory.
