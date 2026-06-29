# Agent Hint Guide

Agent hints may suggest semantic intent, grouping, importance, compact icon-search
keywords, or generated-image candidates for cases where an icon would need to be
large or the metaphor is ambiguous. They cannot specify recipe IDs, variant IDs,
boxes, coordinates, colors, effects, exact icon asset paths, exact image assets,
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
      "iconKeywordCandidates": ["funnel", "activation"],
      "visualAssetCandidates": [
        {
          "kind": "generated-image",
          "trigger": "large-or-ambiguous-icon",
          "semanticPrompt": "activation funnel handoff",
          "confidence": 0.72
        }
      ],
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

MDPR owns the final deterministic icon catalog search. The skill can only suggest candidate meaning keywords when the slide semantics are ambiguous.

Use `visualAssetCandidates` only when a small monotone icon would not carry the
meaning well, for example when the icon would have to become a large decorative
object or the metaphor is unclear. The candidate is a semantic brief for a
possible generated image, not a final image prompt, asset path, style recipe, or
placement instruction.
