# 07. PPT Theme Color Specification

## Goal

When a user changes theme colors inside PowerPoint, MDPR output should follow the same color system.

## Rule

In `color.mode: ppt-theme`, the final PPTX rendering path must not insert raw hex colors by default.

## ThemeColorRef

```ts
type ThemeColorRef =
  | {
      kind: 'pptTheme';
      slot: PptThemeSlot;
      transparency?: number;
      tint?: number;
      shade?: number;
    }
  | {
      kind: 'fallbackHex';
      value: string;
      previewOnly: true;
    };

type PptThemeSlot =
  | 'background1'
  | 'background2'
  | 'text1'
  | 'text2'
  | 'accent1'
  | 'accent2'
  | 'accent3'
  | 'accent4'
  | 'accent5'
  | 'accent6';
```

## Default Semantic Mapping

| Semantic token | PPT theme slot | Usage |
|---|---|---|
| background | background1 | slide/page background |
| surface | background1/background2 | card/panel fill |
| text.primary | text1 | title/body |
| text.secondary | text2 | captions/meta |
| accent.primary | accent1 | main emphasis |
| accent.secondary | accent2 | secondary emphasis |
| success | accent3 | positive state |
| warning | accent4 | warning state |
| danger | accent5 | destructive state |
| info | accent6 | information/chart state |

## Renderer Rules

- [x] Text color uses `ThemeColorRef`.
- [x] Shape fill uses `ThemeColorRef`.
- [x] Shape line uses `ThemeColorRef`.
- [x] Chart series use theme slots.
- [x] Icon fill/line uses theme slots.
- [x] Fallback hex is allowed only for HTML preview or contrast estimation.
- [x] `allowRawHexInPptx: true` may exist for debugging, but the default is false.

## Lint Rules

- [x] `raw-hex-in-pptx-mode` -> error
- [x] `too-many-accents` -> error
- [x] `accent-without-purpose` -> warning
- [x] `low-contrast-theme-slot-pair` -> warning or error depending on strict mode

## Example

```yaml
designComponents:
  color:
    mode: ppt-theme
    allowRawHexInPptx: false
    themeBinding:
      background: background1
      surface: background1
      foreground: text1
      muted: text2
      primaryAccent: accent1
      secondaryAccent: accent2
      success: accent3
      warning: accent4
      danger: accent5
      info: accent6
```
