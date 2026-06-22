import type { SlideElementIR, SlideNode } from '../../element-ir/src/types';
import { computeContentMetrics } from './computeContentMetrics';
import { inferElementType, inferGroups, inferImportance, inferRole, inferSlideIntent } from './inference';

export interface PresentationIR {
  id?: string;
  title?: string;
  ratio?: '16:9' | '4:3';
  slides: Array<{ id: string; title?: string; blocks: Array<{ id: string; kind: string; text?: string; items?: string[]; rows?: unknown[][] }> }>;
}

export function buildSlideElementIR(input: PresentationIR): SlideElementIR {
  const slides: SlideNode[] = input.slides.map((slide) => {
    const elements = slide.blocks.map((block, index) => {
      const type = inferElementType(block);
      return {
        id: block.id,
        type,
        role: inferRole(block, index),
        importance: inferImportance(block, index),
        content: block,
        contentMetrics: computeContentMetrics(block),
        source: { headingPath: slide.title ? [slide.title] : [] },
      };
    });
    return {
      id: slide.id,
      intent: inferSlideIntent(slide),
      density: elements.length > 8 ? 'high' : elements.length > 4 ? 'medium' : 'low',
      elements,
      groups: inferGroups(elements),
      readingOrder: elements.map((element) => element.id),
    };
  });
  return {
    version: '1.0',
    deck: { id: input.id, title: input.title, ratio: input.ratio ?? '16:9' },
    slides,
  };
}
