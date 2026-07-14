# Follow-up bounded Pro cycle 4

- Time: 2026-07-14T08:11:53Z
- Provider: ChatGPT Pro through `agbrowse web-ai`
- Conversation: `https://chatgpt.com/c/6a54e470-a2bc-83e8-aa5a-5ae4916e88f2`
- Session: `01KXFS3RHBE7A46J6F3X3K9JN1`
- Model verification: the command used `--model pro` with no effort flag. After
  completion, the exact pinned conversation was active and the accessibility
  snapshot contained `button "Pro"`.
- Accepted TODO: MDPR `RDD-T-00000047`

## Decision and root cause

Accepted after local premise verification. The renderer already emitted one
target-end triangle per directed edge, but emitted every connector before the
node surfaces. Because endpoints intentionally overlap the target boundary by a
small amount, horizontal and elbow-final arrowheads were hidden by the later
card surface. The defect was z-order, not missing edge metadata.

## Minimal implementation

Connector routes are computed once. Nonterminal elbow segments remain behind
the nodes, node surfaces render next, and only terminal segments render above
those surfaces and below node decorations, badges, and text. Source order,
route points, node rectangles, labels, shape count, and editability are
unchanged.

## TDD and visual evidence

- Red: the renderer test failed because terminal connectors preceded the node
  surfaces in slide XML.
- Green: renderer tests pass 62/62 and require exactly two target markers in the
  three-node fixture, after all node surfaces and before the first badge.
- Before: `follow-up-cycle-04-visuals/slide-05.png` and `slide-08.png`.
- After: `follow-up-cycle-04-after/slide-05.png` and `slide-08.png`.
- Fresh PowerPoint RGB exports show right-, left-, up-, and down-facing
  arrowheads without text intrusion.

## Validation

- MDPR renderer: 62/62 tests pass.
- MDPR workspace: `corepack pnpm test` passes.
- Runtime commit: `6f26467`.
