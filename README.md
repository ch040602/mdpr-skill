# mdpr-skill

`mdpr-skill` is a thin Codex skill companion for
[MDPR](https://github.com/ch040602/MdPr).

Turn rough Markdown decks into reviewable, visually scored presentation systems
without letting an agent own the final slide geometry. `mdpr-skill` adds
semantic hints, visual-review loops, codex-ppt compatibility rails, and
comparison ledgers around MDPR. MDPR remains the deterministic presentation
runtime.

For LLM-advised high-quality output, run the skill before MDPR finalizes the
deck. For normal Markdown-to-PPTX generation, use MDPR directly.

Positioning:

```text
MDPR is the deterministic runtime. mdpr-skill is the optional agent review
companion. The LLM can suggest; MDPR renders.
```

Star, bug reports, Markdown edge cases, and PPTX feature requests should go to
the main MDPR repository:

- MDPR: https://github.com/ch040602/MdPr
- npm CLI: https://www.npmjs.com/package/@mdpresent/cli
- Preview gallery: https://ch040602.github.io/MdPr/theme-preview/
- New issue: https://github.com/ch040602/MdPr/issues/new/choose

Looking for a first useful PR? Bring one real Markdown deck, one visual review
case, or one reusable style proposal:

- Add a public Markdown corpus case:
  https://github.com/ch040602/mdpr-skill/issues/new?template=markdown_corpus.yml
- Propose a reusable review/theme workflow:
  https://github.com/ch040602/mdpr-skill/issues/new?template=theme_or_review_case.yml
- Pick a bounded starter task:
  https://github.com/ch040602/mdpr-skill/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
- Read the contributor lanes:
  [CONTRIBUTING.md](CONTRIBUTING.md#first-pr-lanes)

![Codex presentations, MDPR, and mdpr-skill plus MDPR visual comparison](docs/assets/mdpr-mode-comparison.png)

## Visual Proof

The latest review run converts 23 unrelated public Markdown sources into a
five-pass MDPR deck battle, exports every page to PNG, assembles codex-ppt
image-only baselines, and runs a 23-prompt `Presentations` probe set. The
completion ledger reports all checks passing: 21/21 codex-ppt feature families
mapped, 23 comparison rows, 25 visual criteria, 23 `Presentations` probes, five
codex-ppt baselines, and no missing evidence artifacts.

![External Markdown visual evaluation contact sheet](docs/assets/external-md-visual-eval-contact-sheet.png)

Key proof artifacts:

- Request completion ledger:
  `artifacts/external-markdown-visual-eval/request-completion-ledger.json`
- Final editable MDPR deck:
  `artifacts/external-markdown-visual-eval/iteration-05/build/deck.pptx`
- Final codex-ppt image-only baseline:
  `artifacts/external-markdown-visual-eval/iteration-05/codex-ppt-baseline/external-md-codex-ppt-iter-05/external-md-codex-ppt-iter-05.pptx`
- `Presentations` probe battle:
  `artifacts/presentations-probe/external-md-visual-eval-23/`

## Difference from MDPR

<!-- mdpr-runtime-skill-comparison -->
Reproducible visual evidence and the remaining limitations are recorded in
[the current MDPR-versus-review results](docs/mdpr-vs-skill-results.md). The
cross-repository schema check is stored in
`artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json`.

Current reproducible comparison: MDPR `c93ac84` renders 35 editable slides and
the companion renders 9 evidence slides; PowerPoint exported 35/35 and 9/9,
both decks keep a 16pt minimum, and neither has an invalid frame or named-card
overflow.

Quick choice: run MDPR to build a deck; add `mdpr-skill` when you also want an
agent review. They are complementary, not competing renderers.

| Decision boundary | MDPR | mdpr-skill |
| --- | --- | --- |
| Use it for | Deterministic Markdown parsing, layout, validation, and editable `PPTX`/`HTML`/`PDF` output | Optional Codex hints, review findings, and comparison evidence before or after an MDPR build |
| Typography authority | Resolves font families, point sizes, region floors, and editable text runs; captions default to `18pt`, and generated code, caption, list badge, and diagram badge text has no sub-`16pt` exception | May suggest shorter copy or a content split, but must not prescribe an exact family, point size, line break, or text-box geometry |
| Strict visual failure | Required `fontHierarchy` checks every text-bearing Layout IR region against `16pt`; image-only and empty decorative regions do not create glyph-floor failures, while code and captions remain covered | Mirrors `MDPR_POLISH_GATE_FAILED` with evidence and must not recompute, soften, or override it |
| Decorative lines | Built-in presets omit automatic title underlines, TOC horizontal rules, and isolated cover-bottom rules | Review evidence omits synthetic subtitles, title rules, and bottom takeaway bands unless source content requires them |
| Visual variety | Tracks visible `card-row-3`, `card-row-4`, grid, stack, split, radial, and specialized-object geometry; horizontal rows use open cells instead of repeating full white cards | Reviews rendered before/after evidence and may propose a deterministic rule, but does not choose a final layout or surface |
| Template fonts | `--template` preserves master/layout/theme OOXML, but generated text uses resolved MDPR typography; set `typography.fontFamily` for an exact family match | Reports a template mismatch; it does not replace master typography or claim that a font is installed or embedded |
| Output ownership | Owns final coordinates, colors, z-order, objects, rendering, and pass/fail | Produces hints, review reports, and evidence only; MDPR still makes every final runtime decision |

## MDPR Validation Handoff

MDPR owns deterministic pass/fail decisions. When a manifest reports a positive
`validation.polish.requiredFailureCount`, `mdpr-skill review` mirrors that
runtime evidence as one error finding instead of making a second aesthetic
judgment:

```json
{
  "severity": "error",
  "type": "MDPR_POLISH_GATE_FAILED",
  "evidence": {
    "requiredFailureCount": 1,
    "failedChapters": ["fontHierarchy"],
    "runtimeOwner": "MDPR"
  }
}
```

Passing manifests with `requiredFailureCount: 0` receive no polish-gate
finding. The skill may explain the failure and propose an MDPR rule or config
improvement, but it cannot override the result or repair final coordinates,
font sizes, image crops, or renderer objects directly.

## Typography Review Rules

MDPR remains the typography authority. Its required `fontHierarchy` chapter
checks for a declared family, a title/body difference of at least `4pt`, a
deck-wide text-bearing Layout IR floor of at least `16pt`, and zero same-role
font-size variance. Image-only and empty decorative regions are excluded;
code, captions, tables, charts, and diagrams remain governed when they carry
text. `mdpr-skill` cites the manifest chapter and its runtime evidence; it does
not recompute or soften those thresholds.

- ordinary hint and review payloads may recommend shorter copy, content splits,
  clearer paragraph levels, or stronger semantic emphasis, but must not prescribe
  exact font families, point sizes, manual line breaks, or text-box geometry
- in `template-fill`, preserve the template's typography and text colors; report
  mismatches as evidence instead of replacing master or layout formatting
- typography tokens copied from a design source are approval-bound candidates,
  not runtime edits, and take effect only after they become an accepted MDPR
  config, pack, or rule
- do not claim that a font is installed or embedded from its family name alone;
  host availability and substitution remain deployment checks

## Applied Comparison

The public repository keeps comparison material at the product-boundary level.
It documents what MDPR owns, what `mdpr-skill` may suggest, and which artifacts
can be reproduced without exposing private benchmark names, source-review
ordering, or implementation sequence.

The image-fallback example is the public applied proof: when the source carries
image evidence or the user explicitly requests a generated asset,
`mdpr-skill` emits a bounded `visualAssetCandidates[0]` entry with
`kind: "generated-image"`, `trigger: "explicit-generated-asset-request"`, and a
request reference. A large or ambiguous icon alone is not enough to request an
image. MDPR still owns final layout, theme, assets, and PPTX rendering. See
[docs/icon-image-fallback-comparison.md](docs/icon-image-fallback-comparison.md)
and the generated artifacts under
`artifacts/icon-image-fallback-comparison/`.

![MDPR theme style proof contact sheet](docs/assets/theme-style-proof-contact-sheet.png)

## Repository Structure

```text
skills/             Codex skill instructions for the optional wrapper
docs/               Skill-side guides, handoff notes, and preview materials
scripts/            Installation, review, validation, and artifact helpers
design_components/  Source-neutral review seeds and design grammar scaffolds
artifacts/          Generated review/example outputs
reports/            Local validation reports
schemas/            Hint, review, design rail, and intermediate schema contracts
packages/           Hint, review, eval, edit, change, and design import helpers
todo/               Development and review-driven task records
```

MDPR source code is not vendored in this repository. The installer prepares a
local MDPR checkout for development and validation; that local checkout is an
install artifact, not the mdpr-skill repository structure. See
[docs/mdpr-installation.md](docs/mdpr-installation.md).

## Security

Do not report vulnerabilities through public GitHub issues. Use the private
reporting path in [SECURITY.md](SECURITY.md).

## Community and Releases

Participation standards are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
User-visible release notes are tracked in [CHANGELOG.md](CHANGELOG.md).
Support routing for MDPR runtime issues, mdpr-skill bugs, feature requests, and
security reports is in [SUPPORT.md](SUPPORT.md).

Maintainer-ready launch copy, community posting targets, and PR recruitment
messages live in [promotion/contributor-outreach-kit.md](promotion/contributor-outreach-kit.md).

## Installation

Install MDPR for normal Markdown-to-PPTX usage:

```bash
npm install -g @mdpresent/cli
mdpresent build deck.md --to pptx,html --out dist
```

After the package is published to npm, install or try the optional
`mdpr-skill` CLI without cloning this repository:

```bash
npm install -g mdpr-skill
mdpr-skill --help
npx mdpr-skill --help
```

Install this optional skill repository when you want Codex-assisted review,
hint generation, and local validation artifacts around MDPR output:

```bash
git clone https://github.com/ch040602/mdpr-skill.git
cd mdpr-skill
npm install
```

Use Node.js 22+ for this repository and its thin local CLI. CI validates Node
22 and Node 24, and the npm package declares the same supported runtime range.

Install the Codex skill from this checkout into your local Codex skills
directory, then invoke it as `$mdpr-skill`:

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
New-Item -ItemType Directory -Force (Join-Path $codexHome "skills") | Out-Null
Copy-Item -Recurse -Force skills\mdpr-skill (Join-Path $codexHome "skills\mdpr-skill")
```

For skill development and validation, prepare or refresh a local MDPR source
checkout:

```bash
npm run install:mdpr
```

Use an existing MDPR checkout when needed:

```bash
MDPR_SOURCE_DIR=/path/to/mdpr npm run install:mdpr
```

Verify the MDPR handoff:

```bash
npm run check:mdpr
npm run check:mdpr-pandoc
```

The repository also exposes a thin local CLI for skill-side artifacts:

```bash
node bin/mdpr-skill.js --help
node bin/mdpr-skill.js docs --list
node bin/mdpr-skill.js docs bootstrap --dense
node bin/mdpr-skill.js docs boundaries --dense
node bin/mdpr-skill.js hint --source-sha256 <64hex> --out .mdpresent/proposals/agent-hint.json
node bin/mdpr-skill.js review --manifest dist/mdpresent-manifest.json --out .mdpresent/review/review-report.json
node bin/mdpr-skill.js narrative --markdown deck.md --manifest dist/mdpresent-manifest.json --source-notes notes.md --out .mdpresent/review/narrative-review.json
node bin/mdpr-skill.js layout-intent --layout-catalog template-layout-catalog.json --out .mdpresent/review/layout-intent.json
node bin/mdpr-skill.js speaker-notes --markdown deck.md --source-notes notes.md --out .mdpresent/review/speaker-notes.json
node bin/mdpr-skill.js citations --markdown deck.md --sources sources.json --as-of 2026-06-27 --out .mdpresent/review/citation-review.json
node bin/mdpr-skill.js rendered-preview --images rendered-images.json --out .mdpresent/review/rendered-preview-review.json
node bin/mdpr-skill.js accessibility --markdown deck.md --audience "executive review" --out .mdpresent/review/accessibility-review.json
node bin/mdpr-skill.js evidence-ledger --markdown deck.md --sources sources.json --mdpr-evidence mdpr-evidence.json --out .mdpresent/review/evidence-ledger.json
node bin/mdpr-skill.js codex-ppt compat --source-ref ningzimu/codex-ppt-skill@93c1e013965a3b42f272252030b2e1a5abede710 --out artifacts/codex-ppt-compat/codex-ppt-compat.json
node bin/mdpr-skill.js codex-ppt slide-tasks --manifest artifacts/external-markdown-visual-eval/iteration-05/build/mdpresent-manifest.json --markdown artifacts/external-markdown-visual-eval/iteration-05/corpus.md --rendered-images artifacts/codex-ppt-slide-tasks/iteration-05/rendered-images.json --out artifacts/codex-ppt-slide-tasks/iteration-05/tasks
node bin/mdpr-skill.js codex-ppt job-state init --tasks artifacts/codex-ppt-slide-tasks/iteration-05/tasks/slide-task-packets.json --manifest artifacts/external-markdown-visual-eval/iteration-05/build/mdpresent-manifest.json --out artifacts/codex-ppt-slide-tasks/iteration-05/mdpr-job-state.json
node bin/mdpr-skill.js codex-ppt generated-assets validate --manifest artifacts/codex-ppt-generated-assets/sample.generated-assets.json
node bin/mdpr-skill.js gate validate-schema-sync --mdpr-path .cache/mdpr
```

These commands create hints, reviews, eval reports, design candidates, and
approval records. They do not choose final coordinates, colors, z-order, or
renderer object IDs; MDPR owns those runtime decisions.

The `docs` command is the agent bootstrap surface. It follows the same
branch-local guidance pattern used by agent-ready design systems such as
Astryx: the CLI prints the commands, boundaries, template-fill rules, media
policy, review flow, design-import rules, and Astryx comparison for the exact
checkout being used. Use `--dense` when an agent needs compact working context
before creating hints or review artifacts.

## Usage

Run MDPR directly when you only need deterministic presentation output. MDPR is
where parser, layout, theme, object, and renderer changes should land.

Run mdpr-skill when you want a review pass before MDPR builds or rebuilds the
deck:

```text
Markdown source
  -> optional mdpr-skill semantic hints and review notes
  -> MDPR deterministic parsing, layout, validation, and rendering
  -> editable PPTX / HTML / PDF
```

The skill is most useful for workflows where an agent can improve the source
and review the generated artifacts, but should not own the final slide layout:

- compact semantic tags for ambiguous Markdown
- icon-search keyword ideas
- safe edit-intent proposals for page, emphasis, layout-family, and decoration-family changes
- approval-bound DESIGN.md theme candidates for MDPR theme/profile/rulebook workflows
- local HTML design analysis with CSS-to-PPT feasibility notes
- coherence and visual policy findings with evidence paths
- evidence-backed mirroring of MDPR `validation.polish` failures through
  `MDPR_POLISH_GATE_FAILED`
- design rail review findings for unsupported PPT effects, raster risks, component drift, and diagram budgets
- Markdown cleanup suggestions before MDPR builds
- review loops that turn generated PPTX/PNG issues into MDPR rule improvements

Create a reusable theme and layout proposal from a local `DESIGN.md`:

```bash
mdpr-skill design import references/editorial-data-review.DESIGN.md \
  --out .mdpresent/proposals/editorial-data-review.theme-candidate.json
```

The candidate may include color, typography, spacing, shape tokens, semantic
layout blueprints, decoration families, and registration targets such as
`mdpr-theme-pack`, `mdpr-profile`, `mdpr-rulebook`, or
`deck-local-style-pack`. This is the MDPR-compatible version of a reusable
style library: `mdpr-skill` captures the visual system and intent, while MDPR
still validates and applies the final theme pack, profile, rulebook, layout,
and PPTX objects.

Useful `DESIGN.md` sections:

```markdown
## Best For

- Executive product reviews.

## Layout Blueprints

- Proof rail: one claim rail with evidence cells; regions: claim, evidence, metric

## Decoration Grammar

- Use numbered rails only for ordered source semantics; use thin rules only as
  proven data or group separators.

## Registration Targets

- mdpr-theme-pack
- mdpr-profile
- mdpr-rulebook
```

Create an approval-bound split override candidate from an edit intent:

```bash
mdpr-skill edit override-candidate \
  --source-sha256 <64hex> \
  --slide-ref "Research Findings" \
  --instruction "Split this section by child findings." \
  --split-by h3 \
  --out .mdpresent/proposals/research.override.json
```

Create a proposal from a PowerPoint selection captured with `mdpr-ppt`:

```bash
mdpr-skill ppt propose \
  --selection-context .mdpresent/review/selection-context.json \
  --markdown deck.md \
  --hints-out .mdpresent/proposals/agent-hint.json \
  --out .mdpresent/proposals/ppt-selection.change-request.json
```

Use this after selecting an object in PowerPoint, opening the `MDPR` tab, and
copying `Copy Selection Context` from the `Inspect Selection` task pane. The
command emits weak semantic hints and an approval-bound edit-intent change
request. It does not emit coordinates, colors, z-order, recipes, or renderer
object IDs; MDPR still owns final layout and rendering.
The `--markdown` check rejects stale selection contexts before they can become
proposals tied to an older Markdown source hash.
Successful guarded commands report `sourceVerified: true` and `sourceSha256`
in their CLI JSON summary.

`eval-core` can run a deterministic baseline MDPR build, rerun MDPR with a
schema-valid `agent-hint.json`, compare quality and performance metrics, and
emit an `mdpr-skill-eval-v1` report. The comparison gate tracks overflow,
coherence warnings, visual errors, text clipping risk, contrast failures,
connector warnings, font-floor regressions, slide-count drift, output size, and
build-time regressions; it does not choose final slide coordinates or styles.
See [eval-core runner](docs/eval-core.md).
See [three-rail implementation status](todo/phase-18-three-rail-implementation-status.md)
for the current completion analysis and remaining TODOs around hint, review,
approved override, pack, and future `mdpr-ppt` boundaries.

Allowed skill outputs:

- semantic intent tags
- grouping and importance hints
- icon-search keyword ideas
- generated-image visual asset candidates for large or ambiguous icon requests
- claim-title and section-flow suggestions
- semantic layout-intent hints from template layout catalogs
- visual concern notes with evidence paths
- speaker-note and reviewer-comment drafts
- citation/provenance findings
- accessibility and plain-language content suggestions
- source-to-slide evidence ledgers
- Markdown cleanup suggestions

Forbidden skill outputs:

- final coordinates
- exact colors
- z-order
- arrow geometry
- shape geometry
- renderer object IDs
- exact icon asset choices

Theme candidates are a separate approved rail. They may contain color,
typography, spacing, shape tokens, semantic layout blueprints, decoration
families, and MDPR registration targets with provenance, but they are not
`agent-hint.json` files and must pass approval/gates before MDPR runtime use.
HTML design analysis is also proposal-only: it records motifs, token candidates,
and PPT editability risks, then review-core turns those risks into MDPR policy
suggestions rather than final coordinates or exact object choices.

The `codex-ppt compat` command maps public `codex-ppt-skill` capabilities into
MDPR-native rails. It is useful when checking whether image-based deck features
such as staged approvals, reusable style references, sample approval, required
asset insertion, subagent slide work, QA repair, and speaker notes have a
defined editable-MDPR implementation path. See
[Codex PPT compatibility map](docs/codex-ppt-compatibility.md).
The `codex-ppt slide-tasks` command implements the per-slide job-packet rail:
it derives one bounded task JSON file per MDPR slide while excluding renderer
internals such as geometry, object ids, z-order, exact colors, and final layout
decisions.
The `codex-ppt job-state` command initializes, updates, summarizes, and
validates `mdpr-job-state-v1` files for long-running slide review or repair
work. Accepted and recorded states require artifact/report evidence, so a chat
message alone cannot mark a slide complete.
The `codex-ppt generated-assets` validator records provider/model/prompt-hash,
size, quality, background, transparency, and provenance metadata for generated
visual assets while rejecting secrets and full-slide renderer requests.

## PowerPoint Bridge Boundary

Future PowerPoint selection workflows are split into three rails:

- `hint rail`: `mdpr-skill` emits weak `agent-hint.json` semantics only.
- `review rail`: `mdpr-skill` emits `review-report.json` findings only.
- `edit-intent rail`: `mdpr-skill` records page or decoration change requests
  as safe proposals, not final geometry.
- `approved override / pack rail`: a user-approved `mdpr-ppt` bridge may emit
  override or pack candidates for MDPR to validate and apply.

See [MDPR PowerPoint bridge boundary](docs/mdpr-ppt-bridge.md) for the schema
and approval contract.

## Validation

Run the local validation pack:

```bash
npm run validate
```

Run the theme-decoration review deck loop:

```bash
npm run review:theme-decoration
```

Run the external Markdown visual evaluation loop:

```bash
npm run eval:external-md
```

This loop collects 20+ Markdown sources, runs five MDPR build/render/review
iterations, exports every page to PNG, creates a `codex-ppt-skill` image-only
PPTX baseline through `assemble_ppt.py`, and scores the run against 25 visual
criteria including coherence, visual guidance, polish, readability, native
editability, and `Presentations` comeback-rubric alignment.
It also writes a source-level dominance ledger with 20+ comparison rows linking
final page PNG evidence, the MDPR editable deck, the codex-ppt image-only
baseline, and the `Presentations` rubric reference.

Generated review artifacts include:

- `artifacts/release-check/mdpr-skill-release-check.md`
- `artifacts/release-check/mdpr-skill-release-check.pptx`
- `artifacts/release-check/mdpr-skill-release-check-report.json`
- `artifacts/theme-decoration-review/theme-decoration-review.pptx`
- `artifacts/theme-decoration-review/theme-decoration-review-iteration-report.json`
- `docs/assets/theme-style-cover-contact-sheet.png`
- `docs/assets/theme-style-proof-contact-sheet.png`
- `docs/assets/mdpr-mode-comparison.png`
- `docs/assets/theme-decoration-review-matrix.png`
- `docs/assets/pipeline-overview.pptx`
- `docs/assets/pipeline-overview.png`
- `artifacts/external-markdown-visual-eval/external-markdown-visual-eval-report.json`
- `artifacts/external-markdown-visual-eval/request-completion-ledger.json`
- `artifacts/external-markdown-visual-eval/dominance-comparison-ledger.json`
- `artifacts/external-markdown-visual-eval/iteration-05/build/deck.pptx`
- `artifacts/external-markdown-visual-eval/iteration-05/codex-ppt-baseline/external-md-codex-ppt-iter-05/external-md-codex-ppt-iter-05.pptx`
- `artifacts/external-markdown-visual-eval/iteration-05/contact-sheet.png`
- `artifacts/presentations-probe/external-md-visual-eval/*.pptx`
- `artifacts/presentations-probe/external-md-visual-eval/*-contact-sheet.png`
- `artifacts/presentations-probe/external-md-visual-eval-23/presentations-probe-battle-manifest.json`
- `artifacts/presentations-probe/external-md-visual-eval-23/**/*.pptx`
- `artifacts/presentations-probe/external-md-visual-eval-23/**/*.png`
- `artifacts/mdpr-vs-skill/mdpr-baseline-result.pptx`
- `artifacts/mdpr-vs-skill/mdpr-skill-result.pptx`
- `artifacts/icon-image-fallback-comparison/mdpr-build/deck.pptx`
- `artifacts/icon-image-fallback-comparison/mdpr-guided-build/deck.pptx`
- `artifacts/icon-image-fallback-comparison/mdpr-skill-agent-hint.json`

The public repository stores aggregate reference metrics and derived structural
grammar only. It does not store source URLs, downloaded reference PPT files,
source thumbnails, copied layouts, copied images, or brand-like objects from the
reference corpus.

## Documentation

- [Contributing guide](CONTRIBUTING.md)
- [MDPR installation and handoff](docs/mdpr-installation.md)
- [Agent hint guide](docs/agent-hint-guide.md)
- [Eval-core runner](docs/eval-core.md)
- [MDPR PowerPoint bridge boundary](docs/mdpr-ppt-bridge.md)
- [MDPR vs skill results](docs/mdpr-vs-skill-results.md)
- [Icon image fallback comparison](docs/icon-image-fallback-comparison.md)
- [Structural pattern taxonomy](docs/structural-pattern-taxonomy.md)
- [Actions page materials](docs/actions-page-materials.md)
- [Generator comparison boundary](docs/generator-comparison.md)
- [Codex PPT compatibility map](docs/codex-ppt-compatibility.md)

MDPR runtime documentation lives in the MDPR repository:

- [MDPR](https://github.com/ch040602/MdPr)
- [mdpr-skill](https://github.com/ch040602/mdpr-skill)

## Acknowledgements

This skill uses source-neutral design vocabulary and local SVG/icon references.
Relevant upstream references include:

- [MDPR](https://github.com/ch040602/MdPr)
- [Google Material Design Icons](https://github.com/google/material-design-icons)
- [Simple Icons](https://github.com/simple-icons/simple-icons)
- [SVG Repo](https://www.svgrepo.com/)
- [Tabler Icons](https://github.com/tabler/tabler-icons)
