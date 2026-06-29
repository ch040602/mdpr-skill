# Security Policy

## Supported Versions

`mdpr-skill` is pre-1.0 software. Security fixes are applied to the current
`main` branch and the latest published npm package version after the first npm
release.

| Version | Supported |
| --- | --- |
| `0.1.x` | Yes |
| Earlier snapshots | No |

## Reporting a Vulnerability

Do not report security vulnerabilities through public GitHub issues.

Use GitHub private vulnerability reporting for this repository when available:

```text
https://github.com/ch040602/mdpr-skill/security/advisories/new
```

If private reporting is unavailable, open a public issue that only asks for a
private disclosure channel and does not include exploit details, secrets,
tokens, proof-of-concept payloads, or vulnerable file contents.

Please include:

- Affected version or commit.
- A minimal description of the vulnerable behavior.
- Whether the issue affects npm installation, CLI execution, generated
  artifacts, GitHub Actions, or third-party inputs.
- Any safe reproduction steps that do not disclose secrets or weaponized
  payloads.

Expected response:

- Initial triage target: 7 days.
- Status update target after triage: 14 days.
- Fixes are coordinated through private advisories when needed, then released
  through the normal tagged release and npm provenance workflow.

## Scope

Security-sensitive surfaces include:

- npm package installation and `mdpr-skill` CLI execution.
- GitHub Actions release automation and provenance publishing.
- Files generated from untrusted Markdown, JSON, rendered-preview metadata, or
  MDPR artifacts.
- Dependency updates and supply-chain metadata.

Out of scope:

- Reports that require publishing secrets in public issues.
- Vulnerabilities in upstream MDPR, npm, GitHub Actions runners, or external
  tools unless `mdpr-skill` adds a repository-specific exploit path.
