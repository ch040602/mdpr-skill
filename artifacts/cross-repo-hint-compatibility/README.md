# Cross-Repo Hint Compatibility Fixture

This folder stores a compact MDPR/mdpr-skill compatibility fixture for the
expanded `mdpr-agent-hint-v1` surface.

- `deck.md` is the source Markdown used for the SHA-bound fixture.
- `agent-hint.json` exercises workflow intent, key message evidence,
  content-split, readability, template-use, media-policy, and evidence-bound
  icon keyword candidates.
- `agent-hint-policy-conflict.json` is a schema-valid negative fixture. It keeps
  `imageUse: "no-image"` and `iconUse: "no-new-icons"` while including
  generated-image and icon-keyword candidates, so mdpr-skill preflight and MDPR
  runtime diagnostics can prove conflicting candidates are ignored.

The fixture is evidence only. It does not authorize mdpr-skill to choose final
layout, icon assets, colors, coordinates, or PPTX objects.
