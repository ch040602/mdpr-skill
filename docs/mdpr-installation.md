# Installing With MDPR

This repository is a visual diversification skill pack for MDPR, not a fork or replacement of MDPR.

The install flow prepares MDPR as the content-splitting runtime and keeps this repository responsible for deterministic visual decisions: recipe selection, component variants, layout, decoration, coherence checks, and editable PPTX rendering.

## Default Install

```bash
npm install
```

The `postinstall` hook runs:

```bash
python scripts/install_mdpr.py
```

By default it clones or updates MDPR from `https://github.com/ch040602/mdpr` into:

```text
.cache/mdpr
```

The checkout is intentionally ignored by git. A local install report is written to `reports/mdpr-install.json`.

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

MDPR owns Markdown parsing, slide splitting, element splitting, and semantic metadata.

This skill pack owns visual diversification after MDPR has produced content structure:

- deterministic profile and recipe selection;
- renderer-neutral component variants;
- coherent layout and spacing;
- readable typography constraints;
- editable PowerPoint shapes, images, charts, and tables;
- z-order, alignment, arrow, and render validation.
