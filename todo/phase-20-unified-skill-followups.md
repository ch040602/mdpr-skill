# Phase 20 - Unified Skill Follow-ups

## Goal

Finish the repository cleanup after consolidating `mdpr-design-components` and
`mdpr-design-review` into the single `mdpr-skill` Codex skill.

## Findings

- `skills/mdpr-skill` is now the only source skill and validates with
  `quick_validate.py`.
- The local Codex install path also contains only
  `C:\Users\hcslab_523\.codex\skills\mdpr-skill`.
- `python -m unittest tests.test_boundary_contract -v` currently fails because
  `tests/test_boundary_contract.py` still reads the removed
  `skills/mdpr-design-components/SKILL.md` and
  `skills/mdpr-design-review/SKILL.md` files.
- Direct references to the removed skill names are otherwise concentrated in
  the failing boundary test; broader `design-components` references are product
  pipeline terminology and should not be renamed blindly.

## TODO

- [ ] `UNIFIED-SKILL-P0-001`: Update `tests/test_boundary_contract.py` to read
  `skills/mdpr-skill/SKILL.md` and assert that the unified skill still forbids
  final-decision fields such as coordinates, colors, typography, z-order, and
  renderer ownership.
- [ ] `UNIFIED-SKILL-P0-002`: Add or adjust a boundary test that ensures the
  unified skill covers both Design Components semantic-hint guidance and Styled
  Deck IR design coherence review responsibilities.
- [ ] `UNIFIED-SKILL-P1-003`: Update README or installation docs to state that
  Codex users should install/invoke `$mdpr-skill`, not the removed
  `$mdpr-design-components` or `$mdpr-design-review` names.
- [ ] `UNIFIED-SKILL-P1-004`: Add a small install/sync helper or documented
  command for copying `skills/mdpr-skill` into `$CODEX_HOME/skills/mdpr-skill`
  so the source skill and local Codex-installed skill do not drift.
- [ ] `UNIFIED-SKILL-P2-005`: Decide whether to keep short migration notes for
  old explicit invocations of `$mdpr-design-components` and
  `$mdpr-design-review`, or intentionally require users to switch to
  `$mdpr-skill`.
- [ ] `UNIFIED-SKILL-P2-006`: Add a release checklist item that verifies
  `quick_validate.py skills/mdpr-skill` and the focused boundary tests pass
  before publishing or reinstalling the skill.

## Acceptance

- `python -m unittest tests.test_boundary_contract -v` passes.
- `quick_validate.py skills/mdpr-skill` passes.
- `rg "mdpr-design-components|mdpr-design-review" README.md docs tests todo package.json skills`
  returns only intentional migration/history references.
- The local Codex install instructions point to one skill name:
  `$mdpr-skill`.
