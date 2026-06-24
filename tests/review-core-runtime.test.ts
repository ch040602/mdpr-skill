import assert from "node:assert/strict";
import test from "node:test";
import {
  reviewCoherence,
  reviewVisualPolicy,
  reviewFindingHasFinalDecisionField,
  screenshotEvidence,
  reviewSelectionContext,
} from "../packages/review-core/src/index";

const presentation = {
  slides: [
    {
      id: "slide-detached",
      title: "Detached Caption",
      headingPath: ["Evidence"],
      blocks: [
        { id: "chart-1", type: "chart", text: "Adoption funnel" },
        { id: "caption-1", type: "paragraph", text: "Figure 1. Adoption falls after activation." },
      ],
    },
    {
      id: "slide-orphan",
      title: "Orphan Evidence",
      headingPath: ["Evidence"],
      intent: "evidence",
      blocks: [
        { id: "table-1", type: "table", text: "Raw metrics" },
      ],
    },
    {
      id: "slide-claimless",
      title: "Claimless Evidence",
      headingPath: ["Evidence"],
      intent: "evidence",
      blocks: [
        { id: "image-1", type: "image", alt: "Architecture screenshot" },
        { id: "caption-2", type: "paragraph", text: "Source: internal prototype." },
      ],
    },
    {
      id: "slide-rhythm-a",
      title: "Rhythm A",
      headingPath: ["Rhythm"],
      blocks: [{ id: "body-a", type: "paragraph", text: "First section claim." }],
    },
    {
      id: "slide-rhythm-b",
      title: "Rhythm B",
      headingPath: ["Rhythm"],
      blocks: [{ id: "body-b", type: "paragraph", text: "Second section claim." }],
    },
    {
      id: "slide-rhythm-c",
      title: "Rhythm C",
      headingPath: ["Rhythm"],
      blocks: [{ id: "body-c", type: "paragraph", text: "Third section claim." }],
    },
  ],
};

const layout = {
  slides: [
    {
      id: "layout-detached-chart",
      sourceSlideId: "slide-detached",
      layout: { preset: "chart-table" },
      regions: [{ id: "chart", role: "chart", blockIds: ["chart-1"] }],
    },
    {
      id: "layout-detached-caption",
      sourceSlideId: "slide-detached",
      layout: { preset: "title-body" },
      regions: [{ id: "body", role: "body", blockIds: ["caption-1"] }],
    },
    {
      id: "layout-orphan",
      sourceSlideId: "slide-orphan",
      layout: { preset: "table-focus" },
      regions: [{ id: "table", role: "table", blockIds: ["table-1"] }],
    },
    {
      id: "layout-claimless",
      sourceSlideId: "slide-claimless",
      layout: { preset: "image-focus" },
      regions: [
        { id: "image", role: "image", blockIds: ["image-1"] },
        { id: "caption", role: "body", blockIds: ["caption-2"] },
      ],
    },
    {
      id: "layout-rhythm-a",
      sourceSlideId: "slide-rhythm-a",
      layout: { preset: "title-body" },
      regions: [{ id: "body", role: "body", blockIds: ["body-a"] }],
    },
    {
      id: "layout-rhythm-b",
      sourceSlideId: "slide-rhythm-b",
      layout: { preset: "quote" },
      regions: [{ id: "body", role: "body", blockIds: ["body-b"] }],
    },
    {
      id: "layout-rhythm-c",
      sourceSlideId: "slide-rhythm-c",
      layout: { preset: "chart-table" },
      regions: [{ id: "body", role: "body", blockIds: ["body-c"] }],
    },
  ],
};

test("reviewCoherence reports concrete coherence findings without final design fields", () => {
  const findings = reviewCoherence({ presentation, layout });
  const types = findings.map((finding) => finding.type);

  assert.deepEqual(types.sort(), [
    "CLAIMLESS_EVIDENCE_SLIDE",
    "DETACHED_CAPTION_RISK",
    "ORPHAN_EVIDENCE_RISK",
    "SECTION_RHYTHM_DRIFT",
  ].sort());
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(findings.every((finding) => finding.slideId), true);
  assert.equal(findings.every((finding) => finding.evidence && Object.keys(finding.evidence).length > 0), true);
  assert.equal(findings.every((finding) => finding.suggestion?.kind === "mdpr-policy"), true);
});

test("reviewCoherence accepts evidence with a same-slide claim or caption", () => {
  const cleanPresentation = {
    slides: [
      {
        id: "slide-clean",
        title: "Clean Evidence",
        headingPath: ["Clean"],
        intent: "evidence",
        blocks: [
          { id: "claim-1", type: "paragraph", text: "Activation is the main bottleneck." },
          { id: "chart-clean", type: "chart", text: "Activation funnel" },
          { id: "caption-clean", type: "paragraph", text: "Figure 2. Activation drops by stage." },
        ],
      },
    ],
  };
  const cleanLayout = {
    slides: [
      {
        id: "layout-clean",
        sourceSlideId: "slide-clean",
        layout: { preset: "chart-table" },
        regions: [
          { id: "claim", role: "body", blockIds: ["claim-1"] },
          { id: "chart", role: "chart", blockIds: ["chart-clean"] },
          { id: "caption", role: "body", blockIds: ["caption-clean"] },
        ],
      },
    ],
  };

  assert.deepEqual(reviewCoherence({ presentation: cleanPresentation, layout: cleanLayout }), []);
});

test("reviewVisualPolicy reports visual policy findings without final design fields", () => {
  const findings = reviewVisualPolicy({
    manifest: {
      pptxObjects: [
        { slideId: "slide-visual", objectKind: "raster-image", role: "table", blockIds: ["table-1"] },
      ],
      accentUsage: { accentedObjects: 18, totalObjects: 24 },
    },
    designLock: {
      tokens: {
        colors: { primary: "#123456" },
      },
      runtimeOverrides: {
        calloutFill: "#ABCDEF",
      },
      cornerScale: ["compact", "medium", "large", "pill"],
      depthScale: ["soft", "hard", "glow"],
      visualTreatments: ["shadow", "glow", "gradient", "transparency", "blur"],
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.deepEqual(types.sort(), [
    "ACCENT_OVERUSE_RISK",
    "EFFECT_BUDGET_EXCEEDED",
    "MIXED_RADIUS_SCALE",
    "MIXED_SHADOW_SCALE",
    "NON_EDITABLE_PRIMARY_OBJECT",
    "RAW_HEX_STYLE_VALUE",
  ].sort());
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(findings.every((finding) => finding.evidence && Object.keys(finding.evidence).length > 0), true);
  assert.equal(findings.every((finding) => finding.suggestion), true);
});

test("screenshotEvidence records paths and block ids as evidence only", () => {
  const evidence = screenshotEvidence({
    screenshotPath: ".mdpresent/review/slide-1.png",
    selectionPath: ".mdpresent/review/selection-1.json",
    blockIds: ["b1", "b2"],
  });

  assert.deepEqual(evidence, {
    screenshotPath: ".mdpresent/review/slide-1.png",
    selectionPath: ".mdpresent/review/selection-1.json",
    blockIds: ["b1", "b2"],
  });
});

test("reviewSelectionContext consumes selected block evidence without coordinates", () => {
  const findings = reviewSelectionContext({
    selectionContext: {
      schemaVersion: "mdpr-selection-context-v1",
      source: { kind: "mdpr-ppt", sourceSha256: "c".repeat(64) },
      slideId: "slide-4",
      overlappedBlocks: ["table-1", "caption-1"],
      overlappedRegions: ["main"],
      screenshotPath: ".mdpresent/review/slide-4.png",
      selectionPath: ".mdpresent/review/selection-4.json",
      userInstruction: "The table and explanation feel too detached.",
      x: 1,
      y: 2,
    } as never,
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "SELECTION_CONTEXT_GROUPING_RISK");
  assert.equal(findings[0].slideId, "slide-4");
  assert.deepEqual(findings[0].evidence?.blockIds, ["table-1", "caption-1"]);
  assert.equal(JSON.stringify(findings[0]).includes('"x"'), false);
  assert.equal(reviewFindingHasFinalDecisionField(findings[0]), false);
});
