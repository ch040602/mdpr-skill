# Profile Authoring Guide

Profiles map Design Components skins to renderer-neutral axes: radius family, shadow family, spacing scale, type scale, surface depth, accent policy, color harmony, and effect policy. Profile selection is deterministic and may be forced by user config.

`colorHarmony` must use one Adobe Color Wheel-style rule: `monochromatic`, `analogous`, `complementary`, `split-complementary`, or `triadic`. Use `monochromatic` for ordered brightness sequences, `analogous` for calm section variation, `complementary` for strong proof or warning contrast, `split-complementary` for one point plus supporting accents, and `triadic` for three peer categories.

`mdpr-skill design import <DESIGN.md>` can propose profile-ready axes through
`mdpr-theme-candidate-v1`. Use its tokens, `styleSystem.decorationFamilies`,
and `registration.targets` as review evidence only; MDPR still owns the final
profile id, theme binding, coherence lock, and design-lock update.
