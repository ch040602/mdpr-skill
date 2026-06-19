import { renderStyledDeckToHtml } from '../../render-html/src/renderStyledDeck';

export function renderStyledDeckToPdfPlan(deck: Parameters<typeof renderStyledDeckToHtml>[0]) {
  return {
    format: 'pdf-static-plan',
    html: renderStyledDeckToHtml(deck),
    effects: 'static-only',
  };
}
