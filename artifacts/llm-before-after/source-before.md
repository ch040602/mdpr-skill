# MDPR Runtime Boundary

## Runtime Scope

MDPR is responsible for Markdown parsing, slide splitting, layout planning, rendering, and validation. The skill pack can help an agent reason about intent, but it must not decide coordinates, colors, z-order, typography, or renderer objects. The same source contains several ideas in one place: design ownership, color combinations, table coherence, and PowerPoint output.

## Design Notes

Color combinations should reach shapes, tables, future chart tokens, and the PowerPoint document theme. Markdown tables should not skip overflow checks. Text with      long spaces or tabs		should be normalized before measurement and rendering so line breaks do not appear in the middle of an element.

| Area | Risk | Expected behavior |
| --- | --- | --- |
| Theme | Colors diverge | Derive theme accents from MDPR config |
| Table | Cells wrap badly | Normalize cell text and enforce minimum font |
| PPTX | User edits lose palette | Write document theme colors |

## Validation Flow

Source markdown => MDPR parser => Presentation IR => Layout IR => PPTX renderer => visual QA.

## Result

The useful outcome is a deterministic runtime where optional agent hints only improve semantic grouping. MDPR remains the source of truth for visual output.
