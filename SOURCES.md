# Sources checked while preparing this TODO pack

- Checked date: 2026-06-19
- MDPR repository: https://github.com/ch040602/mdpr (GitHub resolves this as https://github.com/ch040602/MdPr)
- MDPR pinned HEAD checked by `git ls-remote`: `4c9559cb34d1e539226449c1298dc2248a89ac98`
- MDPR package structure observed under `packages/`: cli, core, layout, override, render-html, render-pdf, render-pptx. This project keeps the Design Components-derived PPTX binding under `design_components/pptx`.
- MDPR documented pipeline: Markdown -> Parser -> Outline Builder -> Split Planner -> Presentation IR -> Layout Planner -> Layout IR -> Override Resolver -> QA / Overflow Checker -> Renderer.
- Design Components repository: external-design-source
- Design Components pinned HEAD checked by `git ls-remote`: `34e9fcf2d3da69355defad7afa5e50ff15ed8cb2`
- Design Components tags observed by `git ls-remote --tags`: `v2.0.0`, `v2.1.0`, `v2.1.1`, `v2.2.0`, `v2.3.0`.
- Design Components license recorded for vendoring review: MIT.
- Design Components documented concepts: brand-agnostic design engine, visual rules, components, named motion system, skins, skills.

This TODO pack is an implementation planning artifact. If Design Components content is copied or adapted, keep upstream metadata and license notice under `third_party/design-source/`, and keep project-owned adaptations under `design_components/`.
