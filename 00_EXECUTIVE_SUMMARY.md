# 00. Executive Summary

## 구현 목표

MDPR에 Design Components 기반 `design-components-rule-based` pipeline을 추가한다. 이 pipeline에서 MDPR은 Markdown을 슬라이드와 요소 단위로 분할하고, Design Components가 deterministic rule에 따라 layout, 요소 크기, 배치, 컴포넌트 variant, 장식, 효과를 선택한다.

## 현재 구조에 대한 전제

현재 MDPR은 대략 다음 흐름이다.

```text
Markdown
  -> Parser
  -> Outline Builder
  -> Split Planner
  -> Presentation IR
  -> Layout Planner
  -> Layout IR
  -> Override Resolver
  -> QA / Overflow Checker
  -> Renderer
```

신규 모드는 기존 모드를 깨지 않고 다음 경로를 병렬로 추가한다.

```text
Markdown
  -> Parser
  -> Outline Builder
  -> Split Planner
  -> Presentation IR
  -> Slide Element IR
  -> Design Components Rule Engine
  -> Styled Deck IR
  -> Renderer
```

## 가장 중요한 설계 결정

| 항목 | 결정 |
|---|---|
| MDPR 책임 | element split, type/role/importance/density/group 추론 |
| Design Components 책임 | visual profile, slide recipe, element variant, composition, decoration, effects |
| 선택 방식 | deterministic rule-based selector |
| agent 사용 | optional semantic hint only |
| 색상 | PPT theme slot 기반, raw hex 기본 금지 |
| 기존 layout | legacy/simple pipeline으로 유지하거나 Design Components 내부의 fallback utility로 축소 |
| debug | inspect-style로 feature, 후보, reject reason, selected recipe를 노출 |

## 구현 산출물

1. `packages/element-ir`
2. `design_components/rule-engine`
3. `design_components/composition`
4. `design_components/decoration`
5. renderer adapter 확장
6. config schema 확장
7. CLI 명령/옵션 확장
8. style gallery
9. coherence lint
10. optional agent hints

## Definition of Done

- 같은 `Slide Element IR`로 여러 `DeckVisualProfile` 결과를 생성할 수 있다.
- `inspect-style`이 선택된 recipe/variant와 reject reason을 출력한다.
- PPTX 출력에서 주요 텍스트와 도형은 editable object다.
- `color.mode: ppt-theme`에서 raw hex가 최종 PPTX style plan에 남지 않는다.
- high-density slide에는 expressive effect가 자동 억제된다.
- agent hint를 꺼도 동일 입력은 동일 결과를 낸다.
- rulebook 변경 없이 agent가 recipe/variant를 바꾸지 못한다.
