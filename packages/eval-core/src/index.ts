export type MdprRunMetrics = {
  overflowCount: number;
  coherenceWarnings: number;
  visualErrors: number;
  buildMs?: number;
};

export type MdprSkillComparison = {
  baseline: MdprRunMetrics;
  skillGuided: MdprRunMetrics;
  regressions: string[];
};

export function compareMdprRuns(baseline: MdprRunMetrics, skillGuided: MdprRunMetrics): MdprSkillComparison {
  const regressions: string[] = [];
  if (skillGuided.overflowCount > baseline.overflowCount) regressions.push("overflowCount increased");
  if (skillGuided.coherenceWarnings > baseline.coherenceWarnings) regressions.push("coherenceWarnings increased");
  if (skillGuided.visualErrors > baseline.visualErrors) regressions.push("visualErrors increased");
  if (baseline.buildMs !== undefined && skillGuided.buildMs !== undefined && skillGuided.buildMs > baseline.buildMs * 1.2) {
    regressions.push("buildMs regressed by more than 20%");
  }
  return { baseline, skillGuided, regressions };
}
