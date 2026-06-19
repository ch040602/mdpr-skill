# 04. Package TODO

## packages/core

- [x] `PresentationIR -> SlideElementIR` adapter 추가.
- [x] element type inference rule 추가.
- [x] intent inference rule 추가.
- [x] group inference rule 추가.
- [x] importance scoring rule 추가.
- [x] `core`는 renderer/style package를 import하지 않도록 유지.

## packages/element-ir

- [x] `schema.ts` 작성.
- [x] `validators.ts` 작성.
- [x] `normalize.ts` 작성.
- [x] `metrics.ts` 작성.
- [x] `fixtures/` 추가.
- [x] `schema.json` export.

## design_components/rule-engine

- [x] condition DSL parser/evaluator.
- [x] profile selector.
- [x] recipe selector.
- [x] variant selector.
- [x] scoring trace.
- [x] conflict resolver.
- [x] rulebook loader.

## design_components/composition

- [x] layout primitives.
- [x] region solver.
- [x] safe area utilities.
- [x] density adaptation.
- [x] fit/overflow fallback.
- [x] source element mapping 보존.

## design_components/decoration

- [x] profile axes -> token family mapping.
- [x] typography builder.
- [x] surface/border/radius/shadow builder.
- [x] accent builder.
- [x] effect mapper.
- [x] coherence lint.

## design_components/design-source-adapter

- [x] Design Components upstream metadata.
- [x] token import/mapping.
- [x] skin fallback mapping.
- [x] motion keyword mapping.
- [x] component pattern mapping.

## design_components/pptx

- [x] `StyledDeckIR` rendering entrypoint 추가.
- [x] `ThemeColorRef -> pptx scheme color` adapter.
- [x] text run style mapping.
- [x] shape style mapping.
- [x] table/chart style mapping.
- [x] editable object smoke tests.

## packages/render-html

- [x] `StyledDeckIR` rendering entrypoint 추가.
- [x] CSS variables 생성.
- [x] data-profile/data-recipe attributes 추가.
- [x] optional motion CSS 추가.
- [x] prefers-reduced-motion 대응.

## packages/render-pdf

- [x] Styled HTML path 재사용.
- [x] static effect fallback 확인.
- [x] print snapshot 추가.

## packages/cli

- [x] style engine options.
- [x] `inspect-style` command.
- [x] `lint-style` command.
- [x] `style-gallery` output handling.
- [x] config merge order 정의.

## schemas

- [x] config schema 확장.
- [x] Slide Element IR schema 추가.
- [x] Styled Deck IR schema 추가.
- [x] Rulebook schema 추가.
- [x] Agent hint schema 추가.

## tests

- [x] legacy regression tests.
- [x] element-ir snapshots.
- [x] feature snapshots.
- [x] selector tests.
- [x] composition snapshots.
- [x] decoration snapshots.
- [x] renderer smoke tests.
- [x] gallery tests.
