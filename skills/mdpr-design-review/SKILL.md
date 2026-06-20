# mdpr-design-review

## Purpose

Audit Design Components Styled Deck IR for design coherence violations before rendering or release.

## Checks

- raw hex in ppt-theme mode
- mixed radius family
- mixed shadow family
- mixed spacing scale
- mixed type scale
- excessive accent use
- excessive decorative effects
- dense slide using expressive effects
- repeated layout rhythm
- non-editable PPTX primary text plan

## Output

- JSON findings for CI
- human-readable fix list for developers

## Rule

The skill may explain why a finding exists, but it must not choose new recipes,
variants, coordinates, colors, typography, arrows, z-order, effects, or exact
icon assets. Fixes must be expressed as MDPR rulebook/config changes or
deterministic policy changes.
