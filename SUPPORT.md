# Support

`mdpr-skill` is a thin companion for MDPR semantic hints, review artifacts, and
Codex skill workflows. It is not the MDPR runtime, parser, renderer, or PPTX
engine.

## Where to Ask

- MDPR runtime issues: use
  https://github.com/ch040602/MdPr/issues/new/choose for Markdown parsing,
  rendering, layout, theme output, and PPTX generation problems.
- Bug reports: use this repository's Bug Report issue form for reproducible
  `mdpr-skill` CLI, schema, hint, review, npm package, or documentation
  problems.
- Feature requests: use this repository's Feature Request issue form for
  user-visible `mdpr-skill` improvements. If the final behavior belongs in the
  MDPR runtime, open or link an upstream MDPR issue.
- Security: do not open a public issue. Follow `SECURITY.md` and GitHub private
  vulnerability reporting instead.

## Before Opening an Issue

Include the smallest reproduction you can share:

- the `mdpr-skill` npm version or git commit;
- your Node.js and npm versions;
- the command you ran, such as `npx mdpr-skill --help`;
- the input Markdown, config, or generated artifact path when relevant;
- expected behavior, actual behavior, and any validation commands already run.

For local checkout problems, run:

```bash
npm run test:npm-install-smoke
```

## Package Status

After the package is published to npm, consumers can install it with:

```bash
npm install -g mdpr-skill
```

Before the first npm publish, use a local checkout and the repository
installation steps in `README.md`.
