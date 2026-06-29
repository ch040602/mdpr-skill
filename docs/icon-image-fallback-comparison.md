# Icon Image Fallback Comparison

This comparison uses one concrete scenario: a reviewer says an icon would be too
large or too ambiguous, so generated imagery should be considered instead. The
same source and selection context are stored under
`artifacts/icon-image-fallback-comparison/`.

## Generated Files

- Source Markdown:
  `artifacts/icon-image-fallback-comparison/source.md`
- Selection context:
  `artifacts/icon-image-fallback-comparison/selection-context.json`
- Pure MDPR build:
  `artifacts/icon-image-fallback-comparison/mdpr-build/deck.pptx`
- Pure MDPR manifest:
  `artifacts/icon-image-fallback-comparison/mdpr-build/mdpresent-manifest.json`
- MDPR build with mdpr-skill hints:
  `artifacts/icon-image-fallback-comparison/mdpr-guided-build/deck.pptx`
- MDPR guided manifest:
  `artifacts/icon-image-fallback-comparison/mdpr-guided-build/mdpresent-manifest.json`
- Simple Codex skill comparison artifact:
  `artifacts/icon-image-fallback-comparison/simple-codex-skill-output.json`
- Previous mdpr-skill behavior snapshot:
  `artifacts/icon-image-fallback-comparison/mdpr-skill-before-agent-hint.json`
- Current mdpr-skill hint:
  `artifacts/icon-image-fallback-comparison/mdpr-skill-agent-hint.json`
- Current mdpr-skill change request:
  `artifacts/icon-image-fallback-comparison/mdpr-skill-change-request.json`

Regenerate the direct mdpr-skill hint output:

```bash
node bin/mdpr-skill.js hint \
  --selection-context artifacts/icon-image-fallback-comparison/selection-context.json \
  --markdown artifacts/icon-image-fallback-comparison/source.md \
  --out artifacts/icon-image-fallback-comparison/mdpr-skill-agent-hint.json \
  --generated-at 2026-06-29T00:00:00Z
```

The command summary should include `sourceVerified: true` and the source
`sourceSha256`.

Regenerate the mdpr-skill approval-bound change request:

```bash
node bin/mdpr-skill.js ppt propose \
  --selection-context artifacts/icon-image-fallback-comparison/selection-context.json \
  --markdown artifacts/icon-image-fallback-comparison/source.md \
  --out artifacts/icon-image-fallback-comparison/mdpr-skill-change-request.json \
  --generated-at 2026-06-29T00:00:00Z
```

This command uses the same source guard and also reports `sourceVerified: true`
in the CLI summary.

Regenerate the pure MDPR baseline:

```bash
node .cache/mdpr/packages/cli/dist/index.js build \
  artifacts/icon-image-fallback-comparison/source.md \
  --to pptx \
  --out artifacts/icon-image-fallback-comparison/mdpr-build \
  --design clean
```

Regenerate the MDPR build with mdpr-skill hints:

```bash
node .cache/mdpr/packages/cli/dist/index.js build \
  artifacts/icon-image-fallback-comparison/source.md \
  --to pptx \
  --out artifacts/icon-image-fallback-comparison/mdpr-guided-build \
  --design clean \
  --hints artifacts/icon-image-fallback-comparison/mdpr-skill-agent-hint.json
```

## Before and After

| Mode | Before applying the new fallback | After applying the new fallback | Evidence |
| --- | --- | --- | --- |
| Simple Codex skill | Produces unstructured advice such as "use a large icon or generate an image." It is not an MDPR-consumable contract. | Still unstructured if used alone; it can describe intent but cannot safely carry it into MDPR without a schema bridge. | `simple-codex-skill-output.json` |
| MDPR | Builds the deck deterministically from Markdown. The generated manifest records `agentHints.enabled: false`, `accepted: 0`, and `slideCount: 3`. | With the mdpr-skill hint supplied, MDPR records `agentHints.enabled: true`, `accepted: 1`, `rejected: 0`, `ignoredBecauseStale: 0`, and `forbiddenFieldCount: 0`. MDPR still owns parsing, layout, asset acceptance, and final PPTX objects. | `mdpr-build/mdpresent-manifest.json`, `mdpr-guided-build/mdpresent-manifest.json` |
| mdpr-skill | Same selection context produced only a general selection hint with confidence `0.62`; no generated-image fallback signal existed. | `hint --selection-context --markdown` now emits a schema-valid `visualAssetCandidates[0]` with `kind: "generated-image"`, `trigger: "large-or-ambiguous-icon"`, and a semantic prompt, while rejecting stale selection contexts before MDPR silently ignores them. `ppt propose --markdown` applies the same stale-source guard before wrapping the hint in an approval-bound change request. Both guarded commands report `sourceVerified: true` in their CLI summaries. | `mdpr-skill-before-agent-hint.json`, `mdpr-skill-agent-hint.json`, `mdpr-skill-change-request.json` |

## Practical Difference

The useful change is not that mdpr-skill generates the image itself. The useful
change is that it now records the decision as weak, replayable, schema-valid
metadata:

```json
{
  "kind": "generated-image",
  "trigger": "large-or-ambiguous-icon",
  "semanticPrompt": "아이콘이 너무 크거나 의미가 애매하다면 이미지 생성으로 처리해줘",
  "confidence": 0.72
}
```

That gives the downstream MDPR/runtime side a clear handoff point:

- simple Codex skill can notice the issue but has no deterministic contract;
- MDPR can render the deck without hints, and accepts the mdpr-skill hint when
  it is supplied;
- mdpr-skill bridges the two by emitting a bounded candidate through the direct
  `hint --selection-context --markdown` path, and by using the same source
  guard for `ppt propose --markdown`, while leaving final rendering decisions
  to MDPR.

## Boundary Check

The generated hint does not contain an icon name, icon path, image path,
coordinates, size, color, style recipe, z-order, or renderer object ID. It is a
semantic candidate only.
