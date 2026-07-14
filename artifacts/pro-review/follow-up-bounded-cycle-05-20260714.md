# Follow-up bounded Pro cycle 5

- Time: 2026-07-14T08:49:46Z
- Provider: ChatGPT Pro through `agbrowse web-ai`
- Conversation: `https://chatgpt.com/c/6a54e470-a2bc-83e8-aa5a-5ae4916e88f2`
- Session: `01KXFW9KV4V3ZSZMRSFCQAD9C9`
- Model verification: the command used `--model pro` with no effort flag. The
  selector warning was accepted only after the exact completed pinned
  conversation was active and the accessibility snapshot contained
  `button "Pro"`.
- Accepted TODO: `RDD-T-00000129`

## Decision and root cause

Accepted after local premise verification. Skill slide 3 deliberately excludes
ADR paths from its `Docs` card and presents one separate `ADR` card. Skill slide
8 used separate duplicated grouping logic that included the ADR inside a chart
category still labelled `Docs`. The totals were correct, but the same corpus
appeared to change from 13 to 14 documents without an explanation.

## TDD and implementation

- Red: a fixture with one normal doc, one ADR, one example, and one root source
  expected slide 8 `Docs + ADR` but received `Docs`.
- Green: a shared source-family helper now feeds both slides. Slide 8 combines
  Docs and ADR only for the existing aggregate and labels that category
  conditionally; the no-ADR control retains `Docs`.
- Geometry, native chart/table topology, counts, and MDPR output are unchanged.

## Visual evidence and validation

- Before: `follow-up-cycle-05-skill-visuals/slide-08.png`.
- After: `cycle-05-after-slide-08-6f26467.png`.
- Unchanged control: `cycle-05-after-slide-03-6f26467.png` keeps separate
  `13 Docs` and `1 ADR` cards.
- Comparison contract: 23/23 tests pass.
- Full comparison: MDPR `6f26467`, 35/35 baseline and 9/9 skill exports, 16pt
  minimum, invalid slides 0, named overflow 0, report `ok:true`.
- Result metrics: MDPR 446 shapes, 389 text frames, 54 pictures, 3 tables;
  skill 262 shapes, 259 text frames, 2 tables, and 1 native chart.
