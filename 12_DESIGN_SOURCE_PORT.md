# 12. Design Components Port Boundary Plan

## Goal

Design Components의 rule, token, skin, motion, component pattern 지식을 MDPR의 presentation renderer-neutral engine으로 옮긴다. 실제 적용 계층은 `design_components/`에 둔다. `third_party/design-source/`는 업스트림 출처와 라이선스 경계만 담당한다.

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

## UPSTREAM.md template

```md
# Design Components Upstream

Source: external-design-source
Imported date: YYYY-MM-DD
Imported ref: <commit-or-tag>
License: MIT
Local adaptation: MDPR renderer-neutral mapping under design_components/
```

## Import scope

### Import

- [x] `reference/DESIGN-LANGUAGE.md`
- [x] `reference/VISUAL-CRAFT.md`
- [x] `tokens/*`
- [x] `motion/*`
- [x] `skins/{toss,stripe,linear,notion,raycast,arc,vercel}`
- [x] pattern/component metadata, not React runtime dependency

### Do not import as runtime dependency

- [x] React component implementation as-is
- [x] Tailwind/shadcn-only assumptions
- [x] Framer Motion runtime into PPTX/PDF path
- [x] hardcoded brand color as final PPTX color

## Mapping layers

```text
Design Components token
  -> Design Components semantic token
  -> MDPR StyleToken
  -> ThemeColorRef / TypographySpec / SurfaceSpec
  -> Renderer-specific object
```

## Motion mapping

| Design Components motion | PPTX | HTML | PDF |
|---|---|---|---|
| spring/silk/snap/float/pulse | static visual equivalent | CSS/motion optional | static |
| reveal-blur | no animation; soft entrance marker optional | CSS blur-in | static |
| glow-pulse | static halo | pulse | static halo |
| confetti-pop | editable accent shapes | particles/CSS | static shapes |
| shimmer | static gradient bar | animated shimmer | static gradient |

## Skin mapping

Skin은 색상값을 직접 쓰는 것이 아니라 visual profile axes로 변환한다.

| Skin | Profile | Axes tendency |
|---|---|---|
| toss | friendly-dashboard | rounded, soft surface, dashboard-friendly |
| stripe | layered-product | layered, professional, subtle depth |
| linear | sharp-technical | compact, hairline, developer-focused |
| notion | editorial-brief | document-like, warm, calm |
| raycast | command-dense | compact, command palette, high density |
| arc | expressive-hero | expressive, rounded, hero-friendly |
| vercel | minimal-system | monochrome, hairline, generous whitespace |
