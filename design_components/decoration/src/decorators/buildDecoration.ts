import type { CoherenceLock } from '../../../../src-scaffolds/rule-engine-types';
import { themeRef } from '../tokens/themeRefs';

export function buildDecoration(lock: CoherenceLock, elementType: string) {
  return {
    typography: { scale: lock.typeScale, color: themeRef('text1') },
    surface: elementType === 'title' ? 'none' : lock.surfaceDepth,
    border: lock.shadowFamily === 'hairline' ? { width: 1, color: themeRef('text2') } : undefined,
    radius: lock.radiusFamily,
    shadow: lock.shadowFamily,
    accent: lock.accentPolicy === 'scarce' ? undefined : themeRef(lock.colorBinding.primaryAccent),
    effect: lock.effectPolicy === 'none' ? [] : ['static-subtle'],
  };
}
