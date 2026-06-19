# 05. Rule Engine Specification

## Selection sequence

```text
1. Extract features
2. Select or lock deck visual profile
3. Build candidate slide recipe set
4. Apply hard reject rules
5. Score remaining recipes
6. Apply coherence penalty
7. Apply diversity penalty
8. Deterministic tie-break
9. Select element variants inside selected recipe
10. Resolve conflicts
11. Emit selection trace
```

## Rule priority

```text
P0 Renderer capability
P1 Accessibility / readability
P2 PPT theme color / editable object constraint
P3 Content fit / overflow
P4 Slide purpose
P5 Element role / importance
P6 Deck coherence lock
P7 Density adaptation
P8 Diversity scheduler
P9 Seed/profile-specific preference
P10 Stable tie-breaker
```

## Hard rejects

- [x] unsupported element type
- [x] high density + hero-only recipe
- [x] large table + non-table-first recipe
- [x] long code + non-code recipe
- [x] text-heavy slide + decorative expressive recipe
- [x] raw hex in PPT theme mode
- [x] non-editable primary text in PPTX
- [x] effect budget exceeded without downshift

## Scoring formula

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

## Deterministic tie-break

동점 처리에는 random을 쓰지 않는다.

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

## Diversity scheduler

다양화는 무작위가 아니라 repetition penalty로 처리한다.

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

## Selection trace shape

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

## Rule DSL examples

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
