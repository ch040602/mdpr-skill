# Agent Hint Guide

Agent hints may suggest semantic intent, grouping, importance, or compact icon-search keywords. They cannot specify recipe IDs, variant IDs, boxes, coordinates, colors, effects, exact icon asset paths, z-order, typography, or renderer object IDs. Builds must remain valid with agents disabled.

MDPR accepts hints through `mdpresent build deck.md --hints deck.mdpr-hints.json`
or `mdpresent validate deck.md --hints deck.mdpr-hints.json`. The hint file is
weak metadata only: MDPR validates it, records accepted/rejected/stale counts in
the manifest, and still makes all final parsing, layout, theme, icon, object,
and renderer decisions itself.

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
