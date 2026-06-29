import type { ElementGroup, ElementNode, ElementRole, ElementType, SlideIntent } from '../../element-ir/src/types.js';

export function inferElementType(block: { kind: string }): ElementType {
  const map: Record<string, ElementType> = {
    heading: 'title',
    paragraph: 'paragraph',
    list: 'bulletList',
    table: 'table',
    chart: 'chart',
    image: 'image',
    code: 'code',
    quote: 'quote',
    callout: 'callout',
    kpi: 'kpi',
  };
  return map[block.kind] ?? 'paragraph';
}

export function inferRole(_block: unknown, index: number): ElementRole {
  return index === 0 ? 'primary' : index < 3 ? 'secondary' : 'supporting';
}

export function inferImportance(_block: unknown, index: number): 1 | 2 | 3 | 4 | 5 {
  return (index === 0 ? 5 : index < 3 ? 4 : 3) as 1 | 2 | 3 | 4 | 5;
}

export function inferSlideIntent(slide: { title?: string; blocks: Array<{ kind: string }> }): SlideIntent {
  if (slide.blocks.some((block) => block.kind === 'code')) return 'code';
  if (slide.blocks.some((block) => block.kind === 'chart' || block.kind === 'table' || block.kind === 'kpi')) return 'data';
  if (/summary|recap|takeaway/i.test(slide.title ?? '')) return 'summary';
  if (/roadmap|timeline/i.test(slide.title ?? '')) return 'timeline';
  return slide.blocks.length <= 2 ? 'cover' : 'content';
}

export function inferGroups(elements: ElementNode[]): ElementGroup[] {
  const metrics = elements.filter((element) => element.type === 'kpi' || element.type === 'metric');
  return metrics.length
    ? [{ id: 'metric-set-1', role: 'metricSet', elementIds: metrics.map((element) => element.id), relation: 'parallel' }]
    : [];
}
