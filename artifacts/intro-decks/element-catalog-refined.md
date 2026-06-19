# MDPR Slide Element Catalog

## Text Blocks

- Cover title
- Section title
- Paragraph body
- Ordered list
- Unordered list
- Quote emphasis
- Code block

## Tables

| Element | PPTX object | Coherence rule |
| --- | --- | --- |
| Header row | Native table text | bold and readable |
| Numeric cell | Native table text | right aligned |
| Long label | Native table text | trimmed spacing |
| Body cell | Native table text | stable minimum font |

## Native Chart

```chart
labels: Parser, Layout, Renderer
Coverage: 91, 87, 94
```

## Chart Beside Prose

The explanation remains beside the graph. This is the MDPR-owned numeric storytelling layout for short interpretation text plus quantitative evidence.

```chart
labels: Baseline, Refined, Validated
Score: 61, 84, 93
```

## Gauge Proof Object

```chart
kind: gauge
labels: Readiness
Score: 83
```

## Arc Ring Proof Object

```arc-ring
labels: Validated, Remaining
Coverage: 72, 28
```

## Connected Strip Proof Object

```connected-strip
Draft, 20
Render, 68
Validate, 92
```

## Image Slot

- Image-aware layouts keep body text and image objects in separate regions.
- The renderer must preserve aspect ratio and avoid covering text.
- The catalog keeps the icon/image role restrained rather than filling blank space.
