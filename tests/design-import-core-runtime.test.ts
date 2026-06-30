import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  analyzeHtmlDesign,
  buildThemeCandidateFromDesignMd,
  mapCssDeclarationToPptEffect,
  parseDesignMd,
  themeCandidateGate,
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

## Best For

- Executive product reviews.
- Technical strategy decks.

## Layout Blueprints

- Proof rail: one primary claim rail with two evidence cells; regions: claim, evidence, metric
- Comparison matrix: two balanced columns with a decision footer; regions: option-a, option-b, verdict

## Decoration Grammar

- Use numbered rails for ordered arguments.
- Use thin rule lines and sparse accent chips.

## Registration Targets

- mdpr-theme-pack
- mdpr-profile
- mdpr-rulebook

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
  assert.deepEqual(candidate.styleSystem.bestFor, [
    "Executive product reviews.",
    "Technical strategy decks.",
  ]);
  assert.deepEqual(candidate.styleSystem.layoutIntents, [
    "proof-rail",
    "comparison-matrix",
  ]);
  assert.deepEqual(candidate.styleSystem.layoutBlueprints, [
    {
      name: "Proof rail",
      intent: "proof-rail",
      description: "one primary claim rail with two evidence cells",
      regions: ["claim", "evidence", "metric"],
    },
    {
      name: "Comparison matrix",
      intent: "comparison-matrix",
      description: "two balanced columns with a decision footer",
      regions: ["option-a", "option-b", "verdict"],
    },
  ]);
  assert.deepEqual(candidate.styleSystem.decorationFamilies, [
    "numbered-rail",
    "rule-lines",
    "accent-chips",
  ]);
  assert.deepEqual(candidate.registration.targets, [
    "mdpr-theme-pack",
    "mdpr-profile",
    "mdpr-rulebook",
  ]);
  assert.equal(candidate.registration.workflow, "proposal-review-approve-mdpr-import");
  assert.equal(candidate.constraints.mdprOwnsFinalLayout, true);
  assert.equal(candidate.constraints.mdprOwnsFinalThemeBinding, true);
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
  assert.equal(schema.properties.styleSystem.properties.layoutBlueprints.items.additionalProperties, false);
  assert.deepEqual(schema.properties.registration.properties.targets.items.enum, [
    "mdpr-theme-pack",
    "mdpr-profile",
    "mdpr-rulebook",
    "deck-local-style-pack",
  ]);
});

test("themeCandidateGate accepts approval-bound candidate rail data", () => {
  const candidate = buildThemeCandidateFromDesignMd({
    path: "DESIGN.md",
    content: designMd,
    generatedAt: "2026-06-24T00:00:00Z",
  });

  const result = themeCandidateGate(candidate);

  assert.equal(result.status, "pass");
  assert.deepEqual(result.findings, []);
  assert.equal(result.metrics.colorTokenCount, 5);
  assert.equal(result.metrics.layoutBlueprintCount, 2);
  assert.equal(result.metrics.decorationFamilyCount, 3);
});

test("themeCandidateGate rejects missing provenance and approval", () => {
  const result = themeCandidateGate({
    schemaVersion: "mdpr-theme-candidate-v1",
    source: {
      kind: "design-md",
      path: "DESIGN.md",
      sourceSha256: "bad",
      generatedBy: "mdpr-skill",
      generatedAt: "not-a-date",
    },
    tokens: {
      colors: { accent: "#B8422E" },
      typography: [],
      spacing: { md: "wide" },
      shape: { radiusMd: 0.08 },
    },
    styleSystem: {
      bestFor: ["ok"],
      layoutIntents: ["comparison"],
      layoutBlueprints: [{ name: "Bad", intent: "bad", description: "bad", regions: ["x"] }],
      decorationFamilies: ["callout"],
    },
    registration: {
      targets: ["raw-coordinates"],
      workflow: "proposal-review-approve-mdpr-import",
    },
    constraints: {
      mdprOwnsFinalLayout: false,
      mdprOwnsFinalThemeBinding: true,
      noRawUseInAgentHints: true,
      requiresDesignLockUpdate: true,
    },
    rationale: { dosDonts: [] },
    requiresApproval: false,
  });

  assert.equal(result.status, "fail");
  assert.match(result.findings.join("\n"), /source.sourceSha256/);
  assert.match(result.findings.join("\n"), /source.generatedAt/);
  assert.match(result.findings.join("\n"), /requiresApproval/);
  assert.match(result.findings.join("\n"), /tokens.typography/);
  assert.match(result.findings.join("\n"), /tokens.spacing.md/);
  assert.match(result.findings.join("\n"), /registration.targets/);
  assert.match(result.findings.join("\n"), /constraints.mdprOwnsFinalLayout/);
});

test("themeCandidateGate rejects final-decision fields while allowing color tokens", () => {
  const candidate = buildThemeCandidateFromDesignMd({
    path: "DESIGN.md",
    content: designMd,
    generatedAt: "2026-06-24T00:00:00Z",
  }) as Record<string, unknown>;
  candidate["x"] = 1;

  const result = themeCandidateGate(candidate);

  assert.equal(result.status, "fail");
  assert.match(result.findings.join("\n"), /forbidden final-decision field/);
  assert.doesNotMatch(result.findings.join("\n"), /tokens.colors.accent/);
});

test("analyzeHtmlDesign extracts deterministic tokens, motifs, and PPT feasibility", () => {
  const analysis = analyzeHtmlDesign({
    html: `
      <style>
        .cards { display: grid; gap: 24px; }
        .card { background-color: #ffffff; border: 1px solid #dde2ea; border-radius: 18px; box-shadow: 0 12px 32px rgba(0,0,0,.14); }
        .badge { border-radius: 999px; background: linear-gradient(90deg, #B8422E, #E7A13B); }
      </style>
      <section class="cards">
        <article class="card" style="font-family: Public Sans; font-size: 18px; backdrop-filter: blur(18px);">
          <span class="badge">Beta</span>
        </article>
      </section>
    `,
    source: { kind: "html", path: "fixture.html" },
    capturedAt: "2026-06-24T00:00:00Z",
  });

  assert.equal(analysis.schemaVersion, "mdpr-html-design-analysis-v1");
  assert.equal(analysis.source.kind, "html");
  assert.equal(analysis.tokens.colors.includes("#ffffff"), true);
  assert.equal(analysis.tokens.typography.some((item) => item.property === "font-family"), true);
  assert.equal(analysis.tokens.spacing.includes(24), true);
  assert.equal(analysis.tokens.radius.includes(18), true);
  assert.equal(analysis.tokens.elevation.length, 1);
  assert.equal(analysis.motifs.some((motif) => motif.kind === "card-grid"), true);
  assert.equal(analysis.motifs.some((motif) => motif.kind === "pill-badge"), true);
  assert.equal(analysis.pptEffectMapping.some((item) => item.feasibility === "raster-risk"), true);
});

test("mapCssDeclarationToPptEffect classifies editable, approximate, and unsupported effects", () => {
  assert.equal(mapCssDeclarationToPptEffect("background-color", "#fff").feasibility, "native-editable");
  assert.equal(mapCssDeclarationToPptEffect("border-radius", "12px").pptEffect, "shape radius token");
  assert.equal(mapCssDeclarationToPptEffect("box-shadow", "0 8px 20px rgba(0,0,0,.2)").feasibility, "native-approximation");
  assert.equal(mapCssDeclarationToPptEffect("background", "linear-gradient(90deg, red, blue)").feasibility, "native-approximation");
  assert.equal(mapCssDeclarationToPptEffect("backdrop-filter", "blur(12px)").feasibility, "raster-risk");
  assert.equal(mapCssDeclarationToPptEffect("clip-path", "polygon(0 0, 100% 0, 80% 100%)").feasibility, "unsupported");
  assert.equal(mapCssDeclarationToPptEffect("animation", "pulse 1s infinite").editabilityRisk, "high");
});

test("html design analysis schema declares deterministic local analysis contract", () => {
  const schema = JSON.parse(readFileSync("schemas/mdpr-html-design-analysis.schema.json", "utf-8"));
  assert.equal(schema.properties.schemaVersion.const, "mdpr-html-design-analysis-v1");
  assert.deepEqual(schema.properties.pptEffectMapping.items.properties.feasibility.enum, [
    "native-editable",
    "native-approximation",
    "token-approximation",
    "raster-risk",
    "unsupported",
  ]);
  assert.equal(schema.properties.source.properties.capturedAt.type, "string");
});
