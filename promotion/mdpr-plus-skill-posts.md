# MDPR + mdpr-skill Promotion Posts

Use MDPR as the product and mdpr-skill as the optional agent review companion.

## Core Message

```text
MDPR is the deterministic runtime. mdpr-skill is the optional agent review
companion. The LLM can suggest; MDPR renders.
```

## Show HN Add-on Comment

```text
There is also an optional companion repo, mdpr-skill:
https://github.com/ch040602/mdpr-skill

The boundary is deliberately narrow. The skill can suggest semantic hints,
icon-search keywords, Markdown cleanup notes, or visual QA concerns, but it
cannot own final coordinates, colors, z-order, geometry, exact icons, or
renderer object IDs. MDPR remains the deterministic runtime.
```

## LLM / Agent Tooling Post

Title:

```text
Using LLMs for slide review, not slide layout: MDPR + mdpr-skill
```

Body:

```text
I built MDPR + mdpr-skill as a split-responsibility presentation workflow.

MDPR turns Markdown into editable PowerPoint decks with deterministic parsing,
slide splitting, layout validation, theme rules, and PPTX-first rendering.

mdpr-skill is optional. It lets a Codex-style agent suggest semantic hints,
icon-keyword ideas, Markdown cleanup notes, and visual QA concerns before MDPR
builds the deck.

The boundary is the point: the LLM can suggest, but MDPR owns final coordinates,
colors, z-order, object geometry, validation, and renderer output.

Install:
npm install -g @mdpresent/cli

Runtime:
https://github.com/ch040602/MdPr

Optional skill:
https://github.com/ch040602/mdpr-skill
```

## DEV / Hashnode Article

```markdown
# Using LLMs for slide review, not slide layout: MDPR + mdpr-skill

I have been building MDPR, a deterministic Markdown-to-editable-PPTX runtime,
and mdpr-skill, an optional Codex companion for review hints.

The problem I wanted to avoid is common in LLM-generated slide decks: the model
owns too much. It chooses coordinates, colors, emphasis, spacing, and object
geometry directly. The first slide may look plausible, but coherence often
drifts across the deck.

MDPR uses a different boundary:

- Markdown is parsed into presentation structure.
- Slide splitting and layout planning are deterministic.
- Theme colors, z-order, object bounds, and renderer output are owned by MDPR.
- The output is editable PPTX first, with HTML/PDF/PNG previews downstream.

mdpr-skill sits before that runtime. It can suggest compact semantic tags,
icon-search keywords, Markdown cleanup notes, and visual QA concerns. It cannot
own final coordinates, exact colors, z-order, shape geometry, exact icons, or
renderer object IDs.

The short version:

> The LLM can suggest; MDPR renders.

Install MDPR:

```bash
npm install -g @mdpresent/cli
mdpresent build deck.md --to pptx,html --out dist
```

Runtime:
https://github.com/ch040602/MdPr

Optional skill:
https://github.com/ch040602/mdpr-skill

Preview gallery:
https://ch040602.github.io/MdPr/theme-preview/

I am looking for Markdown edge cases that usually break when converted into
PowerPoint: dense tables, chart/table pairs, diagrams, mixed-language text,
captions, and documents where editability matters after generation.
```

## Reddit Feedback Post

Title:

```text
Looking for Markdown files that break when converted to editable PowerPoint
```

Body:

```text
I’m building MDPR, a deterministic Markdown-to-editable-PPTX runtime:

https://github.com/ch040602/MdPr

I’m not trying to make another LLM slide generator. The goal is to keep slide
layout deterministic and editable, while using mdpr-skill only for optional
review hints:

https://github.com/ch040602/mdpr-skill

MDPR is now published on npm:
npm install -g @mdpresent/cli

The boundary is:

- MDPR owns parsing, slide splitting, layout, theme colors, z-order, validation,
  and editable PPTX rendering.
- mdpr-skill can suggest semantic hints, icon-keyword ideas, Markdown cleanup
  notes, and visual QA concerns.
- The LLM can suggest; MDPR renders.

Preview:
https://ch040602.github.io/MdPr/theme-preview/

I’m looking for real Markdown edge cases that usually break when converted into
PowerPoint: dense tables, chart/table pairs, diagrams, mixed-language text,
captions, code-heavy docs, or documents where editability matters after
generation.

If you have a small snippet that usually converts poorly, I’d appreciate it.
```

## Short Social Post

```text
I built MDPR + mdpr-skill as a split-responsibility slide workflow:

MDPR = deterministic Markdown -> editable PPTX runtime
mdpr-skill = optional agent review hints

The LLM can suggest; MDPR renders.

npm install -g @mdpresent/cli

https://github.com/ch040602/MdPr
https://github.com/ch040602/mdpr-skill
```
