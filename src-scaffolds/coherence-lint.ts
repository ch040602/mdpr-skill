import type { StyledDeckIR } from './selection-pipeline';

export type LintSeverity = 'info' | 'warn' | 'error';

export interface CoherenceFinding {
  id: string;
  severity: LintSeverity;
  slideId?: string;
  elementId?: string;
  message: string;
}

export function lintCoherence(deck: StyledDeckIR): CoherenceFinding[] {
  const findings: CoherenceFinding[] = [];

  findings.push(...lintRawHex(deck));
  findings.push(...lintMixedRadius(deck));
  findings.push(...lintMixedShadow(deck));
  findings.push(...lintEffectBudget(deck));
  findings.push(...lintAccentPolicy(deck));

  return findings;
}

function lintRawHex(_deck: StyledDeckIR): CoherenceFinding[] {
  return [];
}

function lintMixedRadius(_deck: StyledDeckIR): CoherenceFinding[] {
  return [];
}

function lintMixedShadow(_deck: StyledDeckIR): CoherenceFinding[] {
  return [];
}

function lintEffectBudget(_deck: StyledDeckIR): CoherenceFinding[] {
  return [];
}

function lintAccentPolicy(_deck: StyledDeckIR): CoherenceFinding[] {
  return [];
}
