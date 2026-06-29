# mdpr-skill

`mdpr-skill` is a thin Codex skill companion for
[MDPR](https://github.com/ch040602/MdPr).

Use this repository when you want LLM-advised presentation review around MDPR:
compact semantic hints, icon-keyword ideas, visual-review loops, and review
artifacts. MDPR remains the deterministic presentation runtime.

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

![MDPR theme style proof contact sheet](https://raw.githubusercontent.com/ch040602/mdpr-skill/main/docs/assets/theme-style-proof-contact-sheet.png)

## Difference from MDPR

| Area | MDPR | mdpr-skill |
| --- | --- | --- |
| Primary role | Markdown-to-presentation runtime | Optional Codex skill wrapper |
| Runtime dependency | No LLM required | Agent used only for hints and review |
| Final decisions | Parsing, splitting, layout, theme colors, typography, charts, tables, diagrams, icon catalog search, PPTX objects, validation | Short intent/grouping/importance/icon-keyword hints and critique notes |
| Install path | `npm install -g @mdpresent/cli` | `git clone` this repository for Codex skill workflows |
| Output | Editable PPTX, HTML, PDF, reports, previews | Hint files, review artifacts, generated review decks |
| Safety boundary | Builds must work without hints | Must not choose final coordinates, colors, z-order, arrows, geometry, exact icons, or renderer object IDs |

## Applied Comparison

The practical value of this repository is visible when a reviewer asks for
agent judgment but the deck still needs deterministic MDPR output. In the
tracked icon/image fallback example, the source asks what to do when an icon
would need to be too large or the metaphor is ambiguous.

| Workflow | Result before mdpr-skill bridge | Result with mdpr-skill |
| --- | --- | --- |
| Simple Codex skill | Produces useful prose advice, but no schema-valid artifact that MDPR can consume or replay. | Still useful for human review, but not sufficient as an MDPR runtime contract by itself. |
| MDPR only | Builds the deck deterministically from Markdown with `agentHints.enabled: false`, `accepted: 0`, and `slideCount: 3`. | Remains the final renderer and validator. With accepted hints, it still owns parsing, layout, theme, asset acceptance, and PPTX objects. |
| mdpr-skill + MDPR | Previously emitted only a general selection hint; there was no generated-image fallback signal. | Emits a bounded `visualAssetCandidates[0]` entry with `kind: "generated-image"` and `trigger: "large-or-ambiguous-icon"`, rejects stale selection contexts with `--markdown`, and reports `sourceVerified: true` in CLI summaries. |

The current guided MDPR build records `agentHints.enabled: true`, `accepted: 1`,
`rejected: 0`, `ignoredBecauseStale: 0`, and `forbiddenFieldCount: 0`. See the
full reproduction notes in
[docs/icon-image-fallback-comparison.md](docs/icon-image-fallback-comparison.md)
and the generated artifacts under
`artifacts/icon-image-fallback-comparison/`.

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
node bin/mdpr-skill.js hint --source-sha256 <64hex> --out .mdpresent/proposals/agent-hint.json
node bin/mdpr-skill.js review --manifest dist/mdpresent-manifest.json --out .mdpresent/review/review-report.json
node bin/mdpr-skill.js narrative --markdown deck.md --manifest dist/mdpresent-manifest.json --source-notes notes.md --out .mdpresent/review/narrative-review.json
node bin/mdpr-skill.js layout-intent --layout-catalog template-layout-catalog.json --out .mdpresent/review/layout-intent.json
node bin/mdpr-skill.js speaker-notes --markdown deck.md --source-notes notes.md --out .mdpresent/review/speaker-notes.json
node bin/mdpr-skill.js citations --markdown deck.md --sources sources.json --as-of 2026-06-27 --out .mdpresent/review/citation-review.json
node bin/mdpr-skill.js rendered-preview --images rendered-images.json --out .mdpresent/review/rendered-preview-review.json
node bin/mdpr-skill.js accessibility --markdown deck.md --audience "executive review" --out .mdpresent/review/accessibility-review.json
node bin/mdpr-skill.js evidence-ledger --markdown deck.md --sources sources.json --mdpr-evidence mdpr-evidence.json --out .mdpresent/review/evidence-ledger.json
node bin/mdpr-skill.js gate validate-schema-sync --mdpr-path .cache/mdpr
```

These commands create hints, reviews, eval reports, design candidates, and
approval records. They do not choose final coordinates, colors, z-order, or
renderer object IDs; MDPR owns those runtime decisions.

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
- approval-bound DESIGN.md theme candidates for MDPR theme/pack workflows
- local HTML design analysis with CSS-to-PPT feasibility notes
- coherence and visual policy findings with evidence paths
- design rail review findings for unsupported PPT effects, raster risks, component drift, and diagram budgets
- Markdown cleanup suggestions before MDPR builds
- review loops that turn generated PPTX/PNG issues into MDPR rule improvements

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
typography, spacing, and shape tokens with provenance, but they are not
`agent-hint.json` files and must pass approval/gates before MDPR runtime use.
HTML design analysis is also proposal-only: it records motifs, token candidates,
and PPT editability risks, then review-core turns those risks into MDPR policy
suggestions rather than final coordinates or exact object choices.

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

Generated review artifacts include:

- `artifacts/release-check/mdpr-skill-release-check.md`
- `artifacts/release-check/mdpr-skill-release-check.pptx`
- `artifacts/release-check/mdpr-skill-release-check-report.json`
- `artifacts/theme-decoration-review/theme-decoration-review.pptx`
- `artifacts/theme-decoration-review/theme-decoration-review-iteration-report.json`
- `docs/assets/theme-style-cover-contact-sheet.png`
- `docs/assets/theme-style-proof-contact-sheet.png`
- `docs/assets/theme-decoration-review-matrix.png`
- `docs/assets/pipeline-overview.pptx`
- `docs/assets/pipeline-overview.png`
- `artifacts/external-markdown-visual-eval/external-markdown-visual-eval-report.json`
- `artifacts/external-markdown-visual-eval/iteration-04/build/deck.pptx`
- `artifacts/external-markdown-visual-eval/iteration-04/contact-sheet.png`
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
