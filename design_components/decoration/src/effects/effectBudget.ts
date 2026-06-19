export function applyEffectBudget(effects: string[], budget: number, density: 'low' | 'medium' | 'high'): string[] {
  const allowed = density === 'high' ? Math.min(1, budget) : budget;
  return effects.slice(0, Math.max(0, allowed));
}
