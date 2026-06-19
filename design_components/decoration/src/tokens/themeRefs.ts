export type ThemeSlot = 'background1' | 'background2' | 'text1' | 'text2' | 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6';

export interface ThemeColorRef {
  kind: 'pptTheme';
  slot: ThemeSlot;
  transparency?: number;
  tint?: number;
  shade?: number;
}

export const themeRef = (slot: ThemeSlot): ThemeColorRef => ({ kind: 'pptTheme', slot });
