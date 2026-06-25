# MDPR Promotion Drafts

These drafts are for manual posting from the maintainer's own account. Do not
cross-post the same text to many communities. Post to one or two relevant
places first, disclose that this is your project, and stay available for
technical discussion.

Project links:

- MDPR: https://github.com/ch040602/MdPr
- mdpr-skill: https://github.com/ch040602/mdpr-skill
- Preview gallery: https://ch040602.github.io/MdPr/theme-preview/

Recommended posting order:

1. Hacker News Show HN.
2. Reddit r/SideProject.
3. Reddit r/github self-promotion megathread.
4. Short social post on X, Mastodon, or Bluesky.

Avoid r/opensource for this launch unless the post is framed around open-source
maintenance and the community rules clearly fit the account history.

## Hacker News: Show HN

URL:

```text
https://github.com/ch040602/MdPr
```

Title:

```text
Show HN: MDPR - Markdown to editable PowerPoint without an LLM runtime
```

First comment:

```text
Hi HN,

I built MDPR because I wanted Markdown-generated slides that remain editable in
PowerPoint. The runtime is deterministic: Markdown is parsed into a presentation
IR, planned into layout IR, validated for overflow/coherence, and rendered to
editable PPTX first. HTML/PDF/PNG previews are downstream outputs.

The project is intentionally not an LLM slide generator. There is an optional
mdpr-skill companion that can provide semantic hints or review notes, but MDPR
rejects hints that try to own final coordinates, colors, z-order, geometry, or
renderer object IDs.

The hard parts so far have been text fitting, keeping graphs/tables from
splitting incorrectly, preserving PPTX editability, and validating that the
rendered PNG previews match the intended layout.

Repo:
https://github.com/ch040602/MdPr

Preview gallery:
https://ch040602.github.io/MdPr/theme-preview/

I would be interested in feedback from people who generate presentations from
engineering docs, research notes, or product reports.
```

## Reddit: r/SideProject

Title:

```text
I built a Markdown-to-editable-PowerPoint generator that does not need an LLM at runtime
```

Body:

```text
I have been working on MDPR, a deterministic Markdown-to-presentation runtime:

https://github.com/ch040602/MdPr

Most Markdown slide tools either render HTML slides or flatten visual output.
MDPR is focused on editable PPTX: text remains text, tables remain tables,
charts can be native/editable, and generated diagrams are bounded and validated.

The pipeline is:

Markdown -> Presentation IR -> Layout IR -> validation -> editable PPTX -> HTML/PDF/PNG previews

There is also an optional companion repo, mdpr-skill, for agent-side review
hints and visual critique:

https://github.com/ch040602/mdpr-skill

The important boundary is that MDPR itself does not need an LLM for normal
output. The skill can suggest semantic hints, but MDPR owns final layout,
colors, z-order, geometry, and renderer output.

Preview gallery:
https://ch040602.github.io/MdPr/theme-preview/

I would like feedback on whether this solves a real workflow problem for people
who convert docs, research notes, product reports, or engineering writeups into
PowerPoint.
```

## Reddit: r/github Self-Promotion Megathread

Comment:

```text
Project: MDPR

GitHub: https://github.com/ch040602/MdPr
Preview: https://ch040602.github.io/MdPr/theme-preview/

MDPR is a Markdown-to-presentation runtime. It produces editable PPTX first,
then HTML/PDF/PNG previews. It is deterministic at runtime: no API key or LLM
call is required for normal builds.

What it supports:

- CommonMark/GFM Markdown parsing.
- Presentation IR and Layout IR.
- Editable PowerPoint text, tables, charts, proof objects, diagrams, and icon slots.
- Theme styles, color harmonies, and generated PPT theme colors.
- Overflow/coherence validation.
- Optional mdpr-skill companion for review hints, without letting the agent own
  final coordinates/colors/z-order/output.

I am looking for feedback on Markdown edge cases, PPTX editability, and examples
where generated slides usually break.
```

## Reddit: r/IMadeThis

Title:

```text
I made MDPR, a Markdown-to-editable-PPTX presentation runtime
```

Body:

```text
I made MDPR to generate editable PowerPoint decks from Markdown without using
an LLM at runtime.

Repo: https://github.com/ch040602/MdPr
Preview gallery: https://ch040602.github.io/MdPr/theme-preview/

The goal is not to screenshot a web deck. MDPR keeps the output editable:
text boxes, tables, charts, diagrams, icon slots, and proof objects are
structured PowerPoint surfaces where possible.

It uses a deterministic pipeline:
Markdown -> Presentation IR -> Layout IR -> validation -> editable PPTX.

There is an optional mdpr-skill repo for agent-side review hints, but MDPR
itself owns the final layout, coordinates, theme colors, z-order, and renderer
output.

I would appreciate feedback from people who often turn notes, docs, or reports
into presentation decks.
```

## Short X / Mastodon / Bluesky Post

```text
I built MDPR: a deterministic Markdown-to-editable-PPTX runtime.

It parses Markdown into Presentation/Layout IR, validates overflow/coherence,
and renders editable PowerPoint slides first. No LLM/API key needed at runtime.

Repo: https://github.com/ch040602/MdPr
Preview: https://ch040602.github.io/MdPr/theme-preview/
```
