import type { ThemeColorRef, ThemeSlot } from './themeRefs';

export type ColorHarmonyRule = 'monochromatic' | 'analogous' | 'complementary' | 'split-complementary' | 'triadic';

export type ColorPurpose =
  | 'sequence-1'
  | 'sequence-2'
  | 'sequence-3'
  | 'sequence-4'
  | 'emphasis'
  | 'contrast'
  | 'support'
  | 'muted';

export interface HarmonyPlanOptions {
  rule: ColorHarmonyRule;
  baseSlot?: ThemeSlot;
  backgroundSlot?: ThemeSlot;
  textSlot?: ThemeSlot;
  secondarySlot?: ThemeSlot;
  contrastSlot?: ThemeSlot;
  supportSlot?: ThemeSlot;
}

export interface HarmonyColorPlan {
  sourceRule: 'Adobe Color Wheel';
  rule: ColorHarmonyRule;
  base: ThemeColorRef;
  sequence: ThemeColorRef[];
  emphasis: ThemeColorRef;
  contrast: ThemeColorRef;
  support: ThemeColorRef;
  muted: ThemeColorRef;
  usage: Record<ColorPurpose, ThemeColorRef>;
  contrastPolicy: {
    minBodyRatio: 4.5;
    minLargeTextRatio: 3;
    check: 'WCAG contrast ratio before final render';
  };
}

type ColorAdjust = Pick<ThemeColorRef, 'tint' | 'shade' | 'transparency'>;

const pptTheme = (slot: ThemeSlot, adjust: ColorAdjust = {}): ThemeColorRef => ({
  kind: 'pptTheme',
  slot,
  ...adjust,
});

export function buildAdobeHarmonyPlan(options: HarmonyPlanOptions): HarmonyColorPlan {
  const baseSlot = options.baseSlot ?? 'accent1';
  const secondarySlot = options.secondarySlot ?? 'accent2';
  const contrastSlot = options.contrastSlot ?? 'accent4';
  const supportSlot = options.supportSlot ?? options.backgroundSlot ?? 'background2';
  const textSlot = options.textSlot ?? 'text2';

  const base = pptTheme(baseSlot);
  const muted = pptTheme(textSlot, { tint: 20 });
  const support = pptTheme(supportSlot, { tint: 35 });
  const sequence = buildSequence(options.rule, baseSlot, secondarySlot, contrastSlot);
  const emphasis = sequence[Math.min(2, sequence.length - 1)] ?? base;
  const contrast = buildContrast(options.rule, contrastSlot);

  return {
    sourceRule: 'Adobe Color Wheel',
    rule: options.rule,
    base,
    sequence,
    emphasis,
    contrast,
    support,
    muted,
    usage: {
      'sequence-1': sequence[0] ?? base,
      'sequence-2': sequence[1] ?? base,
      'sequence-3': sequence[2] ?? base,
      'sequence-4': sequence[3] ?? base,
      emphasis,
      contrast,
      support,
      muted,
    },
    contrastPolicy: {
      minBodyRatio: 4.5,
      minLargeTextRatio: 3,
      check: 'WCAG contrast ratio before final render',
    },
  };
}

export function colorForPurpose(plan: HarmonyColorPlan, purpose: ColorPurpose): ThemeColorRef {
  return plan.usage[purpose];
}

function buildSequence(rule: ColorHarmonyRule, baseSlot: ThemeSlot, secondarySlot: ThemeSlot, contrastSlot: ThemeSlot): ThemeColorRef[] {
  if (rule === 'monochromatic') {
    return [
      pptTheme(baseSlot, { tint: 45 }),
      pptTheme(baseSlot, { tint: 20 }),
      pptTheme(baseSlot),
      pptTheme(baseSlot, { shade: 18 }),
    ];
  }

  if (rule === 'analogous') {
    return [
      pptTheme(baseSlot, { tint: 28 }),
      pptTheme(baseSlot),
      pptTheme(secondarySlot),
      pptTheme('accent3', { shade: 12 }),
    ];
  }

  if (rule === 'complementary') {
    return [
      pptTheme(baseSlot, { tint: 32 }),
      pptTheme(baseSlot),
      pptTheme(baseSlot, { shade: 16 }),
      pptTheme(contrastSlot),
    ];
  }

  if (rule === 'split-complementary') {
    return [
      pptTheme(baseSlot, { tint: 30 }),
      pptTheme(baseSlot),
      pptTheme('accent5'),
      pptTheme(contrastSlot, { shade: 10 }),
    ];
  }

  return [
    pptTheme(baseSlot, { tint: 24 }),
    pptTheme(baseSlot),
    pptTheme(secondarySlot),
    pptTheme('accent3'),
  ];
}

function buildContrast(rule: ColorHarmonyRule, contrastSlot: ThemeSlot): ThemeColorRef {
  if (rule === 'monochromatic') return pptTheme(contrastSlot, { shade: 8 });
  if (rule === 'analogous') return pptTheme(contrastSlot);
  if (rule === 'triadic') return pptTheme('accent5');
  return pptTheme(contrastSlot);
}
