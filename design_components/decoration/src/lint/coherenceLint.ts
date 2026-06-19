export interface LintFinding { id: string; severity: 'warn' | 'error'; message: string }

export function lintStylePlan(plan: { rawHexRefs?: string[]; radiusFamilies?: string[]; shadowFamilies?: string[]; effects?: string[] }): LintFinding[] {
  const findings: LintFinding[] = [];
  if (plan.rawHexRefs?.length) findings.push({ id: 'raw-hex-in-pptx-mode', severity: 'error', message: 'Use ThemeColorRef in PPT theme mode.' });
  if (new Set(plan.radiusFamilies ?? []).size > 1) findings.push({ id: 'mixed-radius-family', severity: 'error', message: 'Radius family must follow coherence lock.' });
  if (new Set(plan.shadowFamilies ?? []).size > 1) findings.push({ id: 'mixed-shadow-family', severity: 'error', message: 'Shadow family must follow coherence lock.' });
  if ((plan.effects?.length ?? 0) > 3) findings.push({ id: 'excessive-decorative-effects', severity: 'warn', message: 'Effect budget exceeded.' });
  return findings;
}
