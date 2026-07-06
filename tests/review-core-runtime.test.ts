import assert from "node:assert/strict";
import test from "node:test";
import {
  reviewCoherence,
  reviewCitationProvenance,
  reviewAccessibilityContent,
  reviewDesignPolicy,
  reviewVisualPolicy,
  reviewFindingHasFinalDecisionField,
  reviewNarrativeSpine,
  reviewRenderedPreviewCritique,
  reviewSpeakerNotes,
  buildSourceSlideEvidenceLedger,
  reviewTemplateLayoutIntent,
  screenshotEvidence,
  reviewSelectionContext,
  buildVisualGuidance,
  buildGeneratorComparisonScorecard,
  buildHighNeedChartRecipeCatalog,
  buildScientificChartIntentReport,
  renderReadmeTeaserSvg,
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

test("buildVisualGuidance normalizes review findings into evidence-based categories", () => {
  const findings = reviewVisualPolicy({
    manifest: {
      pptxObjects: [
        { slideId: "slide-visual", objectKind: "raster-image", role: "table", blockIds: ["table-1"] },
      ],
      accentUsage: { accentedObjects: 18, totalObjects: 24 },
    },
    designLock: {
      runtimeOverrides: { calloutFill: "#ABCDEF" },
      cornerScale: ["compact", "medium", "large", "pill"],
      depthScale: ["soft", "hard", "glow"],
      visualTreatments: ["shadow", "glow", "gradient", "transparency", "blur"],
    },
  });

  const guidance = buildVisualGuidance(findings);

  assert.equal(guidance.schemaVersion, "mdpr-visual-guidance-v1");
  assert.equal(guidance.boundary.mdprValidationAuthority, true);
  assert.equal(guidance.boundary.noFinalGeometry, true);
  assert.equal(guidance.findings.some((finding) => finding.category === "editability_risk"), true);
  assert.equal(guidance.findings.some((finding) => finding.category === "decoration_noise"), true);
  assert.equal(guidance.findings.some((finding) => finding.category === "theme_fit"), true);
  assert.equal(guidance.findings.every((finding) => finding.recommendation.target.startsWith("mdpr.")), true);
  assert.equal(guidance.findings.every((finding) => finding.evidenceRefs.length > 0), true);
  assert.equal(JSON.stringify(guidance).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(guidance).includes('"color"'), false);
});

test("buildGeneratorComparisonScorecard separates deterministic evidence from manual preference", () => {
  const scorecard = buildGeneratorComparisonScorecard({
    mdpr: {
      editableObjectCoverage: 0.92,
      deckCoherenceFindingCount: 1,
      designDecisionTracePresent: true,
      layoutValidationRefCount: 4,
      overflowOrDensityFindingCount: 0,
      nativeTableChartProofSupport: true,
    },
    references: [
      {
        name: "codex-ppt-skill",
        outputModel: "image-only PPTX",
        editableObjectCoverage: 0,
        manualReviewRequired: true,
      },
      {
        name: "generic-builder",
        outputModel: "unknown",
        manualReviewRequired: true,
      },
    ],
  });

  assert.equal(scorecard.schemaVersion, "mdpr-generator-comparison-scorecard-v1");
  assert.equal(scorecard.boundary.evidenceOnly, true);
  assert.equal(scorecard.boundary.noSubjectiveBeautyGate, true);
  assert.equal(scorecard.dimensions.editable_object_coverage.winner, "mdpr");
  assert.equal(scorecard.dimensions.design_decision_trace_presence.winner, "mdpr");
  assert.equal(scorecard.dimensions.manual_review_required.winner, "manual-review");
  assert.equal(scorecard.dimensions.native_table_chart_proof_support.winner, "mdpr");
  assert.equal(JSON.stringify(scorecard).includes("objectively prettier"), false);
});

test("buildScientificChartIntentReport classifies SANFC-like chart structure without raw workbook data", () => {
  const report = buildScientificChartIntentReport({
    sourceLabel: "SANFC-like structural fixture",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 127,
        maxColumns: 17,
        numericCellCount: 592,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
      {
        sheetLabel: "Overall-BW-SL",
        nonemptyRows: 39,
        maxColumns: 39,
        numericCellCount: 218,
        formulaCellCount: 0,
        chartFamilies: ["bar"],
      },
      {
        sheetLabel: "Feasibility_sine",
        nonemptyRows: 49,
        maxColumns: 181,
        numericCellCount: 8643,
        formulaCellCount: 3600,
        chartFamilies: ["line"],
      },
      {
        sheetLabel: "heatmap",
        nonemptyRows: 11,
        maxColumns: 13,
        numericCellCount: 99,
        formulaCellCount: 0,
        chartFamilies: [],
      },
      {
        sheetLabel: "Security-distance",
        nonemptyRows: 42,
        maxColumns: 298,
        numericCellCount: 1823,
        formulaCellCount: 71,
        chartFamilies: ["scatter", "bar"],
        errorBarCount: 1,
      },
    ],
  });

  const intents = report.intents.map((intent) => intent.intent);

  assert.equal(report.schemaVersion, "mdpr-scientific-chart-intent-v1");
  assert.equal(report.boundary.evidenceOnly, true);
  assert.equal(report.boundary.mdprRuntimeAuthority, true);
  assert.equal(report.boundary.noFinalGeometry, true);
  assert.equal(report.boundary.noRawWorkbookValues, true);
  assert.equal(intents.includes("cdf_curve"), true);
  assert.equal(intents.includes("distribution_box_whisker"), true);
  assert.equal(intents.includes("distribution_quantile_band"), true);
  assert.equal(intents.includes("matrix_series"), true);
  assert.equal(intents.includes("heatmap_summary"), true);
  assert.equal(intents.includes("mean_with_error_bars"), true);
  assert.equal(report.intents.every((intent) => intent.designOrder[0] === "data_evidence"), true);
  assert.equal(report.intents.every((intent) => intent.designOrder[1] === "scientific_chart_intent"), true);
  assert.equal(report.intents.every((intent) => intent.rendererRequest.target === "mdpr.chart-capability"), true);
  assert.equal(report.reviewNotes.some((note) => note.type === "ERROR_BAR_KIND_UNKNOWN"), true);
  assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(report).includes('"rawValues"'), false);
  assert.equal(JSON.stringify(report).includes('"color"'), false);
});

test("buildHighNeedChartRecipeCatalog covers non-basic Excel chart needs with MDPR requests", () => {
  const catalog = buildHighNeedChartRecipeCatalog();
  const recipeKinds = new Set<string>(catalog.recipes.map((recipe) => recipe.kind));

  for (const expected of [
    "cdf_curve",
    "quantile_band",
    "violin_plot",
    "beeswarm_plot",
    "ridgeline_density",
    "slopegraph",
    "dumbbell_plot",
    "bullet_chart",
    "sankey_alluvial",
    "marimekko_mosaic",
    "ternary_plot",
    "forest_plot",
    "bland_altman_plot",
    "control_chart",
  ]) {
    assert.equal(recipeKinds.has(expected), true, `missing ${expected}`);
  }

  assert.equal(catalog.schemaVersion, "mdpr-high-need-chart-recipe-catalog-v1");
  assert.equal(catalog.boundary.evidenceOnly, true);
  assert.equal(catalog.boundary.mdprRuntimeAuthority, true);
  assert.equal(catalog.boundary.noFinalGeometry, true);
  assert.equal(catalog.boundary.noRawWorkbookValues, true);
  assert.equal(catalog.coverage.totalRecipes >= 14, true);
  assert.equal(catalog.coverage.nonBasicExcelRecipes, catalog.recipes.length);
  assert.equal(catalog.recipes.every((recipe) => recipe.dataShapeRequirements.length > 0), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.semanticRoles.length > 0), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.mdprCapabilityRequest.target === "mdpr.chart-capability"), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.fallbackStrategy.length > 0), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.designOrder[0] === "data_evidence"), true);
  assert.equal(JSON.stringify(catalog).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(catalog).includes('"rawValues"'), false);
  assert.equal(JSON.stringify(catalog).includes('"color"'), false);
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

test("reviewFindingHasFinalDecisionField checks keys instead of evidence text", () => {
  assert.equal(reviewFindingHasFinalDecisionField({
    severity: "warning",
    type: "TEXT_ONLY_BOUNDARY_WORDS",
    evidence: {
      path: ".mdpresent/review/style-notes.json",
      note: "The reviewer mentioned color and typography as prose only.",
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "review.boundary",
      operation: "document",
    },
  }), false);

  assert.equal(reviewFindingHasFinalDecisionField({
    severity: "warning",
    type: "BAD_BOUNDARY_KEY",
    evidence: {
      color: "#ffffff",
    },
  }), true);
});

test("reviewDesignPolicy reports design rail risks without final design fields", () => {
  const findings = reviewDesignPolicy({
    htmlDesignAnalysis: {
      schemaVersion: "mdpr-html-design-analysis-v1",
      pptEffectMapping: [
        {
          cssPath: "clip-path",
          cssValue: "polygon(0 0,100% 0,80% 100%)",
          pptEffect: "freeform/SVG fallback risk",
          feasibility: "unsupported",
          editabilityRisk: "high",
        },
        {
          cssPath: "backdrop-filter",
          cssValue: "blur(16px)",
          pptEffect: "semi-transparent fill plus line fallback",
          feasibility: "raster-risk",
          editabilityRisk: "high",
        },
      ],
      tokens: {
        colors: ["#ffffff", "#f8f8f8"],
      },
    },
    componentPackCandidate: {
      radiusScale: ["sm", "md", "lg", "pill"],
      depthScale: ["soft", "hard", "glow", "blur"],
    },
    diagramMetrics: {
      diagramId: "diagram-1",
      nodes: 13,
      edges: 16,
      accentCount: 5,
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.deepEqual(types.sort(), [
    "COMPONENT_STYLE_DRIFT",
    "DIAGRAM_ACCENT_BUDGET_EXCEEDED",
    "DIAGRAM_COMPLEXITY_BUDGET_EXCEEDED",
    "PPT_EFFECT_UNSUPPORTED",
    "RASTER_PRIMARY_CONTENT_RISK",
  ].sort());
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(findings.every((finding) => finding.suggestion), true);
});

test("reviewNarrativeSpine emits claim-title and section-flow suggestions only", () => {
  const suggestions = reviewNarrativeSpine({
    markdown: [
      "# Growth Review",
      "## Activation",
      "### Data",
      "| step | rate |",
      "| --- | --- |",
      "| Trial | 42% |",
      "### Action",
      "- Fix onboarding friction before adding acquisition spend.",
    ].join("\n"),
    manifest: {
      metrics: { slideCount: 2 },
      source: { sha256: "d".repeat(64) },
    },
    sourceNotes: "Audience: executive review. The deck needs explicit claims before evidence.",
    sourcePath: "growth-review.md",
  });

  assert.deepEqual(suggestions.map((suggestion) => suggestion.kind).sort(), [
    "claim-title",
    "section-flow",
  ]);
  assert.equal(suggestions.every((suggestion) => suggestion.generatedBy === "mdpr-skill"), true);
  assert.equal(suggestions.every((suggestion) => suggestion.evidence.sourcePath === "growth-review.md"), true);
  assert.equal(suggestions.every((suggestion) => suggestion.evidence.manifestSlideCount === 2), true);
  assert.equal(suggestions.every((suggestion) => typeof suggestion.suggestion.text === "string"), true);
  assert.equal(JSON.stringify(suggestions).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(suggestions).includes('"layoutId"'), false);
  assert.equal(suggestions.some((suggestion) => suggestion.evidence.sourceNotesExcerpt), true);
  assert.equal(suggestions.some((suggestion) => suggestion.type === "NARRATIVE_CLAIM_TITLE_WEAK"), true);
  assert.equal(suggestions.some((suggestion) => suggestion.type === "NARRATIVE_SECTION_FLOW_GAP"), true);
});

test("reviewTemplateLayoutIntent emits semantic layout hints without placeholder coordinates or layout ids", () => {
  const hints = reviewTemplateLayoutIntent({
    layoutCatalog: {
      layouts: [
        {
          layoutId: "tpl-compare-01",
          name: "Two Column Comparison",
          placeholders: [
            { id: "ph-title", role: "title", x: 0.4, y: 0.3, w: 12, h: 0.8 },
            { id: "ph-left", role: "body", x: 0.6, y: 1.4, w: 5.4, h: 4.8 },
            { id: "ph-right", role: "body", x: 6.5, y: 1.4, w: 5.4, h: 4.8 },
          ],
        },
        {
          layoutId: "tpl-chart-02",
          name: "Chart With Commentary",
          placeholders: [
            { id: "chart-main", role: "chart", coordinates: { x: 0.5, y: 1, w: 7, h: 4 } },
            { id: "commentary", role: "body", coordinates: { x: 8, y: 1, w: 4, h: 4 } },
          ],
        },
      ],
    },
    sourcePath: "template-layout-catalog.json",
  });

  assert.deepEqual(hints.map((hint) => hint.kind), ["semantic-layout-intent", "semantic-layout-intent"]);
  assert.deepEqual(hints.map((hint) => hint.intent).sort(), ["chart-focus", "comparison"]);
  assert.equal(hints.every((hint) => hint.generatedBy === "mdpr-skill"), true);
  assert.equal(hints.every((hint) => hint.evidence.sourcePath === "template-layout-catalog.json"), true);
  assert.equal(hints.some((hint) => hint.evidence.placeholderRoles.includes("chart")), true);
  assert.equal(JSON.stringify(hints).includes("layoutId"), false);
  assert.equal(JSON.stringify(hints).includes('"x"'), false);
  assert.equal(JSON.stringify(hints).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(hints).includes('"id"'), false);
});

test("reviewSpeakerNotes proposes presenter notes and review comments without geometry", () => {
  const suggestions = reviewSpeakerNotes({
    markdown: [
      "# Launch Readout",
      "## Activation",
      "Activation rose to 42% after onboarding fixes.",
      "## Next Decision",
      "- Shift budget from acquisition into retention experiments.",
    ].join("\n"),
    sourceNotes: "Reviewer asks for a sharper executive talk track and one risk callout.",
    sourcePath: "launch-readout.md",
  });

  assert.deepEqual(suggestions.map((suggestion) => suggestion.kind).sort(), ["review-comment", "speaker-note"]);
  assert.equal(suggestions.every((suggestion) => suggestion.generatedBy === "mdpr-skill"), true);
  assert.equal(suggestions.every((suggestion) => suggestion.evidence.sourcePath === "launch-readout.md"), true);
  assert.equal(suggestions.some((suggestion) => suggestion.evidence.sourceNotesExcerpt), true);
  assert.equal(JSON.stringify(suggestions).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(suggestions).includes('"layoutId"'), false);
  assert.equal(JSON.stringify(suggestions).includes('"x"'), false);
});

test("reviewCitationProvenance reports missing citations stale sources and unsupported claims", () => {
  const findings = reviewCitationProvenance({
    markdown: [
      "# Retention Research",
      "## Churn",
      "Activation rose by 42% after onboarding changes.",
      "This proves the retention program reduces churn for enterprise users.",
      "According to the market benchmark, teams need faster reporting.[^1]",
      "[^1]: Vendor benchmark, 2022-01-10.",
    ].join("\n"),
    sources: [
      { id: "vendor-benchmark", title: "Vendor benchmark", date: "2022-01-10", path: "sources/vendor.md" },
    ],
    asOfDate: "2026-06-27",
    sourcePath: "retention.md",
  });

  assert.deepEqual(findings.map((finding) => finding.kind).sort(), [
    "missing-citation",
    "stale-source",
    "unsupported-claim",
  ]);
  assert.equal(findings.every((finding) => finding.generatedBy === "mdpr-skill"), true);
  assert.equal(findings.every((finding) => finding.evidence.sourcePath === "retention.md"), true);
  assert.equal(findings.some((finding) => finding.evidence.sourceId === "vendor-benchmark"), true);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(findings).includes('"layoutId"'), false);
});

test("reviewRenderedPreviewCritique returns visual concern notes with image evidence only", () => {
  const notes = reviewRenderedPreviewCritique({
    renderedImages: [
      { slideId: "slide-1", imagePath: "png/slide-01.png", contactSheetPath: "contact-sheet.png" },
      { slideId: "slide-2", imagePath: "png/slide-02.png", mdprFindingId: "overflow-2", mdprFindingType: "TEXT_OVERFLOW" },
    ],
  });

  assert.equal(notes.length, 2);
  assert.equal(notes.every((note) => note.kind === "visual-concern-note"), true);
  assert.equal(notes.every((note) => note.generatedBy === "mdpr-skill"), true);
  assert.equal(notes.every((note) => note.evidence.renderedImagePath.startsWith("png/")), true);
  assert.equal(notes.some((note) => note.evidence.mdprFindingId === "overflow-2"), true);
  assert.equal(notes.every((note) => note.boundary.mdprValidationAuthority === true), true);
  assert.equal(notes.every((note) => note.boundary.llmMayOverrideMdprGate === false), true);
  assert.equal(JSON.stringify(notes).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(notes).includes('"verdict"'), false);
});

test("reviewAccessibilityContent emits content-only accessibility suggestions", () => {
  const suggestions = reviewAccessibilityContent({
    markdown: [
      "# Operator Review",
      "## ARR",
      "![](charts/arr-growth.png)",
      "ARR is obviously the single best metric because this extremely long operating sentence compresses multiple assumptions about sales motion onboarding maturity finance timing and executive ownership into one breathless claim that should be rewritten for readers.",
    ].join("\n"),
    audience: "executive operators",
    sourcePath: "operator-review.md",
  });

  assert.deepEqual(suggestions.map((suggestion) => suggestion.kind).sort(), [
    "acronym-expansion",
    "alt-text-draft",
    "audience-fit",
    "plain-language",
  ]);
  assert.equal(suggestions.every((suggestion) => suggestion.generatedBy === "mdpr-skill"), true);
  assert.equal(suggestions.every((suggestion) => suggestion.evidence.sourcePath === "operator-review.md"), true);
  assert.equal(suggestions.every((suggestion) => suggestion.boundary.mdprVisualAccessibilityAuthority === true), true);
  assert.equal(JSON.stringify(suggestions).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(suggestions).includes('"fontSize"'), false);
  assert.equal(JSON.stringify(suggestions).includes('"verdict"'), false);
});

test("buildSourceSlideEvidenceLedger maps slide claims to source and MDPR evidence refs", () => {
  const ledger = buildSourceSlideEvidenceLedger({
    markdown: [
      "# Pipeline Review",
      "## Activation",
      "Activation rose by 42% after onboarding changes.[^1]",
      "![Activation chart](charts/activation.png)",
      "## Retention",
      "The cohort table shows enterprise retention improved.[^2]",
      "| segment | retention |",
      "| --- | --- |",
      "| enterprise | 91% |",
    ].join("\n"),
    sources: [
      { id: "growth-study", title: "Growth study", date: "2026-01-10", path: "sources/growth.md" },
      { id: "cohort-table", title: "Cohort table", date: "2026-02-10", path: "sources/cohort.csv" },
    ],
    mdprEvidence: [
      { evidenceId: "chart-activation", slideId: "Activation", kind: "chart", path: "charts/activation.png" },
      { evidenceId: "table-retention", slideId: "Retention", kind: "table", path: "tables/retention.csv" },
    ],
    sourcePath: "pipeline-review.md",
  });

  assert.equal(ledger.schemaVersion, "mdpr-source-slide-evidence-ledger-v1");
  assert.equal(ledger.generatedBy, "mdpr-skill");
  assert.deepEqual(ledger.entries.map((entry) => entry.slideRef), ["Activation", "Retention"]);
  assert.equal(ledger.entries.every((entry) => entry.sourcePath === "pipeline-review.md"), true);
  assert.equal(ledger.entries.some((entry) => entry.sources.some((source) => source.sourceId === "growth-study")), true);
  assert.equal(ledger.entries.some((entry) => entry.mdprEvidenceRefs.some((evidence) => evidence.evidenceId === "table-retention")), true);
  assert.equal(JSON.stringify(ledger).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(ledger).includes('"layoutId"'), false);
  assert.equal(JSON.stringify(ledger).includes('"verdict"'), false);
});

test("renderReadmeTeaserSvg renders pipeline as nodes and connectors", () => {
  const svg = renderReadmeTeaserSvg({
    title: "Save-The-Token",
    subtitle: "Context slimming with sufficiency gates.",
    chips: ["MCP", "token budget"],
    metrics: [
      { label: "Token cut", value: "69.3%" },
      { label: "Recall", value: "100%" },
    ],
    pipeline: ["scan", "measure", "route", "digest"],
    accent: "#1f6feb",
  });

  assert.match(svg, /class="pipeline-node"/);
  assert.match(svg, /class="pipeline-connector"/);
  assert.match(svg, />scan</);
  assert.match(svg, />measure</);
  assert.equal(svg.includes("scan -> measure"), false);
  assert.match(svg, /<svg[^>]+role="img"/);
});
