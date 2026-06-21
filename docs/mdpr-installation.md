# Installing With MDPR

This repository is an optional visual-review skill pack for MDPR, not a fork or
replacement of MDPR.

The install flow prepares MDPR as the deterministic presentation runtime. MDPR
owns parsing, slide/object splitting, layout, decoration styles, theme colors,
coherence checks, and editable PPTX rendering. This repository only adds
agent-side hints, review notes, and validation artifacts around MDPR output.

## Default Install

```bash
npm install
```

The `postinstall` hook runs:

```bash
python scripts/install_mdpr.py
```

By default it clones or updates MDPR from `https://github.com/ch040602/mdpr` into a local install directory:

```text
.cache/mdpr
```

The checkout is intentionally ignored by git. It is not part of the public
mdpr-skill repository structure. A local install report is written to
`reports/mdpr-install.json`.

## Existing MDPR Checkout

Use `MDPR_SOURCE_DIR` when MDPR is already available locally:

```bash
MDPR_SOURCE_DIR=/path/to/mdpr npm install
```

On Windows PowerShell:

```powershell
$env:MDPR_SOURCE_DIR="C:\path\to\mdpr"; npm install
```

The script records the local path and commit when the directory is a git checkout.

## Dependency Install

The default `postinstall` prepares the MDPR source but does not install MDPR's own package dependencies. This avoids running nested package installs during every skill-pack install.

Run the explicit dependency command when the local MDPR runtime must be executable:

```bash
npm run install:mdpr
```

The installer chooses the package manager from MDPR lockfiles in this order: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, then `package.json`.

## Configuration

- `MDPR_REPO_URL`: override the MDPR git URL.
- `MDPR_REF`: clone or update a specific MDPR branch, tag, or ref. Defaults to `HEAD`.
- `MDPR_INSTALL_DIR`: override the default `.cache/mdpr` install directory.
- `MDPR_SOURCE_DIR`: use an existing local MDPR checkout instead of cloning.
- `MDPR_SKIP_INSTALL=1`: skip automatic installation during `postinstall`.

## Role Boundary

MDPR owns Markdown parsing, slide splitting, element splitting, semantic
metadata, layout, design presets, color combinations, object selection,
rendering, and validation.

This skill pack owns optional semantic hinting and review guidance around MDPR output:

- intent, grouping, importance, icon-search keyword, and ambiguity hint guidance;
- validation checklists for typography, spacing, alignment, arrows, z-order, and text bounds;
- source-neutral review seeds that may suggest future MDPR improvements;
- MDPR installation checks and review-driven validation records.
