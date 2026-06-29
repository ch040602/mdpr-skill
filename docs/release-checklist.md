# Release Checklist

- [x] README links upstream Design Components and MDPR.
- [x] `npm install` installs mdpr-skill without MDPR side effects.
- [x] The npm CLI runtime is compiled before packing:
  `bin/mdpr-skill.js` invokes compiled `dist` JavaScript without runtime `tsx`,
  and `tsx` remains a development-only test/build helper.
- [x] The npm package allowlist includes compiled runtime files, schemas, skill
  instructions, and lightweight Markdown/JSON docs, but excludes heavy `docs/assets`
  preview images and PPTX files.
- [x] The npm package declares Node.js 22+ in `engines.node`, matching the
  Node 22/24 CI matrix and the Node 24 release job.
- [x] `npm run install:mdpr` explicitly prepares MDPR for optional visual-review checks.
- [x] Source refs and MIT license metadata are recorded.
- [x] A root LICENSE file is present and uses the same MIT license declared in
  `package.json`.
- [x] Public security governance is configured: `SECURITY.md` documents private
  vulnerability reporting, Dependabot monitors npm and GitHub Actions, CodeQL
  scans JavaScript/TypeScript and Python, and OpenSSF Scorecard uploads SARIF.
- [x] Public community and release health files are present:
  `CODE_OF_CONDUCT.md` defines collaboration standards, `CHANGELOG.md` records
  user-visible release changes, and `package.json` `devEngines` enforces the
  Node/npm source-workflow expectations used by this repository.
- [x] A public support policy is present: `SUPPORT.md` routes MDPR runtime
  reports upstream, mdpr-skill bug reports and feature requests to this
  repository, and security reports to `SECURITY.md`.
- [x] Public contribution triage is configured: `.github/ISSUE_TEMPLATE`
  contains general bug and feature issue forms plus a template chooser that
  redirects security reports to `SECURITY.md`, and
  `.github/pull_request_template.md` requires boundary, validation, and release
  impact evidence.
- [x] GitHub labels are documented in `docs/github-labels.md` so issue-form
  labels and generated release-note categories can be created before first
  publish.
- [x] GitHub Release notes are configured: `.github/release.yml` groups
  generated release notes by change type, and `docs/release-notes.md` mirrors
  the `CHANGELOG.md` first npm release summary, `release:preflight`, Trusted
  Publisher, and `E404` ownership failure mode.
- [x] Schemas exist for Element IR, Styled Deck IR, rulebooks, recipes, variants, and agent hints.
- [x] Reference scaffolds cover core, rule engine, composition, decoration, renderer, CLI, gallery, and docs.
- [x] Local validation is available through `npm test` or `python scripts/validate_pack.py`.
- [x] Codex skill release validation includes
  `quick_validate.py skills/mdpr-skill` and
  `python -m unittest tests.test_boundary_contract -v`.
- [x] README and Actions-page preview images are refreshed from generated MDPR PPTX renders.
- [x] Stable visual review assets are documented in `docs/actions-page-materials.md`.
- [x] Cross-platform CI is available through `.github/workflows/ci.yml` and
  runs `npm run test:ci` plus `npm run pack:dry-run` on Ubuntu and Windows for
  Node 22 and Node 24.
- [x] CI includes an npm consumer-install smoke test that packs this repository,
  installs the tarball into a temporary project, runs `mdpr-skill --help`, and
  writes a schema-valid `agent-hint.json` from the installed CLI.
- [x] npm release automation is available through `.github/workflows/release.yml`
  and runs `npm run release:preflight` before
  `npm publish --provenance --access public`; `release:preflight` runs
  `npm run test:ci`, `npm run audit:security`, and `npm run pack:dry-run`.
- [x] Manual or local `npm publish` is guarded by `prepublishOnly`, which runs
  `npm run release:preflight` before npm prepares and packs the tarball.
- [x] Manual npm Trusted Publisher prerequisite is documented: configure it on
  npmjs.com before the first publish with owner `ch040602`, repository
  `mdpr-skill`, workflow filename `release.yml`, and allowed action
  `npm publish`. This external registry setting is required for tokenless OIDC
  publishing and cannot be committed to the repository.
- [x] Release publication path is documented: publish by creating a GitHub
  Release from a `v*` tag after CI passes; the release workflow verifies the
  tag matches `package.json` version before npm publish.
- [x] npm publish failure mode is documented: if the release job prints
  `Signed provenance statement` and then fails with `E404 Not Found - PUT`,
  CI/CD and OIDC reached npm successfully, but npm registry package ownership
  or initial-publication permission is still unresolved. Confirm the `mdpr-skill`
  package can be created or is owned by the publishing npm account, then
  configure the package-level Trusted Publisher and rerun the Release workflow.

Manual gate before first npm publish: confirm the npm Trusted Publisher entry
exists for this repository and workflow in the npm package settings, and confirm
package ownership or initial-publication permission for `mdpr-skill` on npm.
