# Installing With MDPR

This repository is an optional visual-review skill pack for MDPR, not a fork or
replacement of MDPR.

MDPR is available as an npm CLI package for normal usage. The local source
checkout described below is only needed when this skill repository runs
development checks, comparison artifacts, or validation loops against MDPR
internals.

MDPR owns parsing, slide/object splitting, layout, decoration styles, theme
colors, coherence checks, and editable PPTX rendering. This repository only adds
agent-side hints, review notes, and validation artifacts around MDPR output.

## MDPR Runtime Install

Use MDPR directly when you only need deterministic Markdown-to-PPTX generation:

```bash
npm install -g @mdpresent/cli
mdpresent build deck.md --to pptx,html --out dist
```

## Skill Repository Install

```bash
npm install
```

This installs the mdpr-skill package only. It does not clone or update the MDPR
source checkout as a side effect, and it does not replace the npm-installed
MDPR CLI.

Prepare the local MDPR runtime explicitly when you want to run validation or
generate comparison artifacts:

```bash
npm run install:mdpr
```

That command clones or updates MDPR from `https://github.com/ch040602/MdPr`
into a local install directory and installs MDPR's package dependencies:

```text
.cache/mdpr
```

The checkout is intentionally ignored by git. It is not part of the public
mdpr-skill repository structure. A local install report is written to
`reports/mdpr-install.json`.

## Existing MDPR Checkout

Use `MDPR_SOURCE_DIR` when MDPR is already available locally:

```bash
MDPR_SOURCE_DIR=/path/to/mdpr npm run install:mdpr
```

On Windows PowerShell:

```powershell
$env:MDPR_SOURCE_DIR="C:\path\to\mdpr"; npm run install:mdpr
```

The script records the local path and commit when the directory is a git checkout.

## Dependency Install

The installer chooses the package manager from MDPR lockfiles in this order: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, then `package.json`.

## Configuration

- `MDPR_REPO_URL`: override the MDPR git URL.
- `MDPR_REF`: clone or update a specific MDPR branch, tag, or ref. Defaults to `HEAD`.
- `MDPR_INSTALL_DIR`: override the default `.cache/mdpr` install directory.
- `MDPR_SOURCE_DIR`: use an existing local MDPR checkout instead of cloning.
- `MDPR_SKIP_INSTALL=1`: skip installation when invoking the installer script directly.

## Role Boundary

MDPR owns Markdown parsing, slide splitting, element splitting, semantic
metadata, layout, design presets, color combinations, object selection,
rendering, and validation.

This skill pack owns optional semantic hinting and review guidance around MDPR output:

- intent, grouping, importance, icon-search keyword, and ambiguity hint guidance;
- validation checklists for typography, spacing, alignment, arrows, z-order, and text bounds;
- source-neutral review seeds that may suggest future MDPR improvements;
- MDPR installation checks and review-driven validation records.
