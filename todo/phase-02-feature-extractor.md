# Phase 02 — Feature Extractor

## Goal

Rule engine이 사용할 feature를 deterministic하게 계산한다.

## Tasks

- [x] `extractDeckFeatures()` 작성.
- [x] `extractSlideFeatures()` 작성.
- [x] `extractElementFeatures()` 작성.
- [x] density 계산: low/medium/high + numeric score.
- [x] text metrics 계산: totalTextChars, maxTextCharsInOneElement, line count.
- [x] data metrics 계산: kpiCount, chartCount, tableCellCount, numericDensity.
- [x] technical metrics 계산: codeLineCount, equationCount.
- [x] visual metrics 계산: imageCount, aspect ratios.
- [x] narrativeWeight/dataWeight/visualComplexity/informationDensity 계산.
- [x] overflowRisk estimate 추가.
- [x] golden feature snapshots 추가.

## Acceptance

- [x] KPI+chart fixture가 dataWeight=5 근처로 계산된다.
- [x] long text fixture가 narrativeWeight=5 근처로 계산된다.
- [x] large table fixture가 high overflowRisk를 가진다.
- [x] code fixture가 code-capable recipe 후보를 유도할 features를 가진다.
