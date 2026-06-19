# 13. Implementation Notes

## Recommended import graph

```text
core -> element-ir
design_components/rule-engine -> element-ir
design_components/composition -> element-ir, design_components/rule-engine
design_components/decoration -> element-ir, design_components/rule-engine, design_components/composition
render-* -> element-ir, design_components/decoration
cli -> all public entrypoints
```

Avoid:

```text
core -> render-*
core -> design_components/*
design_components/rule-engine -> render-*
```

## Data flow implementation sketch

```ts
const presentation = buildPresentationIR(markdown, splitOptions);

if (config.pipeline?.mode !== 'design-components-rule-based') {
  return buildLegacy(presentation, config);
}

const elementDeck = buildSlideElementIR(presentation, config.mdpr);
const features = extractDeckFeatures(elementDeck);
const profile = selectDeckProfile(features, config.designComponents);
const coherenceLock = createCoherenceLock(profile, config.designComponents);
const styledDeck = composeAndDecorateDeck(elementDeck, {
  profile,
  coherenceLock,
  rulebook,
  config,
});

lintStyledDeck(styledDeck, config.designComponents.coherence);
return renderStyledDeck(styledDeck, renderOptions);
```

## Error strategy

- Schema violation: fail early.
- No recipe candidates: fallback to `content.safeStack`, but emit warning.
- Raw hex in PPT theme mode: error in strict, warn in non-strict only if previewOnly.
- Overflow risk: recipe fallback before render.
- Renderer unsupported effect: map to static fallback.

## Determinism checklist

- [x] stable sort everywhere.
- [x] no `Math.random()`.
- [x] no current time in selection logic.
- [x] no agent-generated recipe/variant.
- [x] no nondeterministic object key iteration in scoring.

## Debug checklist

- [x] expose features.
- [x] expose candidate scores.
- [x] expose hard reject reasons.
- [x] expose coherence lock.
- [x] expose final recipe/variants.
- [x] expose raw hex lint result.

## Performance checklist

- [x] feature extraction O(slides × elements).
- [x] recipe candidate scoring bounded by catalog size.
- [x] cache parsed rulebook.
- [x] avoid renderer work during selection.
