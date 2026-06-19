# Design Components

`design_components/` is the project-owned implementation surface for the MDPR x Design Components design system port.

This directory is not a mirror of `external-design-source`. Upstream attribution and license metadata stay in `third_party/design-source/`; adapted runtime concepts, renderer-neutral mappings, and PPTX binding logic live here.

## Structure

- `rule-engine/`: deterministic feature extraction, profile selection, recipe selection, variant selection, and trace ordering.
- `composition/`: layout primitives, region solving, fit constraints, safe area handling, and overflow fallback.
- `decoration/`: typography, surface, radius, border, shadow, accent, effect, and coherence policies.
- `design-source-adapter/`: Design Components token, skin, motion, component, and pattern mappings translated into MDPR renderer-neutral data.
- `pptx/`: editable PowerPoint object planning and theme color binding for Styled Deck IR.

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
