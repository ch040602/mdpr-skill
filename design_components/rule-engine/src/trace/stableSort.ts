import type { CandidateTrace } from '../../../../src-scaffolds/rule-engine-types';

export function stableSortByScoreThenId(candidates: CandidateTrace[]): CandidateTrace[] {
  return [...candidates].sort((a, b) => {
    const scoreDelta = (b.finalScore ?? -Infinity) - (a.finalScore ?? -Infinity);
    return scoreDelta || a.recipeId.localeCompare(b.recipeId);
  });
}
