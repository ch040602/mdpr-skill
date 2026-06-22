import type { SlideElementIR } from './types';

const FORBIDDEN_VISUAL_FIELDS = new Set(['x', 'y', 'w', 'h', 'color', 'radius', 'shadow', 'variantId', 'effect']);

export function validateSlideElementIR(deck: SlideElementIR): string[] {
  const findings: string[] = [];
  for (const slide of deck.slides) {
    for (const element of slide.elements) {
      for (const key of Object.keys(element as object)) {
        if (FORBIDDEN_VISUAL_FIELDS.has(key)) {
          findings.push(`${slide.id}/${element.id}: forbidden visual field ${key}`);
        }
      }
      if (!element.type || !element.role || !element.importance || !element.contentMetrics) {
        findings.push(`${slide.id}/${element.id}: missing required semantic field`);
      }
    }
  }
  return findings;
}
