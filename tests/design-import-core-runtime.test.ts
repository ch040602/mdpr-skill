import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildThemeCandidateFromDesignMd,
  parseDesignMd,
} from "../packages/design-import-core/src/index";

const designMd = `---
colors:
  background: "#F7F5F2"
  surface: "#FFFFFF"
  text: "#1A1C1E"
  muted: "#6C7278"
  accent: "#B8422E"
typography:
  title:
    fontFamily: "Public Sans"
    fontSizePt: 36
    fontWeight: 600
  body:
    fontFamily: "Public Sans"
    fontSizePt: 12
spacing:
  sm: 0.11
  md: 0.22
shape:
  radiusMd: 0.08
---

# Architectural Minimalism

## Overview

Strict editorial grids with restrained accent use.

## Layout

Use generous containment and avoid noisy fills.

## Do's and Don'ts

- Use accent only for the primary focal element.
- Do not mix rounded and sharp corners.
`;

test("parseDesignMd extracts frontmatter tokens and prose sections", () => {
  const parsed = parseDesignMd(designMd);

  assert.equal(parsed.frontmatter.colors.accent, "#B8422E");
  assert.equal(parsed.frontmatter.typography.title.fontFamily, "Public Sans");
  assert.equal(parsed.sections.Overview, "Strict editorial grids with restrained accent use.");
  assert.match(parsed.sections.Layout ?? "", /generous containment/);
});

test("buildThemeCandidateFromDesignMd creates approval-bound theme proposal", () => {
  const candidate = buildThemeCandidateFromDesignMd({
    path: "DESIGN.md",
    content: designMd,
    generatedAt: "2026-06-24T00:00:00Z",
  });

  assert.equal(candidate.schemaVersion, "mdpr-theme-candidate-v1");
  assert.equal(candidate.source.kind, "design-md");
  assert.equal(candidate.source.path, "DESIGN.md");
  assert.equal(candidate.source.generatedBy, "mdpr-skill");
  assert.equal(candidate.source.sourceSha256.length, 64);
  assert.equal(candidate.requiresApproval, true);
  assert.equal(candidate.tokens.colors.accent, "#B8422E");
  assert.equal(candidate.tokens.typography.title.fontSizePt, 36);
  assert.deepEqual(candidate.rationale.dosDonts, [
    "Use accent only for the primary focal element.",
    "Do not mix rounded and sharp corners.",
  ]);
});

test("buildThemeCandidateFromDesignMd rejects final decision fields", () => {
  assert.throws(() => buildThemeCandidateFromDesignMd({
    path: "DESIGN.md",
    content: `---
colors:
  accent: "#123456"
x: 10
recipeId: exact-card
---

## Overview

Bad.
`,
  }), /forbidden final-decision field/);
});

test("theme candidate schema declares approval-bound design rail", () => {
  const schema = JSON.parse(readFileSync("schemas/mdpr-theme-candidate.schema.json", "utf-8"));
  assert.equal(schema.properties.schemaVersion.const, "mdpr-theme-candidate-v1");
  assert.equal(schema.properties.source.properties.generatedBy.const, "mdpr-skill");
  assert.equal(schema.properties.requiresApproval.const, true);
});
