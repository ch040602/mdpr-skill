# Rulebook Authoring Guide

Rulebooks define hard filters, score rules, tie-breaks, and trace fields. Hard filters must reject unsupported element types, high-density hero-only recipes, large tables in non-table-first recipes, long code in non-code recipes, raw hex in PPT theme mode, non-editable PPTX primary text, and effect budget overruns.

When a `mdpr-theme-candidate-v1` includes semantic layout blueprints or
decoration families, treat them as proposal evidence for new rules or profile
coverage. Do not translate them into final coordinates, exact recipe ids,
variant ids, z-order, or renderer object ids. MDPR rulebook changes must still
be deterministic, validated, and usable with all agent hints disabled.

## Theme Usage And Decoration Updates

Theme candidates may include `visualLanguage`, `imagePolicy`, and
`styleSystem.decorationRules` so reviewers can explain when a theme should be
used and how its imagery or ornament should be updated.

- `visualLanguage.archetype` names the design language, such as
  `premium-utilitarian-minimalism`, `industrial-brutalist`, or
  `soft-structural-premium`.
- `visualLanguage.designDials` records bounded 1-10 guidance for variance,
  motion, and density. Rulebooks may use these as deterministic scoring inputs
  only after MDPR import approval.
- `visualLanguage.themeUsageRules` and `antiPatterns` guide profile selection
  and theme rejection, not final slide geometry.
- `imagePolicy.generatedAssetBoundary` must stay
  `semantic-reference-only`. Generated images can be reference boards, source
  visuals, or semantic asset candidates, but not a replacement full-slide
  renderer.
- `styleSystem.decorationRules` should describe how to downshift, swap, or
  constrain ornament. It must prefer readability and editability over visual
  novelty.

When a rulebook imports these fields, keep the rule order narrative-first:
audience and purpose, slide role, content density, object form, layout family,
theme surface, then decoration intensity. Reject theme-first changes that add
image treatment, glass, texture, or card ornament before content role and
density have been evaluated.
