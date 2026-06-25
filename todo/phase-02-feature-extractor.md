# Phase 02 - Feature Extractor

## Goal

Calculate deterministic features for the rule engine.

## Tasks

- [x] Add `extractDeckFeatures()`.
- [x] Add `extractSlideFeatures()`.
- [x] Add `extractElementFeatures()`.
- [x] Calculate density as low/medium/high plus a numeric score.
- [x] Calculate text metrics: `totalTextChars`, `maxTextCharsInOneElement`, and line count.
- [x] Calculate data metrics: `kpiCount`, `chartCount`, `tableCellCount`, and `numericDensity`.
- [x] Calculate technical metrics: `codeLineCount` and `equationCount`.
- [x] Calculate visual metrics: `imageCount` and aspect ratios.
- [x] Calculate `narrativeWeight`, `dataWeight`, `visualComplexity`, and `informationDensity`.
- [x] Add `overflowRisk` estimate.
- [x] Add golden feature snapshots.

## Acceptance

- [x] KPI + chart fixture calculates near `dataWeight=5`.
- [x] Long text fixture calculates near `narrativeWeight=5`.
- [x] Large table fixture has high `overflowRisk`.
- [x] Code fixture exposes features that steer selection toward code-capable recipes.
