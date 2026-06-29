# GitHub Labels

GitHub issue forms and generated release notes both depend on repository labels.
Create these labels before the first public npm release so triage, changelog
grouping, and release-note generation behave predictably.

## Issue Intake Labels

| Label | Used by | Purpose |
|---|---|---|
| `triage` | issue forms | New public reports that need owner review. |
| `type: bug` | bug issue form, release notes | Reproducible mdpr-skill defects. |
| `type: feature` | feature issue form, release notes | User-visible mdpr-skill improvements. |

## Release Note Labels

| Label | Release-note category |
|---|---|
| `breaking-change` | Breaking Changes |
| `Semver-Major` | Breaking Changes |
| `enhancement` | Features |
| `feature` | Features |
| `type: feature` | Features |
| `bug` | Fixes |
| `fix` | Fixes |
| `type: bug` | Fixes |
| `documentation` | Documentation |
| `docs` | Documentation |
| `security` | Security |
| `dependencies` | Dependencies |

The `.github/release.yml` catch-all category handles merged pull requests that
do not match one of these labels.

## Exclusion Labels

Pull requests with these labels are excluded from generated GitHub Release
notes:

- `ignore-for-release`
- `duplicate`
- `invalid`
- `question`

## Labels to Create Before First Publish

Run these commands from a checkout with `gh` authenticated to
`ch040602/mdpr-skill`. If a label already exists, update it in GitHub instead of
creating a duplicate.

```bash
gh label create "triage" --color "ededed" --description "Needs maintainer triage"
gh label create "type: bug" --color "d73a4a" --description "Reproducible mdpr-skill defect"
gh label create "type: feature" --color "a2eeef" --description "User-visible mdpr-skill improvement"
gh label create "breaking-change" --color "b60205" --description "Breaking behavior or API change"
gh label create "Semver-Major" --color "b60205" --description "Major-version release note"
gh label create "enhancement" --color "a2eeef" --description "Feature or improvement"
gh label create "feature" --color "a2eeef" --description "Feature work"
gh label create "bug" --color "d73a4a" --description "Bug fix"
gh label create "fix" --color "d73a4a" --description "Fix work"
gh label create "documentation" --color "0075ca" --description "Documentation change"
gh label create "docs" --color "0075ca" --description "Documentation-only change"
gh label create "security" --color "ee0701" --description "Security-related change"
gh label create "dependencies" --color "0366d6" --description "Dependency update"
gh label create "ignore-for-release" --color "ffffff" --description "Exclude from generated release notes"
gh label create "duplicate" --color "cfd3d7" --description "Duplicate report"
gh label create "invalid" --color "e4e669" --description "Invalid or unsupported report"
gh label create "question" --color "d876e3" --description "Question rather than actionable issue"
```

Keep this file aligned with `.github/ISSUE_TEMPLATE/*.yml` and
`.github/release.yml`.
