# TODO Index

Recommended execution order:

1. [Phase 00 - Preflight](todo/phase-00-preflight.md)
2. [Phase 01 - Element IR](todo/phase-01-element-ir.md)
3. [Phase 02 - Feature Extractor](todo/phase-02-feature-extractor.md)
4. [Phase 03 - Rule Engine Foundation](todo/phase-03-rule-engine-foundation.md)
5. [Phase 04 - Visual Profiles](todo/phase-04-profile-catalog.md)
6. [Phase 05 - Slide Recipes](todo/phase-05-slide-recipes.md)
7. [Phase 06 - Element Variants](todo/phase-06-element-variants.md)
8. [Phase 07 - Composition Engine](todo/phase-07-composition-engine.md)
9. [Phase 08 - Decoration Engine](todo/phase-08-decoration-engine.md)
10. [Phase 09 - Design Source Port](todo/phase-09-design-source-port.md)
11. [Phase 10 - PPT Theme Colors](todo/phase-10-ppt-theme-colors.md)
12. [Phase 11 - Renderer Integration](todo/phase-11-renderer-integration.md)
13. [Phase 12 - CLI / Config / Inspect](todo/phase-12-cli-config-inspect.md)
14. [Phase 13 - Coherence Lint](todo/phase-13-coherence-lint.md)
15. [Phase 14 - Style Gallery](todo/phase-14-style-gallery.md)
16. [Phase 15 - Agent Hints](todo/phase-15-agent-hints.md)
17. [Phase 16 - Regression / Docs / Release](todo/phase-16-regression-docs-release.md)
18. [Phase 17 - LLM-Advised Quality Handoff](todo/phase-17-llm-advised-quality-handoff.md)
19. [Phase 18 - Three-Rail Implementation Status](todo/phase-18-three-rail-implementation-status.md)
20. [Phase 19 - Design Grammar and Import Roadmap](todo/phase-19-design-grammar-and-import-roadmap.md)
21. [Phase 20 - Unified Skill Follow-ups](todo/phase-20-unified-skill-followups.md)

## Parallelization

Allowed parallel work:

- Phase 01 and part of Phase 09 may run in parallel.
- Phase 05 recipe catalog and Phase 06 variant catalog may run in parallel after the schemas stabilize.
- Phase 10 theme color adapter may run in parallel once Phase 08 style specs exist.
- Phase 12 CLI work may start with inspect support once Phase 03 selection trace drafts exist.

Do not parallelize:

- Phase 07 composition before the Phase 05 recipe schema exists.
- Phase 11 renderer integration before `StyledDeckIR` is stable, except on a feature branch.
- Phase 15 agent hints before the rule engine is stable.
