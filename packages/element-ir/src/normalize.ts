import type { SlideElementIR } from './types.js';

export function normalizeSlideElementIR(deck: SlideElementIR): SlideElementIR {
  return {
    ...deck,
    slides: deck.slides.map((slide) => ({
      ...slide,
      readingOrder: slide.readingOrder.length ? slide.readingOrder : slide.elements.map((element) => element.id),
    })),
  };
}
