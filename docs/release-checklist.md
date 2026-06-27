# Release Checklist

- [x] README links upstream Design Components and MDPR.
- [x] `npm install` installs mdpr-skill without MDPR side effects.
- [x] `npm run install:mdpr` explicitly prepares MDPR for optional visual-review checks.
- [x] Source refs and MIT license metadata are recorded.
- [x] Schemas exist for Element IR, Styled Deck IR, rulebooks, recipes, variants, and agent hints.
- [x] Reference scaffolds cover core, rule engine, composition, decoration, renderer, CLI, gallery, and docs.
- [x] Local validation is available through `npm test` or `python scripts/validate_pack.py`.
- [x] Codex skill release validation includes
  `quick_validate.py skills/mdpr-skill` and
  `python -m unittest tests.test_boundary_contract -v`.
- [x] README and Actions-page preview images are refreshed from generated MDPR PPTX renders.
- [x] Stable visual review assets are documented in `docs/actions-page-materials.md`.
- [x] Cross-platform CI is available through `.github/workflows/ci.yml` and
  runs `npm run test:ci` plus `npm run pack:dry-run` on Node 22 and Node 24.
- [x] npm release automation is available through `.github/workflows/release.yml`
  and runs `npm run test:ci`, `npm run pack:dry-run`, and
  `npm publish --provenance --access public`.
- [x] Manual npm Trusted Publisher prerequisite is documented: configure it on
  npmjs.com before the first publish with owner `ch040602`, repository
  `mdpr-skill`, workflow filename `release.yml`, and allowed action
  `npm publish`. This external registry setting is required for tokenless OIDC
  publishing and cannot be committed to the repository.
- [x] Release publication path is documented: publish by creating a GitHub
  Release from a `v*` tag after CI passes.
- [x] npm publish failure mode is documented: if the release job prints
  `Signed provenance statement` and then fails with `E404 Not Found - PUT`,
  CI/CD and OIDC reached npm successfully, but npm registry package ownership
  or initial-publication permission is still unresolved. Confirm the `mdpr-skill`
  package can be created or is owned by the publishing npm account, then
  configure the package-level Trusted Publisher and rerun the Release workflow.

Manual gate before first npm publish: confirm the npm Trusted Publisher entry
exists for this repository and workflow in the npm package settings, and confirm
package ownership or initial-publication permission for `mdpr-skill` on npm.
