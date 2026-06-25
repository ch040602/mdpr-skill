# 05. Rule Engine Specification

## Selection Sequence

```text
1. Extract features.
2. Select or lock the deck visual profile.
3. Build candidate slide recipe set.
4. Apply hard reject rules.
5. Score remaining recipes.
6. Apply coherence penalty.
7. Apply diversity penalty.
8. Apply deterministic tie-break.
9. Select element variants inside the selected recipe.
10. Resolve conflicts.
11. Emit selection trace.
```

## Rule Priority

```text
P0 Renderer capability
P1 Accessibility and readability
P2 PPT theme color and editable object constraints
P3 Content fit and overflow
P4 Slide purpose
P5 Element role and importance
P6 Deck coherence lock
P7 Density adaptation
P8 Diversity scheduler
P9 Seed/profile-specific preference
P10 Stable tie-breaker
```

## Hard Rejects

- [x] Unsupported element type.
- [x] High density with a hero-only recipe.
- [x] Large table with a non-table-first recipe.
- [x] Long code with a non-code recipe.
- [x] Text-heavy slide with an expressive decorative recipe.
- [x] Raw hex color in PPT theme mode.
- [x] Non-editable primary text in PPTX.
- [x] Effect budget exceeded without downshift.

## Scoring Formula

```text
score =
  intentFit * 30
  + elementFit * 25
  + densityFit * 20
  + sizeFit * 15
  + purposeFit * 15
  + profileFit * 15
  + rhythmFit * 10
  - overflowRisk * 30
  - coherencePenalty * 40
  - repetitionPenalty * 10
```

## Deterministic Tie-Break

Tie handling must not use randomness.

```ts
sortBy([
  'hardReject asc',
  'score desc',
  'overflowRisk asc',
  'priority desc',
  'stableRecipeOrder asc',
  'stableHash(deckId + slideId + recipeId + profileId) asc'
]);
```

## Diversity Scheduler

Diversity is handled with repetition penalties, not randomness.

```yaml
diversity:
  avoidSameLayoutKindInLast: 3
  avoidSameAccentPositionInLast: 2
  allowExpressiveOnlyFor:
    - cover
    - section
    - summary
  maxDecorativeEffectsPerSlide: 2
```

## Selection Trace Shape

```ts
type SelectionTrace = {
  slideId: string;
  profileId: string;
  features: SlideFeatures;
  candidates: CandidateTrace[];
  selectedRecipeId: string;
  selectedVariants: Record<string, string>;
  coherence: CoherenceLock;
};

type CandidateTrace = {
  recipeId: string;
  accepted: boolean;
  hardRejectReasons: string[];
  scoreBreakdown: Record<string, number>;
  finalScore: number;
};
```

## Rule DSL Examples

```yaml
recipes:
  data.kpiRailChart:
    priority: 90
    accept:
      all:
        - slide.intent: data
        - hasChart: true
        - kpiCount:
            min: 2
            max: 4
    reject:
      any:
        - density: high
        - totalTextChars:
            gt: 700
        - chartCount:
            gt: 1
    score:
      intentFit: 30
      elementFit:
        hasChart: 15
        hasKpi: 15
      densityFit:
        low: 8
        medium: 20
        high: -30
```
