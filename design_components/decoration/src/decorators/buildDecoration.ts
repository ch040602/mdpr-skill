import type { CoherenceLock } from '../../../../src-scaffolds/rule-engine-types';
import { buildAdobeHarmonyPlan, colorForPurpose } from '../tokens/colorHarmony';
import { themeRef } from '../tokens/themeRefs';

export function buildDecoration(lock: CoherenceLock, elementType: string) {
  const colorHarmony = buildAdobeHarmonyPlan({
    rule: lock.colorHarmony,
    baseSlot: lock.colorBinding.primaryAccent,
    secondarySlot: lock.colorBinding.secondaryAccent,
    contrastSlot: lock.colorBinding.danger,
    supportSlot: lock.colorBinding.surface,
    textSlot: lock.colorBinding.muted,
  });
  const accentPurpose = elementType === 'callout' || elementType === 'proof' ? 'contrast' : 'emphasis';

  return {
    typography: { scale: lock.typeScale, color: themeRef('text1') },
    surface: elementType === 'title' ? 'none' : lock.surfaceDepth,
    border: lock.shadowFamily === 'hairline' ? { width: 1, color: themeRef('text2') } : undefined,
    radius: lock.radiusFamily,
    shadow: lock.shadowFamily,
    accent: lock.accentPolicy === 'scarce' ? undefined : colorForPurpose(colorHarmony, accentPurpose),
    colorHarmony,
    effect: lock.effectPolicy === 'none' ? [] : ['static-subtle'],
  };
}
