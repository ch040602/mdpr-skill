import type { Density, ElementType, SlideIntent } from './element-ir-types';

export interface SlideFeatures {
  slideIntent: SlideIntent;
  density: Density;
  elementCount: number;
  groupCount: number;
  hasTitle: boolean;
  hasSubtitle: boolean;
  hasChart: boolean;
  hasTable: boolean;
  hasImage: boolean;
  hasCode: boolean;
  hasKpi: boolean;
  hasQuote: boolean;
  hasCallout: boolean;
  primaryElementType?: ElementType;
  totalTextChars: number;
  maxTextCharsInOneElement: number;
  listItemCount: number;
  tableCellCount: number;
  kpiCount: number;
  chartCount: number;
  codeLineCount: number;
  visualComplexity: 1 | 2 | 3 | 4 | 5;
  informationDensity: 1 | 2 | 3 | 4 | 5;
  narrativeWeight: 1 | 2 | 3 | 4 | 5;
  dataWeight: 1 | 2 | 3 | 4 | 5;
  overflowRisk: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface DeckVisualProfile {
  id: string;
  baseSeed: 'toss' | 'stripe' | 'linear' | 'notion' | 'raycast' | 'arc' | 'vercel';
  suitableFor: SlideIntent[];
  axes: ProfileAxes;
  allowedRecipes?: string[];
  allowedElementVariants?: string[];
}

export interface ProfileAxes {
  radiusFamily: 'sharp' | 'soft' | 'rounded' | 'pill';
  shadowFamily: 'none' | 'hairline' | 'soft' | 'layered' | 'glow';
  spacingScale: 'compact' | 'standard' | 'generous';
  typeScale: 'compact-ui' | 'standard' | 'editorial' | 'display';
  surfaceDepth: 'flat' | 'card' | 'layered' | 'hero';
  accentPolicy: 'scarce' | 'moderate' | 'expressive';
  effectPolicy: 'none' | 'subtle' | 'standard' | 'expressive';
}

export interface CoherenceLock extends ProfileAxes {
  profileId: string;
  colorBinding: PptThemeBinding;
}

export type PptThemeSlot =
  | 'background1'
  | 'background2'
  | 'text1'
  | 'text2'
  | 'accent1'
  | 'accent2'
  | 'accent3'
  | 'accent4'
  | 'accent5'
  | 'accent6';

export type ThemeColorRef =
  | { kind: 'pptTheme'; slot: PptThemeSlot; transparency?: number; tint?: number; shade?: number }
  | { kind: 'fallbackHex'; value: string; previewOnly: true };

export interface PptThemeBinding {
  background: PptThemeSlot;
  surface: PptThemeSlot;
  foreground: PptThemeSlot;
  muted: PptThemeSlot;
  primaryAccent: PptThemeSlot;
  secondaryAccent: PptThemeSlot;
  success: PptThemeSlot;
  warning: PptThemeSlot;
  danger: PptThemeSlot;
  info: PptThemeSlot;
}

export interface SelectionTrace {
  slideId: string;
  profileId: string;
  features: SlideFeatures;
  candidates: CandidateTrace[];
  selectedRecipeId: string;
  selectedVariants: Record<string, string>;
  coherence: CoherenceLock;
}

export interface CandidateTrace {
  recipeId: string;
  accepted: boolean;
  hardRejectReasons: string[];
  scoreBreakdown: Record<string, number>;
  finalScore: number | null;
}
