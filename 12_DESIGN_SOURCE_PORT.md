# 12. Design Components Port Boundary Plan

## Goal

Move Design Components knowledge about rules, tokens, skins, motion, and component patterns into MDPR's renderer-neutral presentation engine. The applied layer lives under `design_components/`. `third_party/design-source/` is limited to upstream provenance and license boundaries.

## Directory

```text
third_party/design-source/
  LICENSE
  UPSTREAM.md

design_components/design-source-adapter/
  port-manifest.json
  reference/
    DESIGN-LANGUAGE.md
    VISUAL-CRAFT.md
  tokens/
    semantic-tokens.json
  motion/
    motion-map.json
  skins/
    arc.json
    linear.json
    notion.json
    raycast.json
    stripe.json
    toss.json
    vercel.json
```

## UPSTREAM.md Template

```md
# Design Components Upstream

Source: external-design-source
Imported date: YYYY-MM-DD
Imported ref: <commit-or-tag>
License: MIT
Local adaptation: MDPR renderer-neutral mapping under design_components/
```

## Import Scope

### Import

- [x] `reference/DESIGN-LANGUAGE.md`
- [x] `reference/VISUAL-CRAFT.md`
- [x] `tokens/*`
- [x] `motion/*`
- [x] `skins/{toss,stripe,linear,notion,raycast,arc,vercel}`
- [x] Pattern and component metadata, not React runtime dependencies.

### Do Not Import as Runtime Dependency

- [x] React component implementation as-is.
- [x] Tailwind/shadcn-only assumptions.
- [x] Framer Motion runtime into the PPTX/PDF path.
- [x] Hardcoded brand color as final PPTX color.

## Mapping Layers

```text
Design Components token
  -> Design Components semantic token
  -> MDPR StyleToken
  -> ThemeColorRef / TypographySpec / SurfaceSpec
  -> Renderer-specific object
```

## Motion Mapping

| Design Components motion | PPTX | HTML | PDF |
|---|---|---|---|
| spring/silk/snap/float/pulse | static visual equivalent | optional CSS/motion | static |
| reveal-blur | no animation; optional soft entrance marker | CSS blur-in | static |
| glow-pulse | static halo | pulse | static halo |
| confetti-pop | editable accent shapes | particles/CSS | static shapes |
| shimmer | static gradient bar | animated shimmer | static gradient |

## Skin Mapping

Skins must not apply raw colors directly. They are converted into visual profile axes.

| Skin | Profile | Axes tendency |
|---|---|---|
| toss | friendly-dashboard | rounded, soft surface, dashboard-friendly |
| stripe | layered-product | layered, professional, subtle depth |
| linear | sharp-technical | compact, hairline, developer-focused |
| notion | editorial-brief | document-like, warm, calm |
| raycast | command-dense | compact, command palette, high density |
| arc | expressive-hero | expressive, rounded, hero-friendly |
| vercel | minimal-system | monochrome, hairline, generous whitespace |
