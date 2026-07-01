# mdpr-skill Contributor Outreach Kit

Use this kit to recruit useful PRs without blurring the MDPR boundary. The
message should be: MDPR renders deterministic editable decks; mdpr-skill helps
contributors review, score, and improve the handoff.

## Primary Hook

```text
I am looking for Markdown decks that break presentation generators.

MDPR turns Markdown into editable PowerPoint. mdpr-skill is the optional Codex
review companion around it: semantic hints, rendered-preview critique,
codex-ppt compatibility rails, visual eval ledgers, and reusable theme
candidate proposals. The agent can suggest. MDPR still owns the final layout,
theme binding, geometry, z-order, and PPTX objects.

Useful first PRs:
- add one public Markdown corpus case
- add one rendered-preview review fixture
- propose one source-neutral DESIGN.md theme candidate
- improve docs where MDPR vs mdpr-skill routing is confusing

Repo: https://github.com/ch040602/mdpr-skill
Main runtime: https://github.com/ch040602/MdPr
```

## GitHub Discussion / Issue Post

```text
Call for corpus and review-case contributors

I am collecting real Markdown inputs that stress presentation generation:
nested docs, dense tables, API references, code-heavy README files, diagrams,
claim/evidence sections, and long narrative reports.

The goal is not to make an LLM own slide geometry. mdpr-skill produces bounded
review artifacts and semantic hints; MDPR remains the deterministic runtime that
renders editable PPTX/HTML/PDF and validates overflow, coherence, and visual
contracts.

Good starter contributions:
1. A public Markdown corpus case with the stress point explained.
2. A rendered-preview review case with PNG/PPTX/manifest evidence.
3. A source-neutral DESIGN.md style proposal that can become an approval-bound
   mdpr-theme-candidate-v1.
4. A docs or schema sync PR that makes the handoff clearer.

Start here:
- Corpus case: https://github.com/ch040602/mdpr-skill/issues/new?template=markdown_corpus.yml
- Theme/review case: https://github.com/ch040602/mdpr-skill/issues/new?template=theme_or_review_case.yml
- Contributing guide: https://github.com/ch040602/mdpr-skill/blob/main/CONTRIBUTING.md#first-pr-lanes
```

## Short Social Post

```text
Looking for contributors to mdpr-skill.

Bring one real Markdown deck, one visual review case, or one reusable DESIGN.md
style proposal.

MDPR renders editable PPTX deterministically. mdpr-skill adds bounded agent
review around it without owning final slide geometry.

https://github.com/ch040602/mdpr-skill
```

## Reddit / Community Post

```text
I am looking for Markdown examples that usually break generated slides

I maintain mdpr-skill, the optional Codex companion for MDPR:
https://github.com/ch040602/mdpr-skill

MDPR is a deterministic Markdown-to-editable-PowerPoint runtime. mdpr-skill
sits beside it and helps with semantic hints, visual review notes, eval
artifacts, codex-ppt compatibility mapping, and reusable theme candidate
proposals.

I am trying to make the test corpus more realistic. Useful PRs can be small:

- one public Markdown source that stresses slide splitting, tables, diagrams,
  code blocks, citations, or narrative flow
- one visual review fixture with rendered PNG/PPTX evidence
- one source-neutral DESIGN.md theme candidate
- one doc fix where the MDPR vs mdpr-skill boundary is confusing

The important boundary: mdpr-skill does not choose final coordinates, exact
colors, z-order, renderer object IDs, or exact icon assets. MDPR owns the final
runtime output.

Starter contribution paths:
https://github.com/ch040602/mdpr-skill/blob/main/CONTRIBUTING.md#first-pr-lanes
```

## Maintainer Checklist Before Posting

- Pin or create one `good first issue` with a concrete fixture or doc target.
- Make sure labels in `docs/github-labels.md` exist on GitHub.
- Keep the first reply technical: ask for source, stress point, and evidence.
- Route parser/layout/PPTX runtime requests to MDPR.
- Avoid posting identical copy across many communities on the same day.

## First Reply Template

```text
Thanks. The most useful next step is a small issue or draft PR with:

1. the public Markdown source or fixture path
2. the specific stress point
3. expected evidence, such as rendered PNG/PPTX, manifest JSON, or a failing
   review criterion

If the issue is parser/layout/PPTX runtime behavior, I will route it to MDPR.
If it is semantic review, corpus, theme-candidate, or evidence workflow work,
it belongs in mdpr-skill.
```
