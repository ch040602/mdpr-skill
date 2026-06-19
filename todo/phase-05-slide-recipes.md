# Phase 05 — Slide Recipes

## Goal

슬라이드 목적과 요소 조합에 따라 선택될 recipe catalog를 만든다.

## Recipe groups

- [x] cover.heroMinimal
- [x] cover.brandBlock
- [x] cover.editorialTitle
- [x] section.bigNumber
- [x] section.ruleAndLabel
- [x] section.fullBleedAccent
- [x] content.cardStack
- [x] content.twoColumnText
- [x] content.editorialBody
- [x] content.calloutLead
- [x] data.kpiRailChart
- [x] data.kpiDashboard
- [x] data.chartWithContext
- [x] data.tableWithInsight
- [x] comparison.twoColumnCards
- [x] comparison.prosCons
- [x] comparison.matrix
- [x] process.horizontalSteps
- [x] process.verticalRail
- [x] timeline.roadmap
- [x] code.windowFocus
- [x] code.splitExplanation
- [x] code.diffReview
- [x] summary.keyTakeaways
- [x] summary.actionList
- [x] summary.metricRecap

## Tasks

- [x] `SlideRecipe` schema 작성.
- [x] recipe catalog YAML 작성.
- [x] hard accept/reject rule 작성.
- [x] score rule 작성.
- [x] required element support 작성.
- [x] effect budget 작성.
- [x] region skeleton 작성.
- [x] fixtures별 expected recipe test 작성.

## Acceptance

- [x] high-density long text는 hero recipe를 거부한다.
- [x] KPI+chart는 data recipe를 우선한다.
- [x] code block은 code-capable recipe를 우선한다.
- [x] large table은 table-first recipe를 우선한다.
