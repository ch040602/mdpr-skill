# MDPR Corpus: Baseline vs Design Components Skill

This deck is generated from Markdown files inside the local MDPR checkout.

## Difference at a glance

| Area | MDPR baseline | Current skill pack |
|---|---|---|
| Role | Markdown to Presentation IR and renderer output | Visual diversification after MDPR content structure |
| Parser | Built-in parser or Pandoc parser mode | Does not parse Markdown; consumes MDPR semantic output |
| Layout | Rule layout and theme presets | Recipe, variant, icon, infographic, coherence, and validation rules |
| PPTX | Editable text, tables, images, diagrams | Editable PPTX with richer component planning and visual QA |

## Source manifest

- README.md: mdpresent (10 headings, 6157 chars)
- README.ko.md: mdpresent (10 headings, 3747 chars)
- CODEX_PROMPT.md: Codex 구현 프롬프트 (5 headings, 1065 chars)
- docs/00-product-definition.md: 00. 제품 정의 (6 headings, 745 chars)
- docs/01-architecture.md: 01. 아키텍처 (9 headings, 1719 chars)
- docs/02-requirements.md: 02. 요구사항 (12 headings, 2042 chars)
- docs/03-page-splitting.md: 03. 페이지 분할 규칙 (17 headings, 4977 chars)
- docs/04-layout-rules.md: 04. 레이아웃 선택 규칙 (10 headings, 2641 chars)
- docs/05-overrides-for-llm.md: 05. LLM/Codex 친화적 Override Manifest (11 headings, 2931 chars)
- docs/06-cli-spec.md: 06. CLI 명령 설계 (10 headings, 3948 chars)
- docs/07-rendering-rules.md: 07. Renderer 규칙 (6 headings, 6204 chars)
- docs/08-roadmap.md: 08. 구현 로드맵 (10 headings, 1470 chars)
- docs/09-codex-implementation-guide.md: 09. Codex 구현 가이드 (9 headings, 1433 chars)
- docs/10-template-and-master-policy.md: 10. PPT 템플릿과 Slide Master 정책 (7 headings, 966 chars)
- docs/11-qa-overflow.md: 11. QA와 Overflow 정책 (8 headings, 2892 chars)
- docs/references.md: References (8 headings, 582 chars)
- docs/adr/0001-presentation-ir-schema-contract.md: ADR 0001: Presentation IR Schema Contract (5 headings, 1226 chars)
- examples/basic/deck.md: AI 업무 자동화 제안서 (10 headings, 581 chars)
- examples/comparison/deck.md: 비교 구조 예시 (4 headings, 137 chars)
- examples/pipeline/deck.md: Pipeline Example (3 headings, 186 chars)
- examples/diagram-arrangements/deck.md: Diagram Arrangement Examples (6 headings, 457 chars)
- examples/five-methods/deck.md: 5개 항목 레이아웃 예시 (2 headings, 96 chars)
- examples/theme-preview-en/deck.md: mdpresent (7 headings, 1770 chars)
- examples/theme-preview-ko/deck.md: 엠디프레젠트 (7 headings, 907 chars)

## Pipeline boundary

Markdown => MDPR parser => BlockIR => Outline Tree => Split Planner => Presentation IR => Layout IR => Renderer

Presentation IR => Slide Element IR => Feature Extractor => Design Components Rule Engine => Styled Deck IR => Editable PPTX

## Parser and splitting topics

## 01. 아키텍처

- 01. 아키텍처
- 전체 흐름
- 패키지 역할
- 설계 원칙
- 1. Core는 렌더러를 모른다

```text
Markdown
  ↓
Parser(simple Markdown or Pandoc JSON)
  ↓
Outline Builder
  ↓
```

## 03. 페이지 분할 규칙

- 03. 페이지 분할 규칙
- 기본 heading 규칙
- cover 또는 section
- slide candidate
- subsection 또는 autosplit 기준
- Markdown 구조 생성
- 기본값: built-in simple parser
- 선택값: --parser pandoc으로 Pandoc JSON AST 생성 후 BlockIR로 정규화
- heading tree 생성

| Field | Value |
|---|---|
| 요소 | 기본 점수 |
| 짧은 문단 | 1 |
| 긴 문단 | 2 |
| bullet 1개 | 1 |

```text
#   cover 또는 section
##  slide candidate
### subsection 또는 autosplit 기준
#### 본문 내부 heading
```

## 04. 레이아웃 선택 규칙

- 04. 레이아웃 선택 규칙
- 기본 규칙
- Intent 감지
- 개수 기반 레이아웃
- 비교 구조 감지
- 제목에 기존/개선, Before/After, As-Is/To-Be, 장점/단점 포함
- h3가 정확히 2개이고 서로 대비됨
- bullet group이 2개이며 group title이 대비됨
- 표가 비교축 column을 가짐

| Field | Value |
|---|---|
| 조건 | intent |
| 기존/개선, Before/After, As-Is/To-Be, 장점/단점 | comparison |
| 날짜, 단계, phase, step 반복 | timeline |
| 큰 표 포함 | table |

```text
SlideIntent + itemCount + blockType + density → LayoutPreset
```

## 07. Renderer 규칙

- 07. Renderer 규칙
- 공통 규칙
- PPTX Renderer
- HTML Renderer
- PDF Renderer
- consumes the normal renderable deck input: { Presentation IR, Layout IR }
- uses Layout IR slide size, region x/y/w/h, theme fonts, colors, and z-order
- emits editable PowerPoint text boxes for titles, paragraphs, bullets, code text, and fallback content
- emits PowerPoint table objects for table blocks

```text
{ Presentation IR, Layout IR } → PPTX
{ Presentation IR, Layout IR } → HTML
{ Presentation IR, Layout IR } → PDF
```

## 11. QA와 Overflow 정책

- 11. QA와 Overflow 정책
- QA 검사 항목
- Overflow 처리 순서
- CLI 옵션
- Validation behavior
- 텍스트 overflow
- 표 overflow
- 이미지 누락
- asset 경로 오류

```text
- 텍스트 overflow
- 표 overflow
- 이미지 누락
- asset 경로 오류
- page number 겹침
- safe area 위반
```

## Example decks from MDPR

- basic/deck.md covers core flow and expected effects.
- comparison/deck.md exercises before/after content.
- pipeline/deck.md exercises diagram conversion.
- diagram-arrangements/deck.md exercises multiple diagram structures.
- theme-preview decks exercise preset variety.

## Example: examples/basic/deck.md

- AI 업무 자동화 제안서
- 문제 정의
- 반복 업무 증가
- 검색 비용 증가
- 기존 방식과 개선 방식
- 기존 방식
- 회의록 정리
- 보고서 초안 작성
- 데이터 취합
- 자료 위치 불명확

## Example: examples/comparison/deck.md

- 비교 구조 예시
- 기존 방식과 개선 방식
- 기존 방식
- 개선 방식
- 문서 작성이 수동으로 진행됨
- 형식이 개인별로 다름
- 검색이 어려움
- 초안이 자동 생성됨

## Example: examples/pipeline/deck.md

- Pipeline Example
- Publishing Flow
- Five-Part Method
- Capture source
- Split structure
- Plan layout
- Render outputs

## Example: examples/diagram-arrangements/deck.md

- Diagram Arrangement Examples
- Horizontal Flow
- Vertical Flow
- U-Shaped Flow
- Reverse-U Flow
- Cycle-Like Flow

## Example: examples/five-methods/deck.md

- 5개 항목 레이아웃 예시
- 5가지 실행 방법
- 파일럿 조직 선정
- 반복 문서 유형 분석
- 자동화 템플릿 설계
- 지식 검색 인덱스 구축

## Example: examples/theme-preview-en/deck.md

- mdpresent
- Core Principle
- Generation Flow
- Rule-Based Engine
- Markdown Semantics
- Theme Selection
- NO LLM runtime: generation does not call an external model.
- Rule-based layout: headings, density, list count, sentence units, and diagram signals drive placement.
- Reproducible output: the same source and settings produce the same presentation structure.
- Auxiliary skill ready: the standalone CLI can be wrapped as a local automation skill.

## Example: examples/theme-preview-ko/deck.md

- 엠디프레젠트
- 핵심 원칙
- 생성 흐름
- 규칙 기반 엔진
- 마크다운 구조 보존
- 테마 선택
- 모델 호출 없음: 생성 과정은 외부 모델이나 외부 연결 호출 없이 동작합니다.
- 규칙 기반: 제목, 밀도, 목록 수, 문장 단위, 도식 신호를 기준으로 배치합니다.
- 재현 가능성: 같은 원고와 설정은 같은 발표 구조를 만듭니다.
- 보조 스킬화: 독립적인 명령행 도구이므로 로컬 자동화 스킬로 감쌀 수 있습니다.

## Current skill output expectations

- Text-only slides may receive one quiet monotone-icon-aside slot.
- Dense content should stay readable instead of gaining decorative icons.
- Infographic families are selected by text length, relation, item count, and importance.
- Coherence validation checks color role, alignment, object variety, font floor, and z-order.

## End state

> MDPR remains the content and rendering runtime. The current skill pack adds deterministic visual decisions after MDPR has produced semantic structure.
