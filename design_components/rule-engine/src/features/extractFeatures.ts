import type { SlideNode } from '../../../../src-scaffolds/element-ir-types';
import type { SlideFeatures } from '../../../../src-scaffolds/rule-engine-types';

export function extractSlideFeatures(slide: SlideNode): SlideFeatures {
  const totalTextChars = slide.elements.reduce((sum, element) => sum + (element.contentMetrics.textChars ?? 0), 0);
  const tableCellCount = slide.elements.reduce((sum, element) => sum + ((element.contentMetrics.rowCount ?? 0) * (element.contentMetrics.columnCount ?? 0)), 0);
  const codeLineCount = slide.elements.reduce((sum, element) => sum + (element.contentMetrics.codeLineCount ?? 0), 0);
  const types = new Set(slide.elements.map((element) => element.type));
  return {
    slideIntent: slide.intent,
    density: slide.density,
    elementCount: slide.elements.length,
    groupCount: slide.groups?.length ?? 0,
    hasTitle: types.has('title'),
    hasSubtitle: types.has('subtitle'),
    hasChart: types.has('chart'),
    hasTable: types.has('table'),
    hasImage: types.has('image'),
    hasCode: types.has('code'),
    hasKpi: types.has('kpi') || types.has('metric'),
    hasQuote: types.has('quote'),
    hasCallout: types.has('callout'),
    primaryElementType: slide.elements.find((element) => element.role === 'primary')?.type,
    totalTextChars,
    maxTextCharsInOneElement: Math.max(0, ...slide.elements.map((element) => element.contentMetrics.textChars ?? 0)),
    listItemCount: slide.elements.reduce((sum, element) => sum + (element.contentMetrics.itemCount ?? 0), 0),
    tableCellCount,
    kpiCount: slide.elements.filter((element) => element.type === 'kpi' || element.type === 'metric').length,
    chartCount: slide.elements.filter((element) => element.type === 'chart').length,
    codeLineCount,
    visualComplexity: clamp5(types.size),
    informationDensity: clamp5(slide.elements.length + Math.floor(totalTextChars / 500)),
    narrativeWeight: clamp5(Math.floor(totalTextChars / 250) + (types.has('quote') ? 1 : 0)),
    dataWeight: clamp5(tableCellCount > 0 ? 4 : (types.has('chart') || types.has('kpi') ? 3 : 1)),
    overflowRisk: clampOverflow(slide.elements.length + Math.floor(totalTextChars / 700) + Math.floor(codeLineCount / 20)),
  };
}

export function extractElementFeatures(slide: SlideNode) {
  return slide.elements.map((element) => ({
    id: element.id,
    type: element.type,
    importance: element.importance,
    compactPreferred: (element.contentMetrics.textChars ?? 0) > 300 || slide.density === 'high',
  }));
}

function clamp5(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, value)) as 1 | 2 | 3 | 4 | 5;
}

function clampOverflow(value: number): 0 | 1 | 2 | 3 | 4 | 5 {
  return Math.max(0, Math.min(5, value)) as 0 | 1 | 2 | 3 | 4 | 5;
}
