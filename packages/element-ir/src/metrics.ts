import type { SlideNode } from '../../../src-scaffolds/element-ir-types';

export function summarizeSlideMetrics(slide: SlideNode) {
  return {
    elementCount: slide.elements.length,
    totalTextChars: slide.elements.reduce((sum, element) => sum + (element.contentMetrics.textChars ?? 0), 0),
    tableCells: slide.elements.reduce((sum, element) => sum + ((element.contentMetrics.rowCount ?? 0) * (element.contentMetrics.columnCount ?? 0)), 0),
    codeLines: slide.elements.reduce((sum, element) => sum + (element.contentMetrics.codeLineCount ?? 0), 0),
  };
}
