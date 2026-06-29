import { buildCssVariables } from "./cssVariables.js";
import { buildMotionCss } from "./motionCss.js";

export function renderStyledDeckReportHtml(deck: { profile: { id: string }; slides: Array<{ id: string; recipeId: string; elements: Array<{ id: string; variantId: string }> }> }) {
  const slides = deck.slides.map((slide) => `<section data-recipe="${slide.recipeId}" id="${slide.id}">${slide.elements.map((element) => `<div data-variant="${element.variantId}" id="${element.id}"></div>`).join("")}</section>`).join("");
  return `<style>${buildCssVariables(deck.profile.id)}${buildMotionCss(true)}</style>${slides}`;
}
