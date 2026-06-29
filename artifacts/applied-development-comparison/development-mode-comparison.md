# Applied Development Mode Comparison

This comparison summarizes what changed when the same presentation-development
work was evaluated as a simple Codex skill, MDPR-only runtime output, and
`mdpr-skill` plus MDPR. The source evidence is already committed in the
repository; this file ties those artifacts into one reviewable comparison.

## Evidence

- `artifacts/icon-image-fallback-comparison/simple-codex-skill-output.json`
- `artifacts/icon-image-fallback-comparison/mdpr-build/mdpresent-manifest.json`
- `artifacts/icon-image-fallback-comparison/mdpr-guided-build/mdpresent-manifest.json`
- `artifacts/icon-image-fallback-comparison/mdpr-skill-agent-hint.json`
- `artifacts/icon-image-fallback-comparison/mdpr-skill-change-request.json`
- `artifacts/mdpr-vs-skill/mdpr-vs-skill-report.json`
- `artifacts/llm-before-after/llm_before_after_report.json`

## Comparison

| Mode | Before | After applying the improved flow | Runtime evidence |
| --- | --- | --- | --- |
| `simple-codex-skill` | Notices that a large or ambiguous icon may need image generation, but returns unstructured prose. | Still useful for human review, but not MDPR-consumable without a schema bridge. | `mdprConsumable=false`, `schemaValidAgentHint=false` |
| `mdpr-only` | Deterministically builds from Markdown and owns parsing, layout, theme, assets, and validation. | In the icon fallback scenario it records `agentHints.enabled=false`, `accepted=0`, and `slideCount=3`; in the broader run it produces a 46-slide MDPR corpus deck. | 46-slide MDPR corpus, 816 shapes, 648 text frames, 3 tables |
| `mdpr-skill-plus-mdpr` | Previously emitted only a general selection hint for the ambiguous icon case. | Emits a schema-valid generated-image candidate, rejects stale source contexts, wraps proposals as approval-bound change requests, and keeps MDPR as final renderer. | 10-slide mdpr-skill evidence deck, 321 shapes, 2 tables, 1 chart, guided hint `accepted=1` |

## Resulting README Positioning

The comparison supports a narrower and more useful README message:

- use plain Codex skill output only as advisory review;
- use MDPR when the job is deterministic Markdown-to-PPTX generation;
- use `mdpr-skill + MDPR` when development needs replayable semantic hints,
  source guards, approval-bound proposals, and review evidence before MDPR
  renders.

The JSON companion is
`artifacts/applied-development-comparison/development-mode-comparison.json`
and this Markdown companion is
`artifacts/applied-development-comparison/development-mode-comparison.md`; both
use schema version `mdpr-development-mode-comparison-v1`.
