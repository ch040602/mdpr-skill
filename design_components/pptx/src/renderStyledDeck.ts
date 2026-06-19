import { renderStyledElementToPptxObject } from './renderStyledElement';

export function renderStyledDeckToPptx(deck: { slides: Array<{ id: string; elements: Array<{ id: string; variantId: string; box: unknown }> }> }) {
  return {
    format: 'pptx-plan',
    editablePrimaryText: true,
    slides: deck.slides.map((slide) => ({
      id: slide.id,
      objects: slide.elements.map(renderStyledElementToPptxObject),
    })),
  };
}
