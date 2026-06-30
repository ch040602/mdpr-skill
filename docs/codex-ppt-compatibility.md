# Codex PPT Compatibility Map

This document records how `mdpr-skill` maps the public `codex-ppt-skill`
workflow into MDPR-native implementation rails.

Reference source reviewed:

- Repository: `https://github.com/ningzimu/codex-ppt-skill`
- Local review ref: `93c1e013965a3b42f272252030b2e1a5abede710`
- Reviewed files: `SKILL.md`, workflow gates, outline/style/sample,
  backend selection, user assets, slide jobs/subagents, assembly/reporting,
  style library, and `README_en.md`

## Boundary

`codex-ppt` generates one full-slide image per page, then assembles those
images into a PPTX. MDPR's default output remains editable PPTX, HTML, and
PDF. Compatibility therefore means feature parity at the workflow and visual
system level, not replacing MDPR with a full-slide image renderer.

Use:

```bash
mdpr-skill codex-ppt compat \
  --source-ref ningzimu/codex-ppt-skill@93c1e013965a3b42f272252030b2e1a5abede710 \
  --out artifacts/codex-ppt-compat/codex-ppt-compat.json
```

The command writes `mdpr-codex-ppt-compat-v1`. The report must have
`coverage.unmappedFeatureCount: 0` before claiming that codex-ppt features have
a defined MDPR implementation path.
Runtime gaps must also appear in `implementationTodos`; each TODO names the
owner repo, covered feature ids, dependencies, acceptance criteria, validation
commands, and documentation targets.

To export codex-ppt-style per-slide task packets from an MDPR build:

```bash
mdpr-skill codex-ppt slide-tasks \
  --manifest artifacts/external-markdown-visual-eval/iteration-05/build/mdpresent-manifest.json \
  --markdown artifacts/external-markdown-visual-eval/iteration-05/corpus.md \
  --rendered-images artifacts/codex-ppt-slide-tasks/iteration-05/rendered-images.json \
  --out artifacts/codex-ppt-slide-tasks/iteration-05/tasks
```

The command writes `mdpr-slide-task-packet-v1` files plus a
`mdpr-slide-task-packet-set-v1` index. Packets are self-contained enough for
single-slide review or repair-proposal workers, but they intentionally exclude
geometry, renderer object identities, z-order, exact colors, and final layout
decisions.

To track long-running review or repair workers without treating chat messages
as completion evidence:

```bash
mdpr-skill codex-ppt job-state init \
  --tasks artifacts/codex-ppt-slide-tasks/iteration-05/tasks/slide-task-packets.json \
  --manifest artifacts/external-markdown-visual-eval/iteration-05/build/mdpresent-manifest.json \
  --out artifacts/codex-ppt-slide-tasks/iteration-05/mdpr-job-state.json

mdpr-skill codex-ppt job-state update \
  --state artifacts/codex-ppt-slide-tasks/iteration-05/mdpr-job-state.json \
  --slide slide-01 \
  --status accepted \
  --worker-id worker-a \
  --evidence review/slide-01.acceptance.json \
  --out artifacts/codex-ppt-slide-tasks/iteration-05/mdpr-job-state.json

mdpr-skill codex-ppt job-state status \
  --state artifacts/codex-ppt-slide-tasks/iteration-05/mdpr-job-state.json
```

The state file uses `mdpr-job-state-v1`, tracks `pending`, `dispatched`,
`recorded`, `blocked`, and `accepted`, and requires artifact/report evidence
for recorded or accepted work. The mirrored MDPR CLI contract is
`mdpresent job-state validate <state.json|build-dir> --json` and
`mdpresent job-state status <state.json|build-dir> --json`.

Generated visual asset provider and quality metadata is recorded separately
from agent hints and renderer layout:

```bash
mdpr-skill codex-ppt generated-assets validate \
  --manifest artifacts/codex-ppt-generated-assets/sample.generated-assets.json

mdpresent generated-assets validate \
  artifacts/codex-ppt-generated-assets/sample.generated-assets.json --json
```

The `mdpr-generated-assets-v1` contract records provider id, model, prompt
hash, source input hashes, size, quality, background, transparency policy, and
output provenance. Validation rejects secret-like provider fields and
full-slide renderer requests, and warns when requested quality or transparency
is not listed as supported by provider metadata.

## Mapping Summary

| codex-ppt feature family | MDPR / mdpr-skill rail |
| --- | --- |
| staged approvals | change requests, eval gates, review reports |
| outline planning | Markdown outline, narrative review, split override candidate |
| unified visual style | theme candidate, profile, rulebook, coherence lint |
| built-in style references | MDPR `pack` registry, profiles, style gallery |
| custom style replication | `DESIGN.md` import, rendered-reference review |
| reusable style library | approval-bound theme/profile/rulebook registration |
| image backend selection | generated visual asset rail |
| image provider/quality policy | `mdpr-generated-assets-v1` validation |
| required image insertion | asset manifest and source-to-slide evidence ledger |
| per-slide jobs | `codex-ppt slide-tasks` manifest slice export |
| parallel subagents | `codex-ppt job-state` plus MDPR `job-state` validate/status |
| full-slide image generation | editable-native PPTX plus generated visual assets |
| QA and repair | MDPR validation, rendered-preview review, coherence lint |
| speaker notes | speaker-note review artifact and MDPR notes import |
| PPTX assembly | MDPR editable PPTX export |

## Runtime Work Still Needed

All reviewed codex-ppt feature families now have an MDPR or mdpr-skill
implementation surface in the compatibility map. The current map keeps
`coverage.unmappedFeatureCount: 0` and `coverage.mdprRuntimeRequiredCount: 0`.

Future improvements can deepen built-in profile coverage, add more official
theme packs, or connect generated asset provenance to richer MDPR reports, but
they are no longer unmapped runtime blockers for codex-ppt workflow parity.

Implemented in `mdpr-skill`:

- `codex-ppt slide-tasks`: exports per-slide task packets from MDPR manifests
  for bounded review/repair orchestration.
- `codex-ppt job-state`: initializes, updates, summarizes, and validates
  evidence-bound `mdpr-job-state-v1` files for long-running slide work.
- `codex-ppt generated-assets`: validates `mdpr-generated-assets-v1` provider,
  quality, size, background, transparency, provenance, and no-secret policy.
