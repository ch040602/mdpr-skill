# Profile Authoring Guide

Profiles map Design Components skins to renderer-neutral axes: radius family, shadow family, spacing scale, type scale, surface depth, accent policy, color harmony, and effect policy. Profile selection is deterministic and may be forced by user config.

`colorHarmony` must use one Adobe Color Wheel-style rule: `monochromatic`, `analogous`, `complementary`, `split-complementary`, or `triadic`. Use `monochromatic` for ordered brightness sequences, `analogous` for calm section variation, `complementary` for strong proof or warning contrast, `split-complementary` for one point plus supporting accents, and `triadic` for three peer categories.

`mdpr-skill design import <DESIGN.md>` can propose profile-ready axes through
`mdpr-theme-candidate-v1`. Use its tokens, `styleSystem.decorationFamilies`,
`styleSystem.decorationRules`, `visualLanguage`, `imagePolicy`, and
`registration.targets` as review evidence only; MDPR still owns the final
profile id, theme binding, coherence lock, and design-lock update.

## Visual Language Fields

Theme candidates can now carry explicit theme usage rules inspired by
multi-skill visual-direction systems such as `taste-skill`, but they remain
presentation-theme proposals instead of executable renderer instructions.

Add these optional sections to a `DESIGN.md` when the theme needs stronger
selection guidance:

```markdown
## Visual Language

- archetype: premium-utilitarian-minimalism
- variance: 5
- motion: 3
- density: 3
- Keep hierarchy editorial and calm.

## Theme Usage Rules

- Use for executive strategy and review decks that need quiet authority.
- Avoid for playful launch decks or expressive consumer campaigns.

## Image Policy

- Treat generated images as reference boards or source-provided visuals only.
- Use warm desaturated photography when imagery is required.
- Do not turn generated imagery into a full-slide PPTX renderer.

## Decoration Update Rules

- Downshift decoration on dense slides before changing typography.
- Prefer rule lines, numbered rails, and accent chips over decorative blobs.
```

`visualLanguage.designDials` uses 1-10 values for `variance`, `motion`, and
`density`. MDPR may use those values as profile/rulebook selection evidence
after approval, but mdpr-skill must not convert them into coordinates, exact
recipes, animations, or PowerPoint object choices.
