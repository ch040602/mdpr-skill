# 08. Agent Boundary

## Principle

Agents may be used only for optional reasoning hints. MDPR owns the final
recipe, variant, box, style, effect, icon, arrow, typography, color, z-order,
and renderer decisions through deterministic rules.

## Allowed agent outputs

```ts
type AgentHint = {
  slideId: string;
  possibleIntent?: SlideIntent[];
  possiblePrimaryElementId?: string;
  possibleGroups?: ElementGroup[];
  possibleImportance?: Record<string, 1 | 2 | 3 | 4 | 5>;
  iconKeywordCandidates?: string[];
  rationale?: string;
};
```

## Forbidden agent outputs

- `recipeId`
- `variantId`
- `profileId` as forced value
- `x`, `y`, `w`, `h`
- `fontSize`
- `fontFamily`
- `color`
- `zOrder`
- `radius`
- `shadow`
- `effect`
- `arrow`
- `animation`
- `component`
- exact icon asset path or package-specific icon name

## Validation rules

- [x] agent hint schema rejects forbidden fields.
- [x] agent hint is never trusted directly.
- [x] agent hint can only influence feature extraction inputs.
- [x] deterministic rule selection remains final.
- [x] disabling agent produces valid output.

## Runtime strategy

```ts
const baseSemantics = inferSemanticsDeterministically(slide);
const validatedHint = options.agentHints?.enabled
  ? validateAgentHint(rawHint)
  : undefined;

const semantics = mergeAllowedSemanticHints(baseSemantics, validatedHint);
const features = extractSlideFeatures(semantics);
const selected = selectByRules(features, rulebook, coherenceLock);
```

## Tests

- [x] agent returns `recipeId`: reject.
- [x] agent returns `x/y/w/h`: reject.
- [x] agent returns `color`: reject.
- [x] agent returns possible group: accept if valid.
- [x] agent returns intent candidate: accept only if confidence/validation passes.
- [x] same final features produce same selected recipe.
