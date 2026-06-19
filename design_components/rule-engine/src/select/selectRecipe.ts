import type { CandidateTrace, CoherenceLock, SlideFeatures } from '../../../../src-scaffolds/rule-engine-types';
import { evaluateCondition } from '../rules/evaluateCondition';
import { stableSortByScoreThenId } from '../trace/stableSort';

export interface SlideRecipe {
  id: string;
  intent: string;
  supports: string[];
  hardReject: string[];
  score: Record<string, number>;
  effectBudget: number;
}

export const RECIPE_CATALOG: SlideRecipe[] = [
  { id: 'cover.heroMinimal', intent: 'cover', supports: ['title', 'subtitle'], hardReject: ['highDensity'], score: { cover: 10 }, effectBudget: 1 },
  { id: 'content.cardStack', intent: 'content', supports: ['title', 'paragraph', 'bulletList'], hardReject: [], score: { content: 8 }, effectBudget: 1 },
  { id: 'data.kpiRailChart', intent: 'data', supports: ['title', 'kpi', 'chart'], hardReject: [], score: { hasChart: 8, hasKpi: 6 }, effectBudget: 1 },
  { id: 'data.tableWithInsight', intent: 'data', supports: ['title', 'table', 'callout'], hardReject: [], score: { hasTable: 9 }, effectBudget: 0 },
  { id: 'code.windowFocus', intent: 'code', supports: ['title', 'code'], hardReject: [], score: { hasCode: 10 }, effectBudget: 0 },
  { id: 'summary.keyTakeaways', intent: 'summary', supports: ['title', 'bulletList'], hardReject: [], score: { summary: 8 }, effectBudget: 1 },
];

export function selectSlideRecipe(features: SlideFeatures, _lock: CoherenceLock, catalog = RECIPE_CATALOG) {
  if (!catalog.length) throw new Error('rulebook recipe catalog is empty');
  const candidates: CandidateTrace[] = catalog.map((recipe) => {
    const hardRejectReasons = recipe.hardReject.filter((condition) => evaluateCondition(condition, features));
    const scoreBreakdown = Object.fromEntries(Object.entries(recipe.score).map(([condition, score]) => [condition, conditionMatches(condition, features) ? score : 0]));
    const finalScore = hardRejectReasons.length ? null : Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);
    return { recipeId: recipe.id, accepted: hardRejectReasons.length === 0, hardRejectReasons, scoreBreakdown, finalScore };
  });
  const winner = stableSortByScoreThenId(candidates.filter((candidate) => candidate.accepted))[0];
  if (!winner) throw new Error('no acceptable recipe');
  return { recipe: catalog.find((recipe) => recipe.id === winner.recipeId)!, candidates };
}

function conditionMatches(condition: string, features: SlideFeatures): boolean {
  if (condition === features.slideIntent) return true;
  return evaluateCondition(condition, features);
}
