# MDPR + mdpr-skill Promotion Sites

Public article already posted:

- GitHub Gist: https://gist.github.com/ch040602/8a221fb49bae5b49683cad2cfa7ca27a

## Priority Sites

| Priority | Site | Fit | Account Needed | Action |
| --- | --- | --- | --- | --- |
| 1 | Hacker News Show HN | Technical audience for CLI/dev tools | Yes | Submit MDPR repo URL; add mdpr-skill in first comment |
| 1 | DEV Community | Long-form developer explanation | Yes/API key | Publish article draft |
| 1 | Peerlist Launchpad | Developer/designer early users | Yes | Submit product with GitHub/Pages links |
| 2 | Uneed | Product launch directory | Sign-up after preview | Submit MDPR landing page |
| 2 | Product Hunt | Broad product discovery | Yes | Launch MDPR; mention mdpr-skill as feature |
| 2 | Microlaunch | Startup/tool feedback | Yes | Submit MDPR landing page |
| 3 | Reddit r/SideProject | Feedback from builders | Yes | Follow-up post, avoid repeated link drop |
| 3 | Reddit r/Markdown | Markdown workflow users | Yes/rules | Ask for edge cases, not pure promotion |
| 3 | Reddit r/PowerPoint | PPT automation users | Yes/rules | Focus on editable PPTX, not LLM |

## Product Fields

Name:

```text
MDPR
```

Tagline:

```text
Editable PowerPoint decks from Markdown, with optional agent review
```

Short description:

```text
MDPR turns Markdown into editable, visually checked PowerPoint decks with a
deterministic runtime. mdpr-skill is an optional Codex companion for semantic
hints, icon-keyword ideas, and visual QA notes before MDPR renders.
```

Links:

```text
Landing: https://ch040602.github.io/MdPr/
GitHub: https://github.com/ch040602/MdPr
npm: https://www.npmjs.com/package/@mdpresent/cli
Skill: https://github.com/ch040602/mdpr-skill
Preview: https://ch040602.github.io/MdPr/theme-preview/
Release: https://github.com/ch040602/MdPr/releases/tag/v0.1.0-preview
Article: https://gist.github.com/ch040602/8a221fb49bae5b49683cad2cfa7ca27a
```

## Show HN

Title:

```text
Show HN: MDPR - Markdown to editable PowerPoint without an LLM runtime
```

URL:

```text
https://github.com/ch040602/MdPr
```

First comment:

```text
I built MDPR because I wanted Markdown-generated slides that remain editable in
PowerPoint instead of becoming screenshots or HTML-only decks.

The runtime is deterministic: Markdown is parsed into Presentation IR, planned
into Layout IR, validated for overflow/coherence, and rendered to editable PPTX
first. HTML/PDF/PNG previews are downstream outputs.

There is also an optional companion repo, mdpr-skill:
https://github.com/ch040602/mdpr-skill

The boundary is deliberately narrow. The skill can suggest semantic hints,
icon-search keywords, Markdown cleanup notes, or visual QA concerns, but it
cannot own final coordinates, colors, z-order, geometry, exact icons, or
renderer object IDs. MDPR remains the deterministic runtime.

The short version: the LLM can suggest; MDPR renders.

Install:
npm install -g @mdpresent/cli

Preview gallery:
https://ch040602.github.io/MdPr/theme-preview/
```

## DEV / Hashnode

Use the public Gist as source:

```text
https://gist.github.com/ch040602/8a221fb49bae5b49683cad2cfa7ca27a
```

Title:

```text
Using LLMs for slide review, not slide layout: MDPR + mdpr-skill
```

Tags:

```text
markdown, powerpoint, typescript, productivity
```

## Reddit Follow-Up

Title:

```text
Looking for Markdown files that break when converted to editable PowerPoint
```

Recommended subreddits:

```text
r/Markdown
r/PowerPoint
r/SideProject
```

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

Preview: https://ch040602.github.io/MdPr/theme-preview/

I’m looking for real Markdown edge cases that usually break when converted into
PowerPoint: dense tables, chart/table pairs, diagrams, mixed-language text,
captions, code-heavy docs, or documents where editability matters after
generation.

If you have a small snippet that usually converts poorly, I’d appreciate it.
```
