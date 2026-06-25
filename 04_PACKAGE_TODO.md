# 04. Package TODO

## packages/core

- [x] Add the `PresentationIR -> SlideElementIR` adapter.
- [x] Add element type inference rules.
- [x] Add intent inference rules.
- [x] Add group inference rules.
- [x] Add importance scoring rules.
- [x] Keep `core` independent from renderer and style packages.

## packages/element-ir

- [x] Add `schema.ts`.
- [x] Add `validators.ts`.
- [x] Add `normalize.ts`.
- [x] Add `metrics.ts`.
- [x] Add `fixtures/`.
- [x] Export `schema.json`.

## design_components/rule-engine

- [x] Condition DSL parser and evaluator.
- [x] Profile selector.
- [x] Recipe selector.
- [x] Variant selector.
- [x] Scoring trace.
- [x] Conflict resolver.
- [x] Rulebook loader.

## design_components/composition

- [x] Layout primitives.
- [x] Region solver.
- [x] Safe area utilities.
- [x] Density adaptation.
- [x] Fit and overflow fallback.
- [x] Preserve source element mapping.

## design_components/decoration

- [x] Profile-axis to token-family mapping.
- [x] Typography builder.
- [x] Surface, border, radius, and shadow builder.
- [x] Accent builder.
- [x] Effect mapper.
- [x] Coherence lint.

## design_components/design-source-adapter

- [x] Design Components upstream metadata.
- [x] Token import and mapping.
- [x] Skin fallback mapping.
- [x] Motion keyword mapping.
- [x] Component pattern mapping.

## design_components/pptx

- [x] Add `StyledDeckIR` rendering entry point.
- [x] Add `ThemeColorRef -> pptx scheme color` adapter.
- [x] Map text run styles.
- [x] Map shape styles.
- [x] Map table and chart styles.
- [x] Add editable object smoke tests.

## packages/report-html

- [x] Add `StyledDeckIR` rendering entry point.
- [x] Generate CSS variables.
- [x] Add `data-profile` and `data-recipe` attributes.
- [x] Add optional motion CSS.
- [x] Respect `prefers-reduced-motion`.

## packages/report-pdf

- [x] Reuse the styled HTML path.
- [x] Verify static effect fallbacks.
- [x] Add print snapshots.

## packages/cli

- [x] Style engine options.
- [x] `inspect-style` command.
- [x] `lint-style` command.
- [x] `style-gallery` output handling.
- [x] Define config merge order.

## schemas

- [x] Extend config schema.
- [x] Add Slide Element IR schema.
- [x] Add Styled Deck IR schema.
- [x] Add Rulebook schema.
- [x] Add Agent hint schema.

## tests

- [x] Legacy regression tests.
- [x] Element IR snapshots.
- [x] Feature snapshots.
- [x] Selector tests.
- [x] Composition snapshots.
- [x] Decoration snapshots.
- [x] Renderer smoke tests.
- [x] Gallery tests.
