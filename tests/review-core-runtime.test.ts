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
  reviewChartNarrativeFit,
  buildVisualGuidance,
  buildGeneratorComparisonScorecard,
  buildHighNeedChartRecipeCatalog,
  buildScientificChartIntentReport,
  buildDeckDesignOrderTrace,
  buildDeckDesignOrderTraceFromLedger,
  sourceEvidenceRefsFromLedger,
  validateReviewArtifactDesignOrder,
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

test("reviewCoherence flags evidence and claim semantic alignment gaps without geometry", () => {
  const findings = reviewCoherence({
    presentation: {
      slides: [
        {
          id: "slide-misaligned",
          title: "Revenue improved",
          headingPath: ["Results"],
          blocks: [
            { id: "claim", type: "paragraph", text: "Revenue improved after launch." },
            { id: "chart", type: "chart", text: "Latency percentile distribution by endpoint" },
            { id: "caption", type: "paragraph", text: "Figure 1. p95 latency by endpoint." },
          ],
        },
      ],
    },
    layout: {
      slides: [
        {
          id: "layout-misaligned",
          sourceSlideId: "slide-misaligned",
          layout: { preset: "chart-table" },
          regions: [{ id: "main", role: "chart", blockIds: ["claim", "chart", "caption"] }],
        },
      ],
    },
  });

  assert.equal(findings.some((finding) => finding.type === "EVIDENCE_CLAIM_ALIGNMENT_GAP"), true);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
});

test("reviewCoherence flags repeated chart motif drift using semantic roles only", () => {
  const findings = reviewCoherence({
    presentation: {
      slides: [
        {
          id: "slide-cdf-a",
          title: "Latency threshold",
          headingPath: ["Performance"],
          intent: "data",
          blocks: [
            { id: "claim-a", type: "paragraph", text: "p95 latency improved." },
            { id: "chart-a", type: "chart", text: "CDF latency by endpoint" },
          ],
        },
        {
          id: "slide-cdf-b",
          title: "Latency proof",
          headingPath: ["Performance"],
          intent: "section",
          blocks: [
            { id: "claim-b", type: "paragraph", text: "p95 latency improved." },
            { id: "chart-b", type: "chart", text: "CDF latency by endpoint" },
          ],
        },
        {
          id: "slide-cdf-c",
          title: "Latency appendix",
          headingPath: ["Performance"],
          intent: "appendix",
          blocks: [
            { id: "claim-c", type: "paragraph", text: "p95 latency improved." },
            { id: "chart-c", type: "chart", text: "CDF latency by endpoint" },
          ],
        },
      ],
    },
    layout: {
      slides: [
        { id: "layout-cdf-a", sourceSlideId: "slide-cdf-a", layout: { preset: "chart-table" }, regions: [{ id: "chart", role: "chart", blockIds: ["claim-a", "chart-a"] }] },
        { id: "layout-cdf-b", sourceSlideId: "slide-cdf-b", layout: { preset: "section-divider" }, regions: [{ id: "chart", role: "section", blockIds: ["claim-b", "chart-b"] }] },
        { id: "layout-cdf-c", sourceSlideId: "slide-cdf-c", layout: { preset: "appendix" }, regions: [{ id: "chart", role: "appendix", blockIds: ["claim-c", "chart-c"] }] },
      ],
    },
  });

  assert.equal(findings.some((finding) => finding.type === "SEMANTIC_MOTIF_DRIFT"), true);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(findings).includes('"color"'), false);
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

test("reviewVisualPolicy flags template master and placeholder preservation gaps", () => {
  const findings = reviewVisualPolicy({
    manifest: {
      workflowIntent: "template-fill",
      pptxObjects: [
        { slideId: "slide-1", objectKind: "raster-image", role: "slide" },
      ],
    },
    templateSummary: {
      masterSlides: [{ name: "HCS Content Master" }],
      layouts: [
        {
          name: "Title and Body",
          placeholders: [
            { role: "title", x: 1, y: 1 },
            { role: "body", x: 2, y: 2 },
          ],
        },
      ],
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.equal(types.includes("TEMPLATE_MASTER_THEME_EVIDENCE_MISSING"), true);
  assert.equal(types.includes("PLACEHOLDER_PRESERVATION_EVIDENCE_MISSING"), true);
  assert.equal(types.includes("RASTERIZED_TEMPLATE_FILL_RISK"), true);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(JSON.stringify(findings).includes('"x"'), false);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
});

test("reviewVisualPolicy flags slide-scoped placeholder preservation mismatches", () => {
  const findings = reviewVisualPolicy({
    manifest: {
      workflowIntent: "template-fill",
      templatePreservationEvidence: {
        masterThemeRefs: ["HCS Content Master"],
        placeholderFillRefs: ["slide-1:title"],
        placeholderFillRecords: [
          { slideRef: "slide-1", placeholderRole: "title", sourceElementRefs: ["claim-1"], placeholderFillRef: "slide-1:title" },
        ],
      },
      pptxObjects: [
        { slideId: "slide-2", objectKind: "text-box", role: "title", sourceElementRefs: ["claim-2"] },
      ],
    },
    templateSummary: {
      masterSlides: [{ name: "HCS Content Master" }],
      layouts: [{ name: "Title and Body", placeholders: [{ role: "title" }, { role: "body" }] }],
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.equal(types.includes("PLACEHOLDER_SCOPE_MISMATCH"), true);
  assert.equal(types.includes("TEXT_OVERLAY_WHILE_PLACEHOLDER_EXISTS"), true);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(findings).includes('"objectId"'), false);
});

test("reviewVisualPolicy flags image and icon policy risks in template-fill mode", () => {
  const findings = reviewVisualPolicy({
    manifest: {
      workflowIntent: "template-fill",
      mediaPolicy: {
        imageSearch: "explicit-request-only",
      },
      generatedAssets: [{ kind: "generated-image", promptHash: "abc" }],
      iconCandidates: ["spark", "workflow"],
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.equal(types.includes("IMAGE_WITHOUT_SOURCE_OR_REQUEST"), true);
  assert.equal(types.includes("IMAGE_SEARCH_POLICY_UNDECLARED"), true);
  assert.equal(types.includes("ICON_SUBSTITUTION_FOR_TEMPLATE_SLOT_RISK"), true);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
});

test("reviewVisualPolicy requires generated asset provenance to be bound per asset or slide", () => {
  const findings = reviewVisualPolicy({
    manifest: {
      mediaPolicy: {
        imageSearch: "source-evidence-only",
        sourceImageRefs: ["slide-1:source-image"],
      },
      generatedAssets: [
        { slideId: "slide-1", kind: "generated-image", sourceImageRefs: ["slide-1:source-image"] },
        { slideId: "slide-2", kind: "generated-image", semanticRef: "ambiguous-hero" },
      ],
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.equal(types.includes("GENERATED_ASSET_PROVENANCE_UNBOUND"), true);
  assert.equal(types.includes("SOURCE_IMAGE_SCOPE_MISMATCH"), true);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(JSON.stringify(findings).includes('"prompt"'), false);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
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

test("reviewDesignPolicy flags dense and wordy content before visual decoration", () => {
  const findings = reviewDesignPolicy({
    presentation: {
      slides: [
        {
          id: "slide-dense-copy",
          title: "Dense Copy",
          blocks: [
            { id: "b1", type: "paragraph", text: "This sentence is intentionally long because it combines background, method, result, implication, limitation, next action, stakeholder context, operational detail, and a hidden assumption into one overloaded slide block that should be shortened." },
            { id: "b2", type: "bulletList", text: "- one" },
            { id: "b3", type: "bulletList", text: "- two" },
            { id: "b4", type: "bulletList", text: "- three" },
            { id: "b5", type: "bulletList", text: "- four" },
            { id: "b6", type: "bulletList", text: "- five" },
            { id: "b7", type: "bulletList", text: "- six" },
            { id: "b8", type: "bulletList", text: "- seven" },
          ],
        },
      ],
    },
  });
  const types = findings.map((finding) => finding.type);

  assert.equal(types.includes("READABILITY_COPY_TOO_LONG"), true);
  assert.equal(types.includes("CONTENT_SPLIT_RECOMMENDED"), true);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
  assert.equal(JSON.stringify(findings).includes('"fontSize"'), false);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
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
  assert.equal(report.intents.every((intent) => intent.visualApplication.toneSlots.every((slot) => slot.startsWith("theme."))), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.backgroundTreatment.startsWith("theme.")), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.densityClass.length > 0), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.labelBudgetClass.length > 0), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.recommendedDownshift.length > 0), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.narrativeFit.preferredSlideRoles.length > 0), true);
  assert.equal(report.intents.every((intent) => typeof intent.visualApplication.narrativeFit.requiresClaimSupport === "boolean"), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.labelStrategy.length > 0), true);
  assert.equal(report.intents.every((intent) => intent.visualApplication.densityStrategy.length > 0), true);
  assert.equal(report.reviewNotes.some((note) => note.type === "ERROR_BAR_KIND_UNKNOWN"), true);
  assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(report).includes('"rawValues"'), false);
  assert.equal(JSON.stringify(report).includes("#"), false);
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
  assert.equal(catalog.recipes.every((recipe) => recipe.visualApplication.toneSlots.every((slot) => slot.startsWith("theme."))), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.visualApplication.backgroundTreatment.startsWith("theme.")), true);
  assert.equal(catalog.recipes.some((recipe) => recipe.visualApplication.backgroundTreatment === "theme.surface.chartPanel"), true);
  assert.equal(catalog.recipes.some((recipe) => recipe.visualApplication.backgroundTreatment === "theme.surface.subtleBand"), true);
  assert.equal(catalog.recipes.some((recipe) => recipe.visualApplication.aggregationRequired), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.visualApplication.densityClass.length > 0), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.visualApplication.narrativeFit.evidenceBinding.length > 0), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.visualApplication.labelStrategy.length > 0), true);
  assert.equal(catalog.recipes.every((recipe) => recipe.visualApplication.densityStrategy.length > 0), true);
  assert.equal(JSON.stringify(catalog).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(catalog).includes('"rawValues"'), false);
  assert.equal(JSON.stringify(catalog).includes("#"), false);
  assert.equal(JSON.stringify(catalog).includes('"color"'), false);
});

test("buildDeckDesignOrderTrace records deck-stage prerequisites and boundary-safe findings", () => {
  const trace = buildDeckDesignOrderTrace({
    narrativeSpineRefs: ["narrative:claim:activation"],
    sourceEvidenceRefs: ["source:sheet:Overall-cdf"],
    slideRoleRefs: ["slideRole:data"],
    chartIntentReport: buildScientificChartIntentReport({
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
      ],
    }),
    visualGuidanceRefs: ["visual:chart:theme-bound"],
    themeBindingRefs: ["theme:profile:technical"],
    mdprValidationRefs: ["mdpr:validation:coherence"],
    reviewNoteRefs: ["review:note:1"],
  });

  assert.equal(trace.schemaVersion, "mdpr-deck-design-order-trace-v1");
  assert.deepEqual(trace.entries.map((entry) => entry.stage), [
    "narrative_spine",
    "source_evidence",
    "slide_role",
    "chart_intent",
    "semantic_visual_guidance",
    "theme_binding_request",
    "mdpr_validation_refs",
    "review_notes",
  ]);
  assert.equal(trace.findings.length, 0);
  assert.equal(validateReviewArtifactDesignOrder(trace).length, 0);
  assert.equal(JSON.stringify(trace).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(trace).includes('"color"'), false);
});

test("buildDeckDesignOrderTrace and validator flag out-of-order or boundary-leaking artifacts", () => {
  const chartIntentReport = buildScientificChartIntentReport({
    sourceLabel: "chart-only",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 20,
        maxColumns: 4,
        numericCellCount: 40,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
    ],
  });
  const trace = buildDeckDesignOrderTrace({
    chartIntentReport,
    visualGuidanceRefs: ["visual:chart:theme-bound"],
  });
  const validation = validateReviewArtifactDesignOrder({
    schemaVersion: "custom-review-artifact",
    designOrder: ["semantic_visual_guidance", "source_evidence"],
    evidenceRefs: [],
    coordinates: [1, 2],
  });

  assert.equal(trace.entries.find((entry) => entry.stage === "source_evidence")?.evidenceRefs.some((ref) => ref.startsWith("chartIntent:")), false);
  assert.equal(trace.findings.some((finding) => finding.type === "DESIGN_ORDER_SOURCE_EVIDENCE_BACKFILLED"), true);
  assert.equal(trace.findings.some((finding) => finding.type === "DESIGN_ORDER_PREREQUISITE_MISSING"), true);
  assert.equal(validateReviewArtifactDesignOrder(chartIntentReport).some((finding) => finding.type === "REVIEW_ARTIFACT_EVIDENCE_MISSING"), false);
  assert.equal(validation.some((finding) => finding.type === "DESIGN_ORDER_OUT_OF_SEQUENCE"), true);
  assert.equal(validation.some((finding) => finding.type === "REVIEW_ARTIFACT_BOUNDARY_FIELD_LEAK"), true);
  assert.equal(validation.some((finding) => finding.type === "REVIEW_ARTIFACT_EVIDENCE_MISSING"), true);
});

test("buildDeckDesignOrderTrace flags stage-incompatible evidence refs", () => {
  const chartIntentReport = buildScientificChartIntentReport({
    sourceLabel: "stage-compat",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 20,
        maxColumns: 4,
        numericCellCount: 40,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
    ],
  });
  const validTrace = buildDeckDesignOrderTrace({
    narrativeSpineRefs: ["narrative:claim:latency"],
    sourceEvidenceRefs: ["sheet:Overall-cdf", "rows:20", "numericCells:40"],
    slideRoleRefs: ["slideRole:data"],
    visualGuidanceRefs: ["visualApplication:cdf_curve:primary-visual"],
    themeBindingRefs: ["theme.chart.sequence"],
    mdprValidationRefs: ["mdpr:validation:coherence"],
    reviewNoteRefs: ["reviewNote:CDF_SEMANTICS_REQUIRED:Overall-cdf"],
  });
  const misplacedTrace = buildDeckDesignOrderTrace({
    narrativeSpineRefs: ["narrative:claim:latency"],
    sourceEvidenceRefs: ["visualApplication:cdf_curve:primary-visual"],
    slideRoleRefs: ["theme.chart.sequence"],
    chartIntentReport,
    mdprValidationRefs: ["reviewNote:CDF_SEMANTICS_REQUIRED:Overall-cdf"],
  });
  const mixedTrace = buildDeckDesignOrderTrace({
    narrativeSpineRefs: ["narrative:claim:latency"],
    sourceEvidenceRefs: ["sheet:Overall-cdf", "visualApplication:cdf_curve:primary-visual"],
    slideRoleRefs: ["slideRole:data"],
    chartIntentReport,
  });

  assert.equal(validTrace.findings.some((finding) => finding.type === "DESIGN_ORDER_REF_STAGE_MISMATCH"), false);
  assert.equal(misplacedTrace.findings.some((finding) => finding.type === "DESIGN_ORDER_REF_STAGE_MISMATCH"), true);
  assert.equal(misplacedTrace.entries.find((entry) => entry.stage === "source_evidence")?.status, "missing");
  assert.equal(misplacedTrace.findings.some((finding) => finding.type === "DESIGN_ORDER_PREREQUISITE_MISSING" && finding.evidence?.stage === "chart_intent"), true);
  assert.equal(mixedTrace.entries.find((entry) => entry.stage === "source_evidence")?.status, "present");
  assert.equal(mixedTrace.findings.some((finding) => finding.type === "DESIGN_ORDER_REF_STAGE_MISMATCH"), true);
  assert.equal(mixedTrace.findings.some((finding) => finding.type === "DESIGN_ORDER_PREREQUISITE_MISSING" && finding.evidence?.stage === "chart_intent"), false);
  assert.equal(JSON.stringify(misplacedTrace).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(misplacedTrace).includes('"color"'), false);
});

test("reviewChartNarrativeFit checks chart guidance against slide role and claim support", () => {
  const cdf = buildScientificChartIntentReport({
    sourceLabel: "narrative-fit",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 20,
        maxColumns: 4,
        numericCellCount: 40,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
    ],
  }).intents[0]!;
  const matrix = buildScientificChartIntentReport({
    sourceLabel: "narrative-fit",
    sheets: [
      {
        sheetLabel: "Feasibility_sine",
        nonemptyRows: 49,
        maxColumns: 181,
        numericCellCount: 8643,
        formulaCellCount: 3600,
        chartFamilies: ["line"],
      },
    ],
  }).intents.find((intent) => intent.intent === "matrix_series")!;
  const findings = reviewChartNarrativeFit({
    presentation: {
      slides: [
        {
          id: "slide-good",
          title: "p95 latency improved",
          intent: "data",
          headingPath: ["Performance"],
          blocks: [
            { id: "claim-good", type: "paragraph", text: "p95 latency improved across endpoints." },
            { id: "chart-good", type: "chart", text: "CDF latency by endpoint" },
          ],
        },
        {
          id: "slide-bad",
          title: "Appendix",
          intent: "section",
          headingPath: ["Performance"],
          blocks: [
            { id: "chart-bad", type: "chart", text: "CDF latency by endpoint" },
          ],
        },
        {
          id: "slide-matrix",
          title: "Dense matrix appendix",
          intent: "appendix",
          headingPath: ["Appendix"],
          blocks: [
            { id: "claim-matrix", type: "paragraph", text: "Dense feasibility matrix is summarized here." },
            { id: "chart-matrix", type: "chart", text: "Feasibility matrix series" },
          ],
        },
      ],
    },
    layout: {
      slides: [
        { id: "layout-good", sourceSlideId: "slide-good", layout: { preset: "chart-table" }, regions: [{ id: "main", role: "chart", blockIds: ["claim-good", "chart-good"] }] },
        { id: "layout-bad", sourceSlideId: "slide-bad", layout: { preset: "section-divider" }, regions: [{ id: "main", role: "section", blockIds: ["chart-bad"] }] },
        { id: "layout-matrix", sourceSlideId: "slide-matrix", layout: { preset: "appendix" }, regions: [{ id: "main", role: "appendix", blockIds: ["claim-matrix", "chart-matrix"] }] },
      ],
    },
    chartPlacements: [
      { sourceSlideId: "slide-good", chartBlockId: "chart-good", intent: cdf },
      { sourceSlideId: "slide-bad", chartBlockId: "chart-bad", intent: cdf },
      { sourceSlideId: "slide-matrix", chartBlockId: "chart-matrix", intent: matrix },
    ],
  });

  assert.equal(findings.some((finding) => finding.type === "CHART_NARRATIVE_FIT_GAP"), true);
  assert.equal(findings.some((finding) => finding.type === "CHART_CLAIM_SUPPORT_MISSING"), true);
  assert.equal(findings.some((finding) => finding.slideId === "layout-good"), false);
  assert.equal(findings.some((finding) => finding.slideId === "layout-matrix"), false);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
});

test("reviewChartNarrativeFit validates chart placement block identity", () => {
  const cdf = buildScientificChartIntentReport({
    sourceLabel: "placement-fit",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 20,
        maxColumns: 4,
        numericCellCount: 40,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
    ],
  }).intents[0]!;
  const findings = reviewChartNarrativeFit({
    presentation: {
      slides: [
        {
          id: "slide-placement",
          title: "p95 latency improved",
          intent: "data",
          headingPath: ["Performance"],
          blocks: [
            { id: "claim", type: "paragraph", text: "p95 latency improved across endpoints." },
            { id: "chart-good", type: "chart", text: "CDF latency by endpoint" },
            { id: "paragraph-bad", type: "paragraph", text: "Revenue table narrative" },
            { id: "table-mismatch", type: "table", text: "Revenue by account" },
          ],
        },
      ],
    },
    layout: {
      slides: [
        { id: "layout-placement", sourceSlideId: "slide-placement", layout: { preset: "chart-table" }, regions: [{ id: "main", role: "chart", blockIds: ["claim", "chart-good", "paragraph-bad", "table-mismatch"] }] },
      ],
    },
    chartPlacements: [
      { sourceSlideId: "slide-missing", chartBlockId: "chart-any", intent: cdf },
      { sourceSlideId: "slide-placement", chartBlockId: "chart-good", intent: cdf },
      { sourceSlideId: "slide-placement", chartBlockId: "chart-missing", intent: cdf },
      { sourceSlideId: "slide-placement", chartBlockId: "paragraph-bad", intent: cdf },
      { sourceSlideId: "slide-placement", chartBlockId: "table-mismatch", intent: cdf },
    ],
  });

  assert.equal(findings.some((finding) => finding.type === "CHART_PLACEMENT_SLIDE_MISSING"), true);
  assert.equal(findings.some((finding) => finding.type === "CHART_PLACEMENT_BLOCK_MISSING"), true);
  assert.equal(findings.some((finding) => finding.type === "CHART_PLACEMENT_BLOCK_TYPE_MISMATCH"), true);
  assert.equal(findings.some((finding) => finding.type === "CHART_PLACEMENT_INTENT_MISMATCH"), true);
  assert.equal(findings.filter((finding) => finding.evidence?.sourceSlideId === "slide-missing").length, 1);
  assert.equal(findings.some((finding) => finding.evidence?.chartBlockId === "chart-good"), false);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(findings).includes('"color"'), false);
});

test("reviewCoherence optionally integrates chart narrative fit findings", () => {
  const cdf = buildScientificChartIntentReport({
    sourceLabel: "integrated-fit",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 20,
        maxColumns: 4,
        numericCellCount: 40,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
    ],
  }).intents[0]!;
  const baseInput = {
    presentation: {
      slides: [
        {
          id: "slide-integrated",
          title: "p95 latency improved",
          intent: "data",
          headingPath: ["Performance"],
          blocks: [
            { id: "claim", type: "paragraph", text: "p95 latency improved across endpoints." },
            { id: "chart-good", type: "chart", text: "CDF latency by endpoint" },
          ],
        },
      ],
    },
    layout: {
      slides: [
        { id: "layout-integrated", sourceSlideId: "slide-integrated", layout: { preset: "chart-table" }, regions: [{ id: "main", role: "chart", blockIds: ["claim", "chart-good"] }] },
      ],
    },
  };

  assert.equal(reviewCoherence(baseInput).some((finding) => finding.type.startsWith("CHART_PLACEMENT")), false);

  const findings = reviewCoherence({
    ...baseInput,
    chartPlacements: [
      { sourceSlideId: "slide-missing", chartBlockId: "chart-any", intent: cdf },
    ],
  });

  assert.equal(findings.filter((finding) => finding.type === "CHART_PLACEMENT_SLIDE_MISSING").length, 1);
  assert.equal(findings.every((finding) => !reviewFindingHasFinalDecisionField(finding)), true);
});

test("validateReviewArtifactDesignOrder scans nested scientific chart and recipe orders", () => {
  const report = buildScientificChartIntentReport({
    sourceLabel: "nested-order",
    sheets: [
      {
        sheetLabel: "Overall-cdf",
        nonemptyRows: 20,
        maxColumns: 4,
        numericCellCount: 40,
        formulaCellCount: 0,
        chartFamilies: ["line"],
      },
    ],
  });
  const scrambled = structuredClone(report) as typeof report;
  scrambled.intents[0]!.designOrder = ["semantic_visual_guidance", "data_evidence"];
  const recipeCatalog = buildHighNeedChartRecipeCatalog();
  const scrambledCatalog = structuredClone(recipeCatalog) as typeof recipeCatalog;
  scrambledCatalog.recipes[0]!.designOrder = ["renderer_capability_request", "data_evidence"];

  assert.equal(validateReviewArtifactDesignOrder(report).some((finding) => finding.type === "DESIGN_ORDER_OUT_OF_SEQUENCE"), false);
  assert.equal(validateReviewArtifactDesignOrder(recipeCatalog).some((finding) => finding.type === "REVIEW_ARTIFACT_EVIDENCE_MISSING"), false);
  assert.equal(validateReviewArtifactDesignOrder(scrambled).some((finding) => finding.type === "DESIGN_ORDER_OUT_OF_SEQUENCE"), true);
  assert.equal(validateReviewArtifactDesignOrder(scrambledCatalog).some((finding) => finding.type === "DESIGN_ORDER_OUT_OF_SEQUENCE"), true);
});

test("validateReviewArtifactDesignOrder scans deck trace entries stage order", () => {
  const trace = buildDeckDesignOrderTrace({
    narrativeSpineRefs: ["narrative:claim:latency"],
    sourceEvidenceRefs: ["sheet:Overall-cdf"],
    slideRoleRefs: ["slideRole:data"],
    visualGuidanceRefs: ["visualApplication:cdf_curve:primary-visual"],
    themeBindingRefs: ["theme.chart.sequence"],
    mdprValidationRefs: ["mdpr:validation:coherence"],
    reviewNoteRefs: ["reviewNote:CDF_SEMANTICS_REQUIRED:Overall-cdf"],
  });
  const scrambled = structuredClone(trace) as typeof trace;
  scrambled.entries = [
    trace.entries.find((entry) => entry.stage === "semantic_visual_guidance")!,
    trace.entries.find((entry) => entry.stage === "source_evidence")!,
  ];

  assert.equal(validateReviewArtifactDesignOrder(trace).some((finding) => finding.type === "DESIGN_ORDER_OUT_OF_SEQUENCE"), false);
  assert.equal(validateReviewArtifactDesignOrder(scrambled).some((finding) => finding.type === "DESIGN_ORDER_OUT_OF_SEQUENCE"), true);
  assert.equal(JSON.stringify(validateReviewArtifactDesignOrder(scrambled)).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(validateReviewArtifactDesignOrder(scrambled)).includes('"color"'), false);
});

test("validateReviewArtifactDesignOrder enforces deck trace entry prerequisites", () => {
  const missingPrereq = {
    schemaVersion: "mdpr-deck-design-order-trace-v1",
    entries: [
      {
        stage: "chart_intent",
        evidenceRefs: ["chartIntent:cdf_curve"],
      },
    ],
  };
  const incompatiblePrereq = {
    schemaVersion: "mdpr-deck-design-order-trace-v1",
    entries: [
      {
        stage: "source_evidence",
        evidenceRefs: ["visualApplication:cdf_curve:primary-visual"],
      },
      {
        stage: "slide_role",
        evidenceRefs: ["slideRole:data"],
      },
      {
        stage: "chart_intent",
        evidenceRefs: ["chartIntent:cdf_curve"],
      },
    ],
  };

  assert.equal(validateReviewArtifactDesignOrder(missingPrereq).some((finding) => finding.type === "DESIGN_ORDER_PREREQUISITE_MISSING"), true);
  assert.equal(validateReviewArtifactDesignOrder(incompatiblePrereq).some((finding) => finding.type === "DESIGN_ORDER_PREREQUISITE_MISSING"), true);
  assert.equal(validateReviewArtifactDesignOrder(incompatiblePrereq).some((finding) => finding.type === "DESIGN_ORDER_REF_STAGE_MISMATCH"), true);
  assert.equal(JSON.stringify(validateReviewArtifactDesignOrder(incompatiblePrereq)).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(validateReviewArtifactDesignOrder(incompatiblePrereq)).includes('"rawValues"'), false);
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

test("reviewAccessibilityContent references MDPR paragraph marker normalization as source cleanup", () => {
  const suggestions = reviewAccessibilityContent({
    markdown: [
      "# Marker Review",
      "## Notes",
      "-공백 없는 하이픈 항목",
      "– en dash item",
      "-3 point change is a sentence, not a bullet.",
      "---",
    ].join("\n"),
    sourcePath: "marker-review.md",
  });

  const cleanup = suggestions.find((suggestion) => suggestion.type === "MARKDOWN_MARKER_NORMALIZATION_NOTE");
  assert.equal(cleanup?.kind, "source-cleanup");
  assert.equal(cleanup?.evidence.sourcePath, "marker-review.md");
  assert.match(cleanup?.suggestion.text ?? "", /MDPR owns paragraph-marker normalization/);
  assert.equal(JSON.stringify(cleanup).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(cleanup).includes('"fontSize"'), false);
});

test("reviewAccessibilityContent prefers MDPR source-cleanup diagnostics over marker heuristics", () => {
  const suggestions = reviewAccessibilityContent({
    markdown: [
      "# Marker Review",
      "## Notes",
      "-공백 없는 하이픈 항목",
    ].join("\n"),
    sourcePath: "marker-review.md",
    sourceCleanupDiagnostics: [
      {
        code: "SOURCE_CLEANUP_PARAGRAPH_MARKER",
        details: {
          sourceLine: 3,
          originalMarker: "-",
          normalizedMarker: "-",
          action: "normalize-to-list-marker",
        },
      },
    ],
  });
  const cleanup = suggestions.find((suggestion) => suggestion.type === "MARKDOWN_MARKER_NORMALIZATION_NOTE");

  assert.equal(cleanup?.evidence.diagnosticLine, 3);
  assert.equal(cleanup?.evidence.originalMarker, "-");
  assert.equal(cleanup?.evidence.markdownExcerpt, undefined);
  assert.match(cleanup?.suggestion.text ?? "", /MDPR reported paragraph-marker source cleanup/);
  assert.equal(JSON.stringify(cleanup).includes('"coordinates"'), false);
});

test("reviewAccessibilityContent suppresses marker heuristics when MDPR diagnostics are explicitly empty", () => {
  const suggestions = reviewAccessibilityContent({
    markdown: [
      "# Marker Review",
      "## Notes",
      "-공백 없는 하이픈 항목",
    ].join("\n"),
    sourcePath: "marker-review.md",
    sourceCleanupDiagnostics: [],
  });

  assert.equal(suggestions.some((suggestion) => suggestion.type === "MARKDOWN_MARKER_NORMALIZATION_NOTE"), false);
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

test("source ledger bridges into deck design order trace without chart backfill", () => {
  const ledger = buildSourceSlideEvidenceLedger({
    markdown: [
      "# Pipeline Review",
      "## Activation",
      "Activation rose by 42% after onboarding changes.[^1]",
      "## Retention",
      "Retention improved by 12% for enterprise cohorts.[^2]",
    ].join("\n"),
    sources: [
      { id: "growth-study", title: "Growth study", path: "sources/growth.md" },
      { id: "retention-study", title: "Retention study", path: "sources/retention.md" },
    ],
    mdprEvidence: [
      { evidenceId: "chart-activation", slideId: "Activation", kind: "chart", path: "charts/activation.png" },
      { evidenceId: "table-retention", slideId: "Retention", kind: "table", path: "tables/retention.csv" },
    ],
    sourcePath: "pipeline-review.md",
  });
  const refs = sourceEvidenceRefsFromLedger(ledger);
  const trace = buildDeckDesignOrderTraceFromLedger({
    ledger,
    narrativeSpineRefs: ["narrative:claim:activation"],
    slideRoleRefs: ["slideRole:data"],
  });
  const disconnected = buildDeckDesignOrderTraceFromLedger({
    ledger,
    sourceEvidenceRefs: ["source:other.md"],
    narrativeSpineRefs: ["narrative:claim:activation"],
  });
  const scopedMismatch = buildDeckDesignOrderTraceFromLedger({
    ledger,
    sourceEvidenceRefs: ["evidence:table-retention", "slide:retention"],
    narrativeSpineRefs: ["narrative:claim:activation"],
    slideRoleRefs: ["slide:activation"],
  });

  assert.equal(refs.some((ref) => ref.startsWith("source:")), true);
  assert.equal(refs.some((ref) => ref.startsWith("evidence:")), true);
  assert.equal(refs.some((ref) => ref.startsWith("claim:")), true);
  assert.equal(refs.some((ref) => ref.startsWith("slide:")), true);
  assert.equal(trace.findings.some((finding) => finding.type === "DESIGN_ORDER_SOURCE_EVIDENCE_BACKFILLED"), false);
  assert.equal(trace.findings.some((finding) => finding.type === "DESIGN_ORDER_REF_STAGE_MISMATCH"), false);
  assert.equal(disconnected.findings.some((finding) => finding.type === "SOURCE_EVIDENCE_LEDGER_DISCONNECTED"), true);
  assert.equal(scopedMismatch.findings.some((finding) => finding.type === "SOURCE_EVIDENCE_LEDGER_SCOPE_MISMATCH"), true);
  assert.equal(JSON.stringify(trace).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(trace).includes('"rawValues"'), false);
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
