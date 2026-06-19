# 07. PPT Theme Color Specification

## Goal

사용자가 PowerPoint 안에서 theme colors를 바꾸면 MDPR 출력물의 색상 조합도 같이 바뀌어야 한다.

## Rule

`color.mode: ppt-theme`에서는 최종 PPTX rendering path에 raw hex를 기본 삽입하지 않는다.

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

## Default semantic mapping

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

## Renderer rules

- [x] text color uses `ThemeColorRef`.
- [x] shape fill uses `ThemeColorRef`.
- [x] shape line uses `ThemeColorRef`.
- [x] chart series uses theme slots.
- [x] icon fill/line uses theme slots.
- [x] fallback hex is allowed only for HTML preview or contrast estimation.
- [x] config option `allowRawHexInPptx: true` may exist for debugging, but default is false.

## Lint rules

- [x] `raw-hex-in-pptx-mode` -> error
- [x] `too-many-accents` -> error
- [x] `accent-without-purpose` -> warn
- [x] `low-contrast-theme-slot-pair` -> warn/error depending on strict mode

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
