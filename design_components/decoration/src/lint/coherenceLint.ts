export interface LintFinding { id: string; severity: 'warn' | 'error'; message: string }

export function lintStylePlan(plan: {
  rawHexRefs?: string[];
  radiusFamilies?: string[];
  shadowFamilies?: string[];
  effects?: string[];
  iconSlots?: Array<{
    id: string;
    tone?: string;
    source?: string;
    maxIconCount?: number;
    visualWeight?: string;
    role?: string;
  }>;
}): LintFinding[] {
  const findings: LintFinding[] = [];
  if (plan.rawHexRefs?.length) findings.push({ id: 'raw-hex-in-pptx-mode', severity: 'error', message: 'Use ThemeColorRef in PPT theme mode.' });
  if (new Set(plan.radiusFamilies ?? []).size > 1) findings.push({ id: 'mixed-radius-family', severity: 'error', message: 'Radius family must follow coherence lock.' });
  if (new Set(plan.shadowFamilies ?? []).size > 1) findings.push({ id: 'mixed-shadow-family', severity: 'error', message: 'Shadow family must follow coherence lock.' });
  if ((plan.effects?.length ?? 0) > 3) findings.push({ id: 'excessive-decorative-effects', severity: 'warn', message: 'Effect budget exceeded.' });
  for (const slot of plan.iconSlots ?? []) {
    if (slot.id !== 'monotone-icon-aside') continue;
    if (slot.tone !== 'black' && slot.tone !== 'white') findings.push({ id: 'non-monotone-icon', severity: 'error', message: 'Text-only icon slots must use one black or white tone.' });
    if (slot.source !== 'ppt-builtin-icon' && slot.source !== 'free-svg-icon') findings.push({ id: 'unsupported-icon-source', severity: 'error', message: 'Icon slots must use a PowerPoint built-in icon or a licensed free SVG source.' });
    if ((slot.maxIconCount ?? 0) > 1) findings.push({ id: 'too-many-support-icons', severity: 'warn', message: 'Text-only support slots should use at most one quiet icon.' });
    if (slot.visualWeight && slot.visualWeight !== 'quiet') findings.push({ id: 'overweight-support-icon', severity: 'warn', message: 'Text-only icons should stay quiet and secondary to the text.' });
    if (slot.role === 'primary') findings.push({ id: 'icon-competes-with-content', severity: 'error', message: 'The monotone icon slot is an aside, not the primary content region.' });
  }
  return findings;
}
