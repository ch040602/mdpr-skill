# Release Notes

This file is the packaged release-note summary for `mdpr-skill`.
User-visible changes are tracked in the root [CHANGELOG.md](../CHANGELOG.md).
GitHub Release bodies should be drafted from that changelog plus GitHub's
generated pull-request summary configured by `.github/release.yml`.

## 0.1.0 - Unreleased

Initial public npm release candidate.

Release highlights:

- The npm package publishes compiled `dist` JavaScript and declaration files
  for Node.js 22+.
- The installed CLI is smoke-tested from a consumer project for `--help` and
  schema-valid `agent-hint.json` generation.
- The package includes `LICENSE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`,
  `CHANGELOG.md`, and lightweight Markdown/JSON docs.
- `release:preflight` runs `npm run test:ci`, `npm audit
  --audit-level=moderate`, and `npm run pack:dry-run`.
- `npm publish --provenance --access public` is gated by `prepublishOnly` and
  the GitHub Release workflow.

First publish gate:

- Configure npm Trusted Publisher for owner `ch040602`, repository
  `mdpr-skill`, workflow `release.yml`, and allowed action `npm publish`.
- Create a GitHub Release from a tag matching `v${package.json.version}`.
- If npm returns `E404` after printing a signed provenance statement, the
  workflow reached npm but the package still lacks ownership or initial
  publication permission.

GitHub Release body:

- Use the generated notes categories from `.github/release.yml`.
- Keep the curated release summary aligned with [CHANGELOG.md](../CHANGELOG.md).
- Link validation evidence from `release:preflight` when publishing the first
  public package.
