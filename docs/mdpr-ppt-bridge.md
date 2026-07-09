# MDPR PowerPoint Bridge Boundary

This document defines how `mdpr-skill`, MDPR, and a future `mdpr-ppt` bridge
can share PowerPoint context without giving an agent final design authority.

## Three Rails

| Rail | Producer | Final coordinates/colors/recipes/variants | MDPR input |
| --- | --- | --- | --- |
| hint rail | `mdpr-skill` / agent | Forbidden | `agent-hint.json` with weak semantic hints |
| review rail | `mdpr-skill` / agent | Forbidden | `review-report.json` with findings and MDPR policy suggestions |
| edit-intent rail | `mdpr-skill` / agent | Forbidden | `mdpr-edit-intent-v1` inside a proposed change request |
| approved override / pack rail | `mdpr-ppt` plus explicit user approval | Allowed only after approval | `override.json`, `style-pack.json`, `component-pack.json` |

MDPR remains the deterministic runtime. `mdpr-skill` may propose semantic
grouping, importance, intent, icon-keyword ideas, and review findings. It must
not create final coordinates, raw colors, typography, z-order, arrow geometry,
component variants, renderer object IDs, or exact icon asset decisions.
In short, `mdpr-skill` must not create final coordinates.

## Workflow Intent

PowerPoint bridge flows should classify the requested work before producing
hints or proposals:

| Intent | Meaning | Default media behavior |
| --- | --- | --- |
| `template-fill` | Preserve the existing PPTX/POTX masters, placeholders, and theme frame while filling or simplifying content. | `imageUse: no-image`, `imageSearch: disabled`, `iconUse: no-new-icons` |
| `template-fidelity-review` | Review whether MDPR output preserved masters, placeholders, source mapping, and editability. | Evidence-only review findings |
| `style-transform` | Create a new visual direction or reusable style system. Requires explicit user approval. | Approval-bound proposal only |
| `theme-import` | Treat a source design as a reusable visual system, not slide content to copy. | Approval-bound theme candidate |
| `generated-asset-request` | User explicitly asks for generated imagery or source-image-aware assets. | Generated asset rail with provenance |

When a user supplies or references an existing PPT theme and does not ask for a
new visual system, prefer `template-fill`. Existing master slides are the theme
source; mdpr-skill may ask MDPR to preserve them, but must not restyle them.
Do not use text overlays when placeholder roles are available, and do not
search for or generate images unless there is source image evidence or an
explicit generated-asset request.
Placeholder preservation evidence should be scoped by slide and role. A single
deck-level placeholder fill reference proves that at least one placeholder was
used, but it must not mask a different slide that bypassed an available title,
body, caption, chart, table, or image placeholder with a new overlay object.

Image asset evidence should be scoped by asset or slide. A source image on one
slide does not authorize generated imagery elsewhere. Generated or searched
image candidates should carry a local `sourceImageRefs`,
`explicitGeneratedAssetRequestRefs`, or `approvedGeneratedAssetProposalRef`
before MDPR or an approved bridge considers the final asset.

## Edit Intent Rail

The edit-intent rail is for natural-language editing UX. A user or agent may
say things like "make slide 3 more data focused", "turn the list page into a
numbered rail", or "make the proof point more prominent". `mdpr-skill` stores
that as `mdpr-edit-intent-v1`, not as coordinates or raw style values.

Allowed edit-intent fields:

- target slide references, block hints, and region hints
- high-level emphasis changes
- high-level layout families such as `chart-table`, `timeline`, `matrix`, or
  `summary`
- high-level decoration families such as `numbered-rail`, `callout`,
  `proof-point`, `minimal`, `glass`, `data`, or `icon-aside`
- semantic grouping roles and icon keyword candidates

Forbidden edit-intent fields are the same final-decision fields forbidden in
agent hints: coordinates, raw colors, typography, z-order, exact recipe IDs,
variants, exact icon paths, geometry, arrows, and renderer object IDs.

Edit intents become `edit-intent` entries inside `mdpr-change-request-v1`.
They remain proposals until reviewed and approved. MDPR still owns the final
layout family resolution, recipe selection, renderer output, and validation.
When `mdpr-skill ppt propose` receives `--markdown`, it must reject a selection
context whose `source.sourceSha256` does not match the current Markdown file.
That keeps approval-bound proposals from carrying hints or edit intents for an
older source revision.
When the check succeeds, the CLI summary reports `sourceVerified: true` and the
verified `sourceSha256`.

## `mdpr-ppt` Role

`mdpr-ppt` should be a PowerPoint bridge, not an agent layout generator.

Allowed bridge responsibilities:

- capture a user-selected shape, anchor shape, region, or style sample
- snapshot geometry, style, text presence, and PowerPoint object identity
- map the selected object back to MDPR slide, region, and block identifiers
- emit user-approved selection, override, style-pack, or component-pack
  candidates

Forbidden bridge responsibilities:

- silently replacing Markdown or MDPR IR as the source of truth
- sending selected coordinates through `agent-hint.json`
- allowing review findings to directly mutate layout coordinates or theme
  colors
- applying pack or override candidates without explicit user approval

Edit intents may express semantic split preferences such as preserving a dense
slide as one generated slide. `mdpr-skill` can convert that preference into a
`setSplit` override candidate, but the candidate remains in the approved
override rail and must pass user approval before MDPR runtime use.
The CLI path is `mdpr-skill edit override-candidate ...`; it emits an MDPR
override manifest candidate and still avoids raw coordinates, colors, recipes,
variants, and renderer object IDs.

## Schemas

MDPR owns the source-of-truth contracts for bridge and design proposal schemas.
`mdpr-skill` keeps synced copies only so its gates can validate companion
artifacts before handing them to MDPR.

`schemas/mdpr-ppt-selection.schema.json` defines `mdpr-ppt-selection-v1`.
It may contain PowerPoint point units, raw shape snapshots, and style evidence
because it is a user-selected evidence rail.

`schemas/mdpr-selection-context.schema.json` defines `mdpr-selection-context-v1`.
It is the reduced context that review and hint code may consume. Coordinates
remain evidence only; they are not final layout instructions.

`schemas/mdpr-ppt-pack-candidate.schema.json` and
`schemas/mdpr-user-override-candidate.schema.json` define approved bridge rail
candidates. They may carry selected PowerPoint style or override evidence only
after explicit user approval.

`schemas/mdpr-theme-candidate.schema.json` and
`schemas/mdpr-html-design-analysis.schema.json` define design proposal rail
artifacts. They can contain tokens and PPT effect feasibility evidence, but
they are not agent hints and must pass approval and MDPR pack import gates
before runtime use.
`mdpr-theme-candidate-v1` may also carry semantic layout blueprints,
decoration families, and registration targets for `mdpr-theme-pack`,
`mdpr-profile`, `mdpr-rulebook`, or `deck-local-style-pack`. Those fields are
style-system proposals only. MDPR still owns final recipe selection, layout
resolution, theme binding, design-lock updates, validation, and rendering.

`schemas/mdpr-change-request.schema.json` defines `mdpr-change-request-v1`.
It records proposal stages:

- `proposed`
- `reviewed`
- `approved`
- `applied`
- `rejected`

Only approved changes may become runtime inputs. Agent-created changes should
enter as proposals and pass boundary, schema, provenance, and regression gates.
Approved and applied change requests both require approval metadata. Helper
APIs reject invalid source hashes, empty change lists, and malformed approval
timestamps before runtime use.

`schemas/mdpr-edit-intent.schema.json` defines `mdpr-edit-intent-v1`. It is
used for safe natural-language edit proposals such as page emphasis, layout
family, or decoration family changes. It cannot contain final design fields.

## Runtime Boundary

MDPR owns:

- parsing and split decisions
- slide and object layout
- theme color derivation
- typography and overflow handling
- renderer object generation
- pack import and override application
- validation and manifest output

`mdpr-skill` owns:

- weak semantic hint generation
- safe edit-intent proposal generation
- review findings
- baseline/guided evaluation
- schema sync and boundary gates, including synced MDPR bridge/design schemas:
  `mdpr-pptx-object-map.schema.json`, `mdpr-selection-context.schema.json`,
  `mdpr-ppt-selection.schema.json`, `mdpr-ppt-pack-candidate.schema.json`,
  `mdpr-user-override-candidate.schema.json`,
  `mdpr-theme-candidate.schema.json`, and
  `mdpr-html-design-analysis.schema.json`
- proposal reports and evidence paths
- preflight-style comparison checks inspired by reference repos such as
  `taste-skill`: preserve-first behavior, minimal semantic hints, source-bound
  image usage, and no generic decorative additions in template-fill mode

`mdpr-ppt` owns:

- user-selected PowerPoint object capture
- exact shape/style snapshots
- pack and override candidate export
- approval-bound handoff into MDPR

The core rule is simple: an agent can suggest what content means; MDPR decides
how the final presentation is built.
