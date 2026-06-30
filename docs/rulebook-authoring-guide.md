# Rulebook Authoring Guide

Rulebooks define hard filters, score rules, tie-breaks, and trace fields. Hard filters must reject unsupported element types, high-density hero-only recipes, large tables in non-table-first recipes, long code in non-code recipes, raw hex in PPT theme mode, non-editable PPTX primary text, and effect budget overruns.

When a `mdpr-theme-candidate-v1` includes semantic layout blueprints or
decoration families, treat them as proposal evidence for new rules or profile
coverage. Do not translate them into final coordinates, exact recipe ids,
variant ids, z-order, or renderer object ids. MDPR rulebook changes must still
be deterministic, validated, and usable with all agent hints disabled.
