import type { SlideNode } from '../../../src-scaffolds/element-ir-types';
import type { RegionRule } from './primitives/types';

export function solveRegions(slide: SlideNode): RegionRule[] {
  if (slide.intent === 'cover') {
    return [{ id: 'hero', role: 'hero', box: { x: 0.1, y: 0.18, w: 0.8, h: 0.5 }, accepts: ['title', 'subtitle'] }];
  }
  if (slide.intent === 'data') {
    return [
      { id: 'title', role: 'title', box: { x: 0.08, y: 0.06, w: 0.84, h: 0.12 }, accepts: ['title'] },
      { id: 'rail', role: 'metric', box: { x: 0.08, y: 0.22, w: 0.24, h: 0.66 }, accepts: ['kpi', 'metric'] },
      { id: 'main', role: 'evidence', box: { x: 0.36, y: 0.22, w: 0.56, h: 0.66 }, accepts: ['chart', 'table'] },
    ];
  }
  return [
    { id: 'title', role: 'title', box: { x: 0.08, y: 0.06, w: 0.84, h: 0.12 }, accepts: ['title'] },
    { id: 'body', role: 'body', box: { x: 0.08, y: 0.22, w: 0.84, h: 0.66 }, accepts: ['paragraph', 'bulletList', 'numberedList', 'code', 'image', 'callout', 'quote'] },
  ];
}
