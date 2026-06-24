# MDPR PowerPoint Bridge Boundary

This document defines how `mdpr-skill`, MDPR, and a future `mdpr-ppt` bridge
can share PowerPoint context without giving an agent final design authority.

## Three Rails

| Rail | Producer | Final coordinates/colors/recipes/variants | MDPR input |
| --- | --- | --- | --- |
| hint rail | `mdpr-skill` / agent | Forbidden | `agent-hint.json` with weak semantic hints |
| review rail | `mdpr-skill` / agent | Forbidden | `review-report.json` with findings and MDPR policy suggestions |
| approved override / pack rail | `mdpr-ppt` plus explicit user approval | Allowed only after approval | `override.json`, `style-pack.json`, `component-pack.json` |

MDPR remains the deterministic runtime. `mdpr-skill` may propose semantic
grouping, importance, intent, icon-keyword ideas, and review findings. It must
not create final coordinates, raw colors, typography, z-order, arrow geometry,
component variants, renderer object IDs, or exact icon asset decisions.
In short, `mdpr-skill` must not create final coordinates.

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

## Schemas

`schemas/mdpr-ppt-selection.schema.json` defines `mdpr-ppt-selection-v1`.
It may contain PowerPoint point units, raw shape snapshots, and style evidence
because it is a user-selected evidence rail.

`schemas/mdpr-selection-context.schema.json` defines `mdpr-selection-context-v1`.
It is the reduced context that review and hint code may consume. Coordinates
remain evidence only; they are not final layout instructions.

`schemas/mdpr-change-request.schema.json` defines `mdpr-change-request-v1`.
It records proposal stages:

- `proposed`
- `reviewed`
- `approved`
- `applied`
- `rejected`

Only approved changes may become runtime inputs. Agent-created changes should
enter as proposals and pass boundary, schema, provenance, and regression gates.

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
- review findings
- baseline/guided evaluation
- schema sync and boundary gates
- proposal reports and evidence paths

`mdpr-ppt` owns:

- user-selected PowerPoint object capture
- exact shape/style snapshots
- pack and override candidate export
- approval-bound handoff into MDPR

The core rule is simple: an agent can suggest what content means; MDPR decides
how the final presentation is built.
