# MDPR Theme Style and Color Matrix

## Theme Contract

> Decoration style and color seed are separate deterministic choices.

- **Decoration style**
  Controls surface grammar, shadow, density, and object treatment.
- **Color seed**
  Provides the main color; harmony rules derive chart, accent, and PowerPoint theme colors.
- **Visual validation**
  The build manifest records overflow, font floor, region count, and resolved design tokens.

## Pipeline and Object Routing

Markdown Source => Semantic IR => Rule Engine => Styled Deck IR => PPTX Output => Visual Check

- Style selection happens before region surfaces and proof-object rendering.
- Color derivation happens before charts, connectors, and PowerPoint theme slots.
- Text, tables, charts, icons, and connectors stay editable in the PPTX output.

## Numeric Proof Objects

```chart
labels: Parser, Layout, PPTX, Visual QA
Coverage: 91, 88, 94, 86
Change: 14, 22, 31, 18
```

The chart keeps one evidence object as the main proof while labels and theme colors remain coherent.

## Arc Ring Proof

```arc-ring
labels: Validated, Remaining
Coverage: 78, 22
```

Editable arc geometry uses theme accents.

## Table and Text Coherence

| Requirement | Rule | Visual Check |
| --- | --- | --- |
| Shape text | Middle anchor plus readable insets | No text touches a border |
| Table text | Header emphasis and row labels | Cells keep row grammar |
| Bullet markers | Marker and text share a centerline | No low or drifting glyphs |
| Color usage | Harmony palette only | Accent color marks real contrast |

## Decoration Selection Inputs

- **Constraint**
  Long text should use plain-safe or rail layouts instead of decorative cards.
- **Evidence**
  Important proof points may receive a contrast chip, but sibling objects keep one grammar.
- **Image need**
  Image sidecars are reserved only when the source contains or requires an image.
- **Density**
  Dense tables and code blocks reduce decoration before shrinking below the readable font floor.

## Theme Matrix

| Style | Main Color | Harmony | Intended Role |
| --- | --- | --- | --- |
| clean | `#2563EB` | analogous | Minimal blue system for clean operational slides |
| minimalism | `#111827` | monochromatic | Whitespace-first slides with thin rules and restrained emphasis |
| newmorphism | `#4F6F8F` | analogous | Soft UI surfaces using same-tone panels and paired shadows |
| glass | `#8A4FFF` | split-complementary | Translucent proof surfaces with contrast accents |
| clean | `#DC2626` | complementary | Swiss modular grid with restrained red accent |
| data | `#F59E0B` | monochromatic | Dark data-journalism page with dense proof rails |
| technical | `#C2410C` | triadic | Editorial magazine cover/page rhythm |
| executive | `#0F766E` | complementary | Business deck rhythm with a warm opposing accent |
| technical | `#16A34A` | monochromatic | Engineering/validation tone with brightness steps |
| executive | `#E11D48` | complementary | Dark proof deck with high-contrast emphasis |

## Final Checks

- Build writes a design lock for the resolved style/color contract.
- Build writes a manifest with source hash, output list, diagnostics, and optional visual summary.
- Generated PPTX files are exported through PowerPoint to PNG previews for visual comparison.
