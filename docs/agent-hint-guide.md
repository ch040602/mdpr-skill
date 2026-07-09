# Agent Hint Guide

Agent hints may suggest semantic intent, grouping, importance, key-message
priority, content split/readability candidates, compact icon-search keywords,
template-fill policy, or generated-image candidates. Generated-image candidates
require explicit generated-asset evidence; a large or ambiguous icon is not
enough by itself. Hints cannot specify recipe IDs, variant IDs, boxes,
coordinates, colors, effects, exact icon asset paths, exact image assets,
z-order, typography, or renderer object IDs. Builds must remain valid with
agents disabled.

MDPR accepts hints through `mdpresent build deck.md --hints deck.mdpr-hints.json`
or `mdpresent validate deck.md --hints deck.mdpr-hints.json`. The hint file is
weak metadata only: MDPR validates it, records accepted/rejected/stale counts in
the manifest, and still makes all final parsing, layout, theme, icon, object,
and renderer decisions itself.

Generate an empty source-bound hint manifest:

```bash
node bin/mdpr-skill.js hint \
  --source-sha256 <64hex> \
  --out deck.mdpr-hints.json
```

Generate a hint manifest directly from a PowerPoint or preview selection
context:

```bash
node bin/mdpr-skill.js hint \
  --selection-context selection-context.json \
  --markdown deck.md \
  --out deck.mdpr-hints.json
```

For a template-preserving PPTX/POTX workflow, make the operating mode explicit:

```bash
node bin/mdpr-skill.js hint \
  --selection-context selection-context.json \
  --markdown deck.md \
  --workflow-intent template-fill \
  --template-source hcs-template \
  --preserve-master-slides true \
  --image-policy no-image \
  --image-search-policy disabled \
  --icon-policy no-new-icons \
  --out deck.mdpr-hints.json
```

`template-fill` means preserve the uploaded/current PowerPoint master slides,
layout language, and placeholders as the theme source. mdpr-skill may suggest
semantic slot roles, key-message priority, content splitting, and readability
cleanup, but it must not suggest new cards, surface systems, icons, generated
images, raw colors, typography, coordinates, or exact PPT objects. Use
`style-transform` only when the user explicitly asks to change the visual
system.

MDPR owns Markdown paragraph marker normalization. Runtime parsing normalizes
dash and bullet-like lines such as `-item`, `•`, `·`, `–`, `—`, `−`, `ㆍ`, and
`▪` into stable list structure while preserving `---` slide breaks, pipeline
arrows, negative-number prose, fenced code, indented code, and raw `<pre>`
blocks. mdpr-skill may emit source-cleanup or readability notes around those
markers, and may reference MDPR source-cleanup diagnostics when present, but
agent hints must not choose marker-specific layout, bullet glyphs, indentation,
or rendering.

`taste-skill` is useful as a comparison reference for process discipline, not
as a PPT rendering authority. The equivalent preflight for mdpr-skill is:
one primary key message per slide by default, minimal hint coverage, no hint
that restates every source block, and no template-fill hint that adds image,
icon, or style-transform candidates without explicit evidence.

`--markdown` is optional but recommended. When present, mdpr-skill hashes the
current Markdown and rejects the selection context if `source.sourceSha256` is
stale, preventing a hint file that MDPR would later ignore.
The same stale-source check is available for approval-bound PowerPoint
proposals through `ppt propose --markdown`.
Successful markdown-bound commands include `sourceVerified: true` and
`sourceSha256` in their CLI JSON summary so CI logs can prove the source guard
ran.

Apply the hint manifest through MDPR:

```bash
mdpresent build deck.md \
  --to pptx \
  --hints deck.mdpr-hints.json
```

Each hint file is bound to the Markdown source with `sourceSha256`. Stale hints
are ignored by default and become validation errors when MDPR runs with
`--strict`.

```json
{
  "schemaVersion": "mdpr-agent-hint-v1",
  "sourceSha256": "<sha256 of deck.md>",
  "generatedBy": "mdpr-skill",
  "hints": [
    {
      "slideId": "slide-adoption-funnel",
      "intentCandidate": "evidence",
      "confidence": 0.86,
      "groupCandidates": [
        {
          "elementIds": ["b2", "b3"],
          "role": "evidence-pack",
          "confidence": 0.8
        }
      ],
      "importanceCandidates": [
        {
          "elementId": "b2",
          "importance": "primary",
          "confidence": 0.82
        }
      ],
      "workflowIntentCandidate": {
        "intent": "template-fill",
        "confidence": 0.86,
        "evidenceRefs": ["template:hcs-template"]
      },
      "keyMessageCandidates": [
        {
          "messageRole": "main-takeaway",
          "emphasisLevel": "primary",
          "elementIds": ["b2"],
          "preferredPlaceholderRole": "title",
          "reason": "Main takeaway should stay bound to the claim placeholder.",
          "confidence": 0.78
        }
      ],
      "contentSplitCandidates": [
        {
          "reason": "dense-content",
          "elementIds": ["b2", "b3", "b4"],
          "preferredSplitBy": "list-chunk",
          "confidence": 0.76
        }
      ],
      "readabilityCandidates": [
        {
          "action": "shorten-copy",
          "elementIds": ["b3"],
          "reason": "Shorten support copy before changing layout.",
          "confidence": 0.76
        }
      ],
      "templateUseCandidate": {
        "templateSourceRef": "hcs-template",
        "masterSlidePolicy": "preserve-existing-master-slides",
        "placeholderPolicy": "prefer-existing-placeholders",
        "confidence": 0.86
      },
      "mediaPolicyCandidate": {
        "imageUse": "no-image",
        "imageSearch": "disabled",
        "iconUse": "no-new-icons",
        "evidenceRefs": ["template:hcs-template"]
      },
      "rationale": "Review note only."
    }
  ]
}
```

For icon hints, use short meaning words rather than asset names:

```text
Good: validation, database, workflow, color palette, chart evidence
Avoid: use icon file X, place Tabler icon Y at coordinates, make it large
```

MDPR owns the final deterministic icon catalog search. The skill can only suggest candidate meaning keywords when the slide semantics are ambiguous and the current workflow permits new icons. In `template-fill`, default to `iconUse: "no-new-icons"` unless the user explicitly asks for icons.

Use `visualAssetCandidates` only when the source context includes a source image
reference or the user explicitly requests a generated asset. The default image
policy is `no-image` and `imageSearch: "disabled"`. If source images exist,
use `source-image-only`; if the user explicitly requests generation, use
`generated-asset-approved`. The candidate is a semantic brief for a possible
generated image, not a final image prompt, asset path, style recipe, or
placement instruction.

Generated or searched image assets must remain provenance-bound. A deck-level
source image reference does not authorize images on unrelated slides. Prefer
asset- or slide-scoped refs such as `sourceImageRefs`,
`explicitGeneratedAssetRequestRefs`, or `approvedGeneratedAssetProposalRef` on
each generated asset candidate. mdpr-skill may flag missing provenance, but
MDPR or an approved bridge still owns final asset selection, cropping,
placement, and acceptance.
