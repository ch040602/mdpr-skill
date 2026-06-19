# TODO Index

권장 실행 순서다.

1. [Phase 00 — Preflight](todo/phase-00-preflight.md)
2. [Phase 01 — Element IR](todo/phase-01-element-ir.md)
3. [Phase 02 — Feature Extractor](todo/phase-02-feature-extractor.md)
4. [Phase 03 — Rule Engine Foundation](todo/phase-03-rule-engine-foundation.md)
5. [Phase 04 — Visual Profiles](todo/phase-04-profile-catalog.md)
6. [Phase 05 — Slide Recipes](todo/phase-05-slide-recipes.md)
7. [Phase 06 — Element Variants](todo/phase-06-element-variants.md)
8. [Phase 07 — Composition Engine](todo/phase-07-composition-engine.md)
9. [Phase 08 — Decoration Engine](todo/phase-08-decoration-engine.md)
10. [Phase 09 — Design Source Port](todo/phase-09-design-source-port.md)
11. [Phase 10 — PPT Theme Colors](todo/phase-10-ppt-theme-colors.md)
12. [Phase 11 — Renderer Integration](todo/phase-11-renderer-integration.md)
13. [Phase 12 — CLI / Config / Inspect](todo/phase-12-cli-config-inspect.md)
14. [Phase 13 — Coherence Lint](todo/phase-13-coherence-lint.md)
15. [Phase 14 — Style Gallery](todo/phase-14-style-gallery.md)
16. [Phase 15 — Agent Hints](todo/phase-15-agent-hints.md)
17. [Phase 16 — Regression / Docs / Release](todo/phase-16-regression-docs-release.md)

## Parallelization

가능한 병렬 작업:

- Phase 01과 Phase 09 일부는 병렬 가능.
- Phase 05 recipe catalog와 Phase 06 variant catalog는 schema 확정 후 병렬 가능.
- Phase 10 theme color adapter는 Phase 08 style spec이 나오면 병렬 가능.
- Phase 12 CLI는 Phase 03 selection trace 초안이 나오면 inspect부터 병렬 가능.

병렬 금지:

- Phase 07 composition은 Phase 05 recipe schema 전에는 시작하지 않는다.
- Phase 11 renderer integration은 StyledDeckIR 안정화 전에는 feature branch에만 둔다.
- Phase 15 agent hints는 rule engine 안정화 후에만 붙인다.
