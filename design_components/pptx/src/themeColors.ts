import type { ThemeColorRef } from '../../../src-scaffolds/rule-engine-types';

export function toPptxSchemeColor(ref: ThemeColorRef) {
  if (ref.kind === 'fallbackHex') {
    throw new Error(`fallbackHex is preview-only and cannot be rendered to PPTX: ${ref.value}`);
  }
  return { schemeColor: ref.slot, transparency: ref.transparency, tint: ref.tint, shade: ref.shade };
}
