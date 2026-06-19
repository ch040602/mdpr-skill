import type { PptThemeSlot, ThemeColorRef } from './rule-engine-types';

export const DEFAULT_THEME_BINDING: Record<string, PptThemeSlot> = {
  background: 'background1',
  surface: 'background1',
  foreground: 'text1',
  muted: 'text2',
  primaryAccent: 'accent1',
  secondaryAccent: 'accent2',
  success: 'accent3',
  warning: 'accent4',
  danger: 'accent5',
  info: 'accent6',
};

export function theme(slot: PptThemeSlot, options: Omit<Extract<ThemeColorRef, { kind: 'pptTheme' }>, 'kind' | 'slot'> = {}): ThemeColorRef {
  return { kind: 'pptTheme', slot, ...options };
}

export function assertNoRawHexInPptx(refs: ThemeColorRef[]): void {
  for (const ref of refs) {
    if (ref.kind === 'fallbackHex' && ref.previewOnly !== true) {
      throw new Error(`Raw hex is not allowed in ppt-theme mode: ${ref.value}`);
    }
  }
}

export function toPptxSchemeColor(ref: ThemeColorRef, pptx: any): any {
  if (ref.kind === 'fallbackHex') {
    throw new Error(`fallbackHex is preview-only and cannot be rendered to PPTX: ${ref.value}`);
  }

  // Implementation should map to the actual PptxGenJS scheme color constant used by design_components/pptx.
  return pptx.SchemeColor[ref.slot];
}
