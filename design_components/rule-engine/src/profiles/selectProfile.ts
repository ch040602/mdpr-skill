import type { DeckVisualProfile, SlideFeatures } from '../../../../src-scaffolds/rule-engine-types';

export const PROFILE_CATALOG: DeckVisualProfile[] = [
  { id: 'friendly-dashboard', baseSeed: 'toss', suitableFor: ['data', 'summary', 'content'], axes: { radiusFamily: 'rounded', shadowFamily: 'soft', spacingScale: 'standard', typeScale: 'standard', surfaceDepth: 'card', accentPolicy: 'moderate', effectPolicy: 'subtle' } },
  { id: 'layered-product', baseSeed: 'stripe', suitableFor: ['cover', 'content', 'comparison'], axes: { radiusFamily: 'soft', shadowFamily: 'layered', spacingScale: 'generous', typeScale: 'display', surfaceDepth: 'layered', accentPolicy: 'moderate', effectPolicy: 'standard' } },
  { id: 'sharp-technical', baseSeed: 'linear', suitableFor: ['code', 'data', 'process'], axes: { radiusFamily: 'sharp', shadowFamily: 'hairline', spacingScale: 'compact', typeScale: 'compact-ui', surfaceDepth: 'flat', accentPolicy: 'scarce', effectPolicy: 'none' } },
  { id: 'editorial-brief', baseSeed: 'notion', suitableFor: ['content', 'summary', 'section'], axes: { radiusFamily: 'soft', shadowFamily: 'none', spacingScale: 'generous', typeScale: 'editorial', surfaceDepth: 'flat', accentPolicy: 'scarce', effectPolicy: 'subtle' } },
  { id: 'command-dense', baseSeed: 'raycast', suitableFor: ['code', 'process', 'appendix'], axes: { radiusFamily: 'soft', shadowFamily: 'hairline', spacingScale: 'compact', typeScale: 'compact-ui', surfaceDepth: 'card', accentPolicy: 'moderate', effectPolicy: 'subtle' } },
  { id: 'expressive-hero', baseSeed: 'arc', suitableFor: ['cover', 'section'], axes: { radiusFamily: 'rounded', shadowFamily: 'glow', spacingScale: 'generous', typeScale: 'display', surfaceDepth: 'hero', accentPolicy: 'expressive', effectPolicy: 'expressive' } },
  { id: 'minimal-system', baseSeed: 'vercel', suitableFor: ['content', 'code', 'summary'], axes: { radiusFamily: 'sharp', shadowFamily: 'none', spacingScale: 'standard', typeScale: 'standard', surfaceDepth: 'flat', accentPolicy: 'scarce', effectPolicy: 'none' } }
];

export function selectDeckProfile(features: SlideFeatures[], forced?: string): DeckVisualProfile {
  if (forced) return PROFILE_CATALOG.find((profile) => profile.id === forced) ?? PROFILE_CATALOG[0];
  const hasCode = features.some((feature) => feature.hasCode);
  const hasData = features.some((feature) => feature.hasChart || feature.hasKpi || feature.hasTable);
  if (hasCode) return PROFILE_CATALOG.find((profile) => profile.id === 'sharp-technical')!;
  if (hasData) return PROFILE_CATALOG.find((profile) => profile.id === 'friendly-dashboard')!;
  return PROFILE_CATALOG.find((profile) => profile.id === 'layered-product')!;
}
