import type { SlideElementIR } from './element-ir-types';
import type { CoherenceLock, DeckVisualProfile, SelectionTrace, SlideFeatures } from './rule-engine-types';

export interface DesignComponentsSelectionOptions {
  profile?: string;
  rulebookPath?: string;
  strict?: boolean;
  agentHints?: unknown;
}

export interface StyledDeckIR {
  version: '1.0';
  profile: DeckVisualProfile;
  coherenceLock: CoherenceLock;
  slides: StyledSlideIR[];
  traces: SelectionTrace[];
}

export interface StyledSlideIR {
  id: string;
  sourceSlideId: string;
  recipeId: string;
  canvas: {
    background: unknown;
    padding: number;
  };
  elements: StyledElement[];
  effects: unknown[];
}

export interface StyledElement {
  id: string;
  sourceElementId: string;
  variantId: string;
  box: { x: number; y: number; w: number; h: number };
  typography?: unknown;
  surface?: unknown;
  border?: unknown;
  radius?: unknown;
  shadow?: unknown;
  accent?: unknown;
  effect?: unknown[];
}

export function buildStyledDeckIR(
  elementDeck: SlideElementIR,
  options: DesignComponentsSelectionOptions
): StyledDeckIR {
  const rulebook = loadRulebook(options.rulebookPath);
  const deckFeatures = extractDeckFeatures(elementDeck);
  const profile = selectDeckProfile(deckFeatures, rulebook, options.profile);
  const coherenceLock = createCoherenceLock(profile, rulebook);

  const slides: StyledSlideIR[] = [];
  const traces: SelectionTrace[] = [];

  for (const slide of elementDeck.slides) {
    const features = extractSlideFeatures(slide);
    const recipeResult = selectSlideRecipe(features, rulebook, coherenceLock);
    const variantResult = selectElementVariants(slide, features, recipeResult.recipe, rulebook, coherenceLock);
    const composed = composeSlide(slide, recipeResult.recipe, variantResult.variants, coherenceLock);
    const decorated = decorateSlide(composed, coherenceLock);

    slides.push(decorated);
    traces.push({
      slideId: slide.id,
      profileId: profile.id,
      features,
      candidates: recipeResult.candidates,
      selectedRecipeId: recipeResult.recipe.id,
      selectedVariants: variantResult.selectedVariants,
      coherence: coherenceLock,
    });
  }

  const deck: StyledDeckIR = {
    version: '1.0',
    profile,
    coherenceLock,
    slides,
    traces,
  };

  lintStyledDeck(deck, { strict: options.strict ?? false });
  return deck;
}

function loadRulebook(_path?: string): any {
  return {
    recipes: [{ id: 'content.cardStack' }, { id: 'data.kpiRailChart' }, { id: 'code.windowFocus' }],
  };
}

function extractDeckFeatures(deck: SlideElementIR): SlideFeatures[] {
  return deck.slides.map(extractSlideFeatures);
}

function extractSlideFeatures(slide: any): SlideFeatures {
  const elements = slide.elements ?? [];
  const totalTextChars = elements.reduce((sum: number, element: any) => sum + (element.contentMetrics?.textChars ?? 0), 0);
  const tableCellCount = elements.reduce((sum: number, element: any) => sum + ((element.contentMetrics?.rowCount ?? 0) * (element.contentMetrics?.columnCount ?? 0)), 0);
  const codeLineCount = elements.reduce((sum: number, element: any) => sum + (element.contentMetrics?.codeLineCount ?? 0), 0);
  const types = new Set(elements.map((element: any) => element.type));
  return {
    slideIntent: slide.intent,
    density: slide.density,
    elementCount: elements.length,
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
    primaryElementType: elements.find((element: any) => element.role === 'primary')?.type,
    totalTextChars,
    maxTextCharsInOneElement: Math.max(0, ...elements.map((element: any) => element.contentMetrics?.textChars ?? 0)),
    listItemCount: elements.reduce((sum: number, element: any) => sum + (element.contentMetrics?.itemCount ?? 0), 0),
    tableCellCount,
    kpiCount: elements.filter((element: any) => element.type === 'kpi' || element.type === 'metric').length,
    chartCount: elements.filter((element: any) => element.type === 'chart').length,
    codeLineCount,
    visualComplexity: clamp5(types.size),
    informationDensity: clamp5(elements.length + Math.floor(totalTextChars / 500)),
    narrativeWeight: clamp5(Math.floor(totalTextChars / 250) + (types.has('quote') ? 1 : 0)),
    dataWeight: clamp5(tableCellCount > 0 ? 4 : (types.has('chart') || types.has('kpi') ? 3 : 1)),
    overflowRisk: clampOverflow(elements.length + Math.floor(totalTextChars / 700) + Math.floor(codeLineCount / 20)),
  };
}

function selectDeckProfile(features: SlideFeatures[], _rulebook: any, forced?: string): DeckVisualProfile {
  const profile: DeckVisualProfile = {
    id: forced ?? (features.some((item) => item.hasCode) ? 'sharp-technical' : features.some((item) => item.hasChart || item.hasKpi) ? 'friendly-dashboard' : 'layered-product'),
    baseSeed: features.some((item) => item.hasCode) ? 'linear' : 'toss',
    suitableFor: ['cover', 'content', 'data', 'code', 'summary'],
    axes: {
      radiusFamily: forced === 'sharp-technical' ? 'sharp' : 'rounded',
      shadowFamily: forced === 'sharp-technical' ? 'hairline' : 'soft',
      spacingScale: forced === 'sharp-technical' ? 'compact' : 'standard',
      typeScale: forced === 'sharp-technical' ? 'compact-ui' : 'standard',
      surfaceDepth: forced === 'sharp-technical' ? 'flat' : 'card',
      accentPolicy: 'moderate',
      colorHarmony: forced === 'sharp-technical' ? 'monochromatic' : 'analogous',
      effectPolicy: forced === 'sharp-technical' ? 'none' : 'subtle',
    },
  };
  return profile;
}

function createCoherenceLock(profile: DeckVisualProfile, _rulebook: any): CoherenceLock {
  return {
    ...profile.axes,
    profileId: profile.id,
    colorBinding: {
      background: 'background1',
      surface: 'background1',
      foreground: 'text1',
      muted: 'text2',
      primaryAccent: 'accent1',
      secondaryAccent: 'accent2',
      success: 'accent3',
      warning: 'accent4',
      danger: 'accent5',
      info: 'accent6',
    },
  };
}

function selectSlideRecipe(features: SlideFeatures, _rulebook: any, _lock: CoherenceLock): any {
  const id = features.hasCode ? 'code.windowFocus' : features.hasChart || features.hasKpi ? 'data.kpiRailChart' : 'content.cardStack';
  return {
    recipe: { id },
    candidates: [{ recipeId: id, accepted: true, hardRejectReasons: [], scoreBreakdown: { intentFit: 10 }, finalScore: 10 }],
  };
}

function selectElementVariants(slide: any, _features: SlideFeatures, _recipe: any, _rulebook: any, _lock: CoherenceLock): any {
  const selectedVariants = Object.fromEntries((slide.elements ?? []).map((element: any) => [element.id, `${element.type === 'bulletList' ? 'list' : element.type}.compact`]));
  return { variants: selectedVariants, selectedVariants };
}

function composeSlide(slide: any, recipe: any, variants: Record<string, string>, _lock: CoherenceLock): StyledSlideIR {
  const elements = (slide.elements ?? []).map((element: any, index: number) => ({
    id: `styled-${element.id}`,
    sourceElementId: element.id,
    variantId: variants[element.id],
    box: { x: 0.08, y: 0.12 + index * 0.14, w: 0.84, h: 0.1 },
  }));
  return { id: `styled-${slide.id}`, sourceSlideId: slide.id, recipeId: recipe.id, canvas: { background: 'background1', padding: 24 }, elements, effects: [] };
}

function decorateSlide(slide: StyledSlideIR, lock: CoherenceLock): StyledSlideIR {
  return {
    ...slide,
    elements: slide.elements.map((element) => ({
      ...element,
      typography: { color: { kind: 'pptTheme', slot: lock.colorBinding.foreground } },
      radius: lock.radiusFamily,
      shadow: lock.shadowFamily,
    })),
  };
}

function lintStyledDeck(deck: StyledDeckIR, options: { strict: boolean }): void {
  const missingBoxes = deck.slides.flatMap((slide) => slide.elements.filter((element) => !element.box));
  if (missingBoxes.length) throw new Error('StyledDeckIR contains elements without boxes');
  if (options.strict && deck.slides.some((slide) => slide.effects.length > 2)) throw new Error('effect budget exceeded');
}

function clamp5(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, value)) as 1 | 2 | 3 | 4 | 5;
}

function clampOverflow(value: number): 0 | 1 | 2 | 3 | 4 | 5 {
  return Math.max(0, Math.min(5, value)) as 0 | 1 | 2 | 3 | 4 | 5;
}
