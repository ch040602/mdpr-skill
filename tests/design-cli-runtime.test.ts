import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeHtmlDesign,
  buildThemeCandidateFromDesignMd,
  parseDesignMd,
  themeCandidateGate,
} from "../packages/cli/src/index";

const designMd = `---
colors:
  accent: "#B8422E"
typography:
  title:
    fontFamily: "Public Sans"
    fontSizePt: 36
spacing:
  md: 0.22
shape:
  radiusMd: 0.08
---

## Overview

Design import boundary fixture.
`;

test("CLI design command boundary exposes import and gate helpers", () => {
  const parsed = parseDesignMd(designMd);
  const candidate = buildThemeCandidateFromDesignMd({
    path: "DESIGN.md",
    content: designMd,
    generatedAt: "2026-06-24T00:00:00Z",
  });

  assert.equal(parsed.frontmatter.colors.accent, "#B8422E");
  assert.equal(themeCandidateGate(candidate).status, "pass");
  assert.equal(analyzeHtmlDesign({ html: `<div style="display:grid;gap:16px"></div>` }).motifs[0]?.kind, "card-grid");
});
