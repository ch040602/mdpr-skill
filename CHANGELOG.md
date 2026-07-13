# Changelog

All notable changes to this project are documented here.

This project uses release tags that match `v${package.json.version}`. The
package is pre-1.0, so breaking changes may occur before `1.0.0`; user-visible
packaging, CLI, workflow, and security-governance changes must still be
recorded here before release.

## 0.1.0 - Unreleased

Initial public npm release candidate.

- Publish compiled `dist` JavaScript and declaration files for Node.js 22+.
- Expose the `mdpr-skill` CLI with installed-package smoke coverage for
  `--help` and schema-valid `agent-hint.json` generation.
- Include `LICENSE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and lightweight
  Markdown/JSON docs in the npm package.
- Gate `npm publish` with `release:preflight`, `prepublishOnly`,
  `npm audit --audit-level=moderate`, package dry-run checks, and provenance
  publishing.
- Add public security governance with Dependabot, CodeQL, OpenSSF Scorecard,
  and vulnerability reporting guidance.
- Rebuild the MDPR comparison from the current sibling checkout, require
  isolated PowerPoint exports and a 16pt generated-text floor, remove synthetic
  subtitles and isolated rules, and ignore intentional `.github` form
  checkboxes without weakening governed-document validation.
