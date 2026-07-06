export type ReviewFinding = {
  severity: "info" | "warning" | "error";
  type: string;
  slideId?: string;
  evidence?: Record<string, unknown>;
  suggestion?: {
    kind: "mdpr-policy" | "mdpr-rulebook" | "mdpr-config";
    target: string;
    operation: "increaseWeight" | "decreaseWeight" | "enableRule" | "disableRule" | "document";
    value?: string | number | boolean;
  };
};

export type ReviewReport = {
  version: "1.0";
  source: "mdpr-manifest";
  findings: ReviewFinding[];
};

export type VisualGuidanceCategory =
  | "hierarchy"
  | "readability"
  | "contrast_or_legibility"
  | "object_semantics"
  | "layout_density"
  | "theme_fit"
  | "decoration_noise"
  | "editability_risk";

export type VisualGuidanceFinding = {
  category: VisualGuidanceCategory;
  severity: ReviewFinding["severity"];
  sourceFindingType: string;
  slideId?: string;
  evidenceRefs: string[];
  recommendation: {
    target: string;
    text: string;
  };
};

export type VisualGuidanceReport = {
  schemaVersion: "mdpr-visual-guidance-v1";
  generatedBy: "mdpr-skill";
  boundary: {
    mdprValidationAuthority: true;
    noFinalGeometry: true;
    noSubjectiveBeautyGate: true;
  };
  findings: VisualGuidanceFinding[];
};

export type GeneratorComparisonScorecardInput = {
  mdpr: {
    editableObjectCoverage?: number;
    deckCoherenceFindingCount?: number;
    designDecisionTracePresent?: boolean;
    layoutValidationRefCount?: number;
    overflowOrDensityFindingCount?: number;
    nativeTableChartProofSupport?: boolean;
  };
  references: Array<{
    name: string;
    outputModel: string;
    editableObjectCoverage?: number;
    manualReviewRequired?: boolean;
  }>;
};

export type GeneratorComparisonDimension = {
  winner: "mdpr" | "reference" | "manual-review";
  evidence: string[];
};

export type GeneratorComparisonScorecard = {
  schemaVersion: "mdpr-generator-comparison-scorecard-v1";
  generatedBy: "mdpr-skill";
  boundary: {
    evidenceOnly: true;
    noSubjectiveBeautyGate: true;
    mdprRuntimeAuthority: true;
  };
  comparedReferences: Array<{ name: string; outputModel: string }>;
  dimensions: {
    editable_object_coverage: GeneratorComparisonDimension;
    deck_coherence_findings: GeneratorComparisonDimension;
    design_decision_trace_presence: GeneratorComparisonDimension;
    layout_validation_refs: GeneratorComparisonDimension;
    overflow_or_density_findings: GeneratorComparisonDimension;
    native_table_chart_proof_support: GeneratorComparisonDimension;
    manual_review_required: GeneratorComparisonDimension;
  };
};

export type ScientificChartIntentKind =
  | "cdf_curve"
  | "distribution_box_whisker"
  | "distribution_quantile_band"
  | "mean_with_error_bars"
  | "matrix_series"
  | "heatmap_summary";

export type ScientificChartFamily = "line" | "bar" | "scatter" | "area" | "boxWhisker" | "heatmap" | "unknown";

export type ScientificChartSheetEvidence = {
  sheetLabel: string;
  nonemptyRows: number;
  maxColumns: number;
  numericCellCount: number;
  formulaCellCount: number;
  chartFamilies?: ScientificChartFamily[];
  errorBarCount?: number;
  errorBarKind?: "stddev" | "stderr" | "confidence_interval" | "minmax" | "custom" | "unknown";
};

export type ScientificChartIntentInput = {
  sourceLabel: string;
  sheets: ScientificChartSheetEvidence[];
};

export type ScientificChartDesignOrderStep =
  | "data_evidence"
  | "scientific_chart_intent"
  | "semantic_visual_guidance"
  | "renderer_capability_request"
  | "review_notes";

const SCIENTIFIC_CHART_DESIGN_ORDER: ScientificChartDesignOrderStep[] = [
  "data_evidence",
  "scientific_chart_intent",
  "semantic_visual_guidance",
  "renderer_capability_request",
  "review_notes",
];

export type ScientificChartIntentEntry = {
  intent: ScientificChartIntentKind;
  sourceSheetLabel: string;
  evidenceRefs: string[];
  semanticRoles: string[];
  designOrder: ScientificChartDesignOrderStep[];
  visualApplication: ChartVisualApplicationGuidance;
  rendererRequest: {
    target: "mdpr.chart-capability";
    supportNeeded: string;
  };
  reviewNotes: string[];
};

export type ScientificChartIntentReport = {
  schemaVersion: "mdpr-scientific-chart-intent-v1";
  generatedBy: "mdpr-skill";
  sourceLabel: string;
  boundary: {
    evidenceOnly: true;
    mdprRuntimeAuthority: true;
    noFinalGeometry: true;
    noRawWorkbookValues: true;
  };
  intents: ScientificChartIntentEntry[];
  reviewNotes: Array<{
    type: "ERROR_BAR_KIND_UNKNOWN" | "DENSE_MATRIX_NEEDS_SUMMARY" | "DISTRIBUTION_SEMANTICS_REQUIRED" | "CDF_SEMANTICS_REQUIRED";
    sourceSheetLabel: string;
    text: string;
  }>;
};

export type HighNeedChartRecipeKind =
  | "cdf_curve"
  | "quantile_band"
  | "violin_plot"
  | "beeswarm_plot"
  | "ridgeline_density"
  | "slopegraph"
  | "dumbbell_plot"
  | "bullet_chart"
  | "sankey_alluvial"
  | "marimekko_mosaic"
  | "ternary_plot"
  | "forest_plot"
  | "bland_altman_plot"
  | "control_chart";

export type HighNeedChartRecipe = {
  kind: HighNeedChartRecipeKind;
  displayName: string;
  excelDefaultSupport: "not_direct_native" | "workaround_only" | "native_but_semantically_incomplete";
  whyNeeded: string;
  dataShapeRequirements: string[];
  semanticRoles: string[];
  designOrder: ScientificChartDesignOrderStep[];
  visualApplication: ChartVisualApplicationGuidance;
  mdprCapabilityRequest: {
    target: "mdpr.chart-capability";
    supportNeeded: string;
  };
  fallbackStrategy: string;
};

export type ChartVisualApplicationGuidance = {
  chartChoice: "primary-visual" | "supporting-proof" | "small-multiple" | "background-proof" | "comparison-strip";
  toneSlots: string[];
  backgroundTreatment: "theme.surface.chartPanel" | "theme.surface.subtleBand" | "theme.surface.transparent" | "theme.surface.proofHighlight";
  densityClass: "sparse" | "moderate" | "dense" | "very-dense";
  labelBudgetClass: "direct-labels" | "key-labels" | "legend-or-callouts" | "aggregate-first";
  recommendedDownshift: "none" | "small-multiple" | "distribution-strip" | "aggregate-summary" | "table-plus-chart" | "fallback-note";
  aggregationRequired: boolean;
  narrativeFit: {
    preferredSlideRoles: string[];
    requiresClaimSupport: boolean;
    evidenceBinding: string;
  };
  labelStrategy: string;
  densityStrategy: string;
};

export type DeckDesignOrderStage =
  | "narrative_spine"
  | "source_evidence"
  | "slide_role"
  | "chart_intent"
  | "semantic_visual_guidance"
  | "theme_binding_request"
  | "mdpr_validation_refs"
  | "review_notes";

export type DeckDesignOrderTraceInput = {
  narrativeSpineRefs?: string[];
  sourceEvidenceRefs?: string[];
  slideRoleRefs?: string[];
  chartIntentReport?: ScientificChartIntentReport;
  visualGuidanceRefs?: string[];
  themeBindingRefs?: string[];
  mdprValidationRefs?: string[];
  reviewNoteRefs?: string[];
};

export type DeckDesignOrderTraceFromLedgerInput = DeckDesignOrderTraceInput & {
  ledger: SourceSlideEvidenceLedger;
};

export type ChartNarrativePlacement = {
  sourceSlideId: string;
  chartBlockId?: string;
  intent: ScientificChartIntentEntry;
};

export type ChartNarrativeFitInput = ReviewCoreInput & {
  chartPlacements: ChartNarrativePlacement[];
};

export type DeckDesignOrderTraceEntry = {
  stage: DeckDesignOrderStage;
  evidenceRefs: string[];
  dependsOn: DeckDesignOrderStage[];
  status: "present" | "missing";
};

export type DeckDesignOrderTraceReport = {
  schemaVersion: "mdpr-deck-design-order-trace-v1";
  generatedBy: "mdpr-skill";
  boundary: {
    evidenceOnly: true;
    mdprRuntimeAuthority: true;
    noFinalGeometry: true;
    noRawWorkbookValues: true;
    noFinalValidationVerdict: true;
  };
  entries: DeckDesignOrderTraceEntry[];
  findings: ReviewFinding[];
};

export type HighNeedChartRecipeCatalog = {
  schemaVersion: "mdpr-high-need-chart-recipe-catalog-v1";
  generatedBy: "mdpr-skill";
  sourceBoundary: {
    excelNativeChartReference: string;
    rule: "catalog-covers-non-basic-or-workaround-only-chart-needs";
  };
  boundary: {
    evidenceOnly: true;
    mdprRuntimeAuthority: true;
    noFinalGeometry: true;
    noRawWorkbookValues: true;
  };
  coverage: {
    totalRecipes: number;
    nonBasicExcelRecipes: number;
    minimumExpectedRecipes: 12;
  };
  recipes: HighNeedChartRecipe[];
};

export function buildReviewReport(findings: ReviewFinding[]): ReviewReport {
  return { version: "1.0", source: "mdpr-manifest", findings };
}

export function buildVisualGuidance(findings: ReviewFinding[]): VisualGuidanceReport {
  return {
    schemaVersion: "mdpr-visual-guidance-v1",
    generatedBy: "mdpr-skill",
    boundary: {
      mdprValidationAuthority: true,
      noFinalGeometry: true,
      noSubjectiveBeautyGate: true,
    },
    findings: findings.map((finding) => ({
      category: visualGuidanceCategory(finding),
      severity: finding.severity,
      sourceFindingType: finding.type,
      ...(finding.slideId ? { slideId: finding.slideId } : {}),
      evidenceRefs: evidenceRefsForFinding(finding),
      recommendation: {
        target: `mdpr.${visualGuidanceCategory(finding)}`,
        text: guidanceTextForFinding(finding),
      },
    })),
  };
}

export function buildGeneratorComparisonScorecard(input: GeneratorComparisonScorecardInput): GeneratorComparisonScorecard {
  const maxReferenceCoverage = Math.max(0, ...input.references.map((reference) => reference.editableObjectCoverage ?? 0));
  const manualReviewRequired = input.references.some((reference) => reference.manualReviewRequired !== false);
  return {
    schemaVersion: "mdpr-generator-comparison-scorecard-v1",
    generatedBy: "mdpr-skill",
    boundary: {
      evidenceOnly: true,
      noSubjectiveBeautyGate: true,
      mdprRuntimeAuthority: true,
    },
    comparedReferences: input.references.map((reference) => ({
      name: reference.name,
      outputModel: reference.outputModel,
    })),
    dimensions: {
      editable_object_coverage: {
        winner: (input.mdpr.editableObjectCoverage ?? 0) >= maxReferenceCoverage ? "mdpr" : "reference",
        evidence: [
          `mdpr.editableObjectCoverage=${input.mdpr.editableObjectCoverage ?? "unknown"}`,
          `reference.maxEditableObjectCoverage=${maxReferenceCoverage}`,
        ],
      },
      deck_coherence_findings: {
        winner: "manual-review",
        evidence: [`mdpr.deckCoherenceFindingCount=${input.mdpr.deckCoherenceFindingCount ?? "unknown"}`],
      },
      design_decision_trace_presence: {
        winner: input.mdpr.designDecisionTracePresent ? "mdpr" : "manual-review",
        evidence: [`mdpr.designDecisionTracePresent=${Boolean(input.mdpr.designDecisionTracePresent)}`],
      },
      layout_validation_refs: {
        winner: (input.mdpr.layoutValidationRefCount ?? 0) > 0 ? "mdpr" : "manual-review",
        evidence: [`mdpr.layoutValidationRefCount=${input.mdpr.layoutValidationRefCount ?? 0}`],
      },
      overflow_or_density_findings: {
        winner: (input.mdpr.overflowOrDensityFindingCount ?? 0) === 0 ? "mdpr" : "manual-review",
        evidence: [`mdpr.overflowOrDensityFindingCount=${input.mdpr.overflowOrDensityFindingCount ?? "unknown"}`],
      },
      native_table_chart_proof_support: {
        winner: input.mdpr.nativeTableChartProofSupport ? "mdpr" : "manual-review",
        evidence: [`mdpr.nativeTableChartProofSupport=${Boolean(input.mdpr.nativeTableChartProofSupport)}`],
      },
      manual_review_required: {
        winner: manualReviewRequired ? "manual-review" : "mdpr",
        evidence: input.references.map((reference) => `${reference.name}.manualReviewRequired=${reference.manualReviewRequired !== false}`),
      },
    },
  };
}

export function buildScientificChartIntentReport(input: ScientificChartIntentInput): ScientificChartIntentReport {
  const intents = input.sheets.flatMap((sheet) => scientificChartIntentsForSheet(sheet));
  const reviewNotes = intents.flatMap((intent) => intent.reviewNotes.map((text) => ({
    type: scientificChartReviewNoteType(intent.intent, text),
    sourceSheetLabel: intent.sourceSheetLabel,
    text,
  })));
  return {
    schemaVersion: "mdpr-scientific-chart-intent-v1",
    generatedBy: "mdpr-skill",
    sourceLabel: input.sourceLabel,
    boundary: {
      evidenceOnly: true,
      mdprRuntimeAuthority: true,
      noFinalGeometry: true,
      noRawWorkbookValues: true,
    },
    intents,
    reviewNotes,
  };
}

export function buildHighNeedChartRecipeCatalog(): HighNeedChartRecipeCatalog {
  const recipes = highNeedChartRecipes();
  return {
    schemaVersion: "mdpr-high-need-chart-recipe-catalog-v1",
    generatedBy: "mdpr-skill",
    sourceBoundary: {
      excelNativeChartReference: "https://support.microsoft.com/en-us/excel/available-chart-types-in-office",
      rule: "catalog-covers-non-basic-or-workaround-only-chart-needs",
    },
    boundary: {
      evidenceOnly: true,
      mdprRuntimeAuthority: true,
      noFinalGeometry: true,
      noRawWorkbookValues: true,
    },
    coverage: {
      totalRecipes: recipes.length,
      nonBasicExcelRecipes: recipes.filter((recipe) => recipe.excelDefaultSupport !== "native_but_semantically_incomplete").length,
      minimumExpectedRecipes: 12,
    },
    recipes,
  };
}

export function buildDeckDesignOrderTrace(input: DeckDesignOrderTraceInput): DeckDesignOrderTraceReport {
  const chartIntentRefs = chartIntentEvidenceRefs(input.chartIntentReport);
  const sourceEvidenceRefs = input.sourceEvidenceRefs ?? chartStructuralSourceEvidenceRefs(input.chartIntentReport);
  const sourceEvidenceBackfilled = !input.sourceEvidenceRefs?.length && sourceEvidenceRefs.length > 0;
  const entries: DeckDesignOrderTraceEntry[] = [
    deckDesignOrderEntry("narrative_spine", input.narrativeSpineRefs ?? [], []),
    deckDesignOrderEntry("source_evidence", sourceEvidenceRefs, ["narrative_spine"]),
    deckDesignOrderEntry("slide_role", input.slideRoleRefs ?? [], ["narrative_spine"]),
    deckDesignOrderEntry("chart_intent", chartIntentRefs, ["source_evidence", "slide_role"]),
    deckDesignOrderEntry("semantic_visual_guidance", input.visualGuidanceRefs ?? chartVisualGuidanceRefs(input.chartIntentReport), ["chart_intent"]),
    deckDesignOrderEntry("theme_binding_request", input.themeBindingRefs ?? chartThemeBindingRefs(input.chartIntentReport), ["semantic_visual_guidance"]),
    deckDesignOrderEntry("mdpr_validation_refs", input.mdprValidationRefs ?? [], ["theme_binding_request"]),
    deckDesignOrderEntry("review_notes", input.reviewNoteRefs ?? chartReviewNoteRefs(input.chartIntentReport), ["mdpr_validation_refs"]),
  ];
  const findings = [
    ...(sourceEvidenceBackfilled ? deckDesignOrderSourceEvidenceBackfilledFindings(sourceEvidenceRefs) : []),
    ...deckDesignOrderPrerequisiteFindings(entries),
    ...deckDesignOrderStageRefFindings(entries),
    ...validateReviewArtifactDesignOrder({ schemaVersion: "mdpr-deck-design-order-trace-v1", entries }),
  ];
  return {
    schemaVersion: "mdpr-deck-design-order-trace-v1",
    generatedBy: "mdpr-skill",
    boundary: {
      evidenceOnly: true,
      mdprRuntimeAuthority: true,
      noFinalGeometry: true,
      noRawWorkbookValues: true,
      noFinalValidationVerdict: true,
    },
    entries,
    findings,
  };
}

export function sourceEvidenceRefsFromLedger(ledger: SourceSlideEvidenceLedger): string[] {
  const refs = new Set<string>();
  for (const entry of ledger.entries) {
    refs.add(`source:${entry.sourcePath}`);
    refs.add(`slide:${safeRefSegment(entry.slideRef)}`);
    refs.add(`claim:${safeRefSegment(entry.slideRef)}`);
    for (const source of entry.sources) {
      if (source.sourceId) refs.add(`source:${source.sourceId}`);
      if (source.path) refs.add(`source:${source.path}`);
      if (source.url) refs.add(`source:${source.url}`);
    }
    for (const evidence of entry.mdprEvidenceRefs) {
      refs.add(`evidence:${evidence.evidenceId}`);
      if (evidence.path) refs.add(`source:${evidence.path}`);
      if (evidence.slideId) refs.add(`slide:${safeRefSegment(evidence.slideId)}`);
    }
  }
  return [...refs].filter(Boolean);
}

export function buildDeckDesignOrderTraceFromLedger(input: DeckDesignOrderTraceFromLedgerInput): DeckDesignOrderTraceReport {
  const ledgerRefs = sourceEvidenceRefsFromLedger(input.ledger);
  const sourceEvidenceRefs = input.sourceEvidenceRefs ?? ledgerRefs;
  const trace = buildDeckDesignOrderTrace({
    ...input,
    sourceEvidenceRefs,
  });
  const disconnected = ledgerRefs.length > 0 && !sourceEvidenceRefs.some((ref) => ledgerRefs.includes(ref));
  return {
    ...trace,
    findings: [
      ...trace.findings,
      ...(disconnected ? sourceEvidenceLedgerDisconnectedFindings(sourceEvidenceRefs, ledgerRefs) : []),
    ],
  };
}

export function validateReviewArtifactDesignOrder(artifact: unknown): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const record = asRecord(artifact);
  if (!record) return findings;

  if (hasFinalDecisionKey(record)) {
    findings.push({
      severity: "error",
      type: "REVIEW_ARTIFACT_BOUNDARY_FIELD_LEAK",
      slideId: "deck",
      evidence: {
        artifactSchema: stringValue(record.schemaVersion) ?? "unknown",
        rule: "review-artifacts-must-not-own-final-renderer-decisions",
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "review.boundary.finalDecisionFields",
        operation: "enableRule",
      },
    });
  }

  const directEvidenceRefs = asArray(record.evidenceRefs).map((ref) => String(ref)).filter(Boolean);
  const entries = asArray(record.entries).map((entry) => asRecord(entry) ?? {});
  if (!directEvidenceRefs.length && !entries.some((entry) => asArray(entry.evidenceRefs).length > 0) && !hasNestedReviewEvidence(record)) {
    findings.push({
      severity: "warning",
      type: "REVIEW_ARTIFACT_EVIDENCE_MISSING",
      slideId: "deck",
      evidence: {
        artifactSchema: stringValue(record.schemaVersion) ?? "unknown",
        requiredField: "evidenceRefs",
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "review.evidenceRefs.required",
        operation: "enableRule",
      },
    });
  }

  const designOrders = collectDesignOrders(record);
  for (const order of designOrders) {
    if (!isReviewDesignOrderSequence(order)) {
    findings.push({
      severity: "warning",
      type: "DESIGN_ORDER_OUT_OF_SEQUENCE",
      slideId: "deck",
      evidence: {
        artifactSchema: stringValue(record.schemaVersion) ?? "unknown",
        designOrder: order,
          expectedOrder: expectedDesignOrderFor(order),
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "review.designOrder.sequence",
        operation: "enableRule",
      },
    });
    }
  }

  return findings;
}

export function reviewFindingHasFinalDecisionField(finding: ReviewFinding): boolean {
  return hasFinalDecisionKey(finding);
}

export type ReviewCoreInput = {
  presentation?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  designLock?: Record<string, unknown>;
  selectionContext?: Record<string, unknown>;
  htmlDesignAnalysis?: Record<string, unknown>;
  componentPackCandidate?: Record<string, unknown>;
  diagramMetrics?: Record<string, unknown>;
};

export type ScreenshotEvidenceInput = {
  screenshotPath?: string;
  selectionPath?: string;
  blockIds?: string[];
};

export type NarrativeSpineInput = {
  markdown: string;
  manifest?: Record<string, unknown>;
  sourceNotes?: string;
  sourcePath?: string;
};

export type NarrativeSpineSuggestion = {
  type: "NARRATIVE_CLAIM_TITLE_WEAK" | "NARRATIVE_SECTION_FLOW_GAP";
  kind: "claim-title" | "section-flow";
  generatedBy: "mdpr-skill";
  evidence: {
    sourcePath: string;
    markdownHeading: string;
    manifestSlideCount?: number;
    sourceNotesExcerpt?: string;
  };
  suggestion: {
    action: "rewrite-title-as-claim" | "add-section-transition";
    text: string;
  };
};

export type TemplateLayoutIntentInput = {
  layoutCatalog?: Record<string, unknown>;
  templateSummary?: Record<string, unknown>;
  sourcePath?: string;
};

export type TemplateLayoutIntentHint = {
  type: "TEMPLATE_LAYOUT_INTENT";
  kind: "semantic-layout-intent";
  generatedBy: "mdpr-skill";
  intent: "comparison" | "chart-focus" | "evidence" | "section-divider";
  evidence: {
    sourcePath: string;
    layoutLabel: string;
    placeholderRoles: string[];
  };
  hint: {
    suitableFor: string[];
    rationale: string;
  };
};

export type SpeakerNotesInput = {
  markdown: string;
  sourceNotes?: string;
  sourcePath?: string;
};

export type SpeakerNoteSuggestion = {
  type: "SPEAKER_NOTE_DRAFT" | "REVIEW_COMMENT_DRAFT";
  kind: "speaker-note" | "review-comment";
  generatedBy: "mdpr-skill";
  evidence: {
    sourcePath: string;
    markdownHeading: string;
    sourceExcerpt?: string;
    sourceNotesExcerpt?: string;
  };
  suggestion: {
    text: string;
  };
};

export type CitationSource = {
  id?: string;
  title?: string;
  date?: string;
  path?: string;
  url?: string;
};

export type CitationProvenanceInput = {
  markdown: string;
  sources?: CitationSource[];
  asOfDate?: string;
  sourcePath?: string;
};

export type CitationProvenanceFinding = {
  type: "CITATION_MISSING" | "CLAIM_UNSUPPORTED" | "SOURCE_STALE";
  kind: "missing-citation" | "unsupported-claim" | "stale-source";
  generatedBy: "mdpr-skill";
  evidence: {
    sourcePath: string;
    markdownExcerpt?: string;
    sourceId?: string;
    sourceDate?: string;
    sourcePathOrUrl?: string;
  };
  suggestion: {
    text: string;
  };
};

export type RenderedPreviewImage = {
  slideId?: string;
  imagePath: string;
  contactSheetPath?: string;
  mdprFindingId?: string;
  mdprFindingType?: string;
};

export type RenderedPreviewCritiqueInput = {
  renderedImages: RenderedPreviewImage[];
};

export type RenderedPreviewCritiqueNote = {
  type: "RENDERED_PREVIEW_CONCERN_NOTE";
  kind: "visual-concern-note";
  generatedBy: "mdpr-skill";
  evidence: {
    slideId?: string;
    renderedImagePath: string;
    contactSheetPath?: string;
    mdprFindingId?: string;
    mdprFindingType?: string;
  };
  note: {
    text: string;
  };
  boundary: {
    mdprValidationAuthority: true;
    llmMayOverrideMdprGate: false;
  };
};

export type AccessibilityContentInput = {
  markdown: string;
  audience?: string;
  sourcePath?: string;
};

export type AccessibilityContentSuggestion = {
  type: "ALT_TEXT_DRAFT" | "PLAIN_LANGUAGE_CHECK" | "ACRONYM_EXPANSION" | "AUDIENCE_FIT_NOTE";
  kind: "alt-text-draft" | "plain-language" | "acronym-expansion" | "audience-fit";
  generatedBy: "mdpr-skill";
  evidence: {
    sourcePath: string;
    markdownExcerpt?: string;
    imagePath?: string;
    acronym?: string;
    audience?: string;
  };
  suggestion: {
    text: string;
  };
  boundary: {
    mdprVisualAccessibilityAuthority: true;
  };
};

export type MdprEvidenceRef = {
  evidenceId: string;
  slideId?: string;
  kind?: "text" | "table" | "chart" | "image" | "code" | "diagram" | string;
  path?: string;
};

export type SourceSlideEvidenceLedgerInput = {
  markdown: string;
  sources?: CitationSource[];
  mdprEvidence?: MdprEvidenceRef[];
  sourcePath?: string;
};

export type SourceSlideEvidenceLedger = {
  schemaVersion: "mdpr-source-slide-evidence-ledger-v1";
  generatedBy: "mdpr-skill";
  entries: SourceSlideEvidenceLedgerEntry[];
};

export type SourceSlideEvidenceLedgerEntry = {
  slideRef: string;
  sourcePath: string;
  claimExcerpt: string;
  sources: Array<{
    sourceId?: string;
    title?: string;
    date?: string;
    path?: string;
    url?: string;
  }>;
  mdprEvidenceRefs: MdprEvidenceRef[];
};

export type ReadmeTeaserMetric = {
  label: string;
  value: string;
};

export type ReadmeTeaserSpec = {
  title: string;
  subtitle?: string;
  chips?: string[];
  metrics?: ReadmeTeaserMetric[];
  pipeline?: string[];
  accent?: string;
  footer?: string;
};

type BlockLike = {
  id: string;
  type: string;
  text?: string;
  alt?: string;
};

type PresentationSlideLike = {
  id: string;
  title?: string;
  intent?: string;
  headingPath: string[];
  blocks: BlockLike[];
};

type LayoutRegionLike = {
  id: string;
  role?: string;
  blockIds: string[];
};

type LayoutSlideLike = {
  id: string;
  sourceSlideId: string;
  preset: string;
  regions: LayoutRegionLike[];
};

const EVIDENCE_BLOCK_TYPES = new Set(["chart", "table", "image", "code", "diagram"]);
const DECK_DESIGN_ORDER: DeckDesignOrderStage[] = [
  "narrative_spine",
  "source_evidence",
  "slide_role",
  "chart_intent",
  "semantic_visual_guidance",
  "theme_binding_request",
  "mdpr_validation_refs",
  "review_notes",
];
const FINAL_DECISION_FIELDS = new Set([
  "x",
  "y",
  "w",
  "h",
  "box",
  "color",
  "colors",
  "fontSize",
  "fontFamily",
  "typography",
  "zOrder",
  "z-order",
  "recipeId",
  "variantId",
  "radius",
  "shadow",
  "effect",
  "arrow",
  "component",
  "style",
  "iconPath",
  "iconName",
  "coordinates",
  "geometry",
  "rendererObjectId",
]);

export function reviewCoherence(input: ReviewCoreInput): ReviewFinding[] {
  const model = normalizeReviewModel(input);
  const baseFindings = [
    ...detachedCaptionFindings(model),
    ...orphanEvidenceFindings(model),
    ...claimlessEvidenceFindings(model),
  ];
  const noisySections = new Set(
    baseFindings
      .map((finding) => model.slideById.get(String(finding.evidence?.sourceSlideId ?? ""))?.headingPath[0])
      .filter((section): section is string => Boolean(section)),
  );
  return [
    ...baseFindings,
    ...reviewSelectionContext(input),
    ...evidenceClaimAlignmentFindings(model),
    ...semanticMotifDriftFindings(model),
    ...sectionRhythmFindings(model, noisySections),
  ];
}

export function reviewSelectionContext(input: ReviewCoreInput): ReviewFinding[] {
  const context = asRecord(input.selectionContext);
  if (!context) return [];
  const blockIds = asArray(context.overlappedBlocks).map((blockId) => String(blockId)).filter(Boolean);
  if (blockIds.length < 2) return [];
  return [{
    severity: "warning",
    type: "SELECTION_CONTEXT_GROUPING_RISK",
    slideId: stringValue(context.slideId) ?? "deck",
    evidence: {
      blockIds,
      regionIds: asArray(context.overlappedRegions).map((regionId) => String(regionId)).filter(Boolean),
      ...screenshotEvidence({
        screenshotPath: stringValue(context.screenshotPath),
        selectionPath: stringValue(context.selectionPath),
        blockIds,
      }),
      userInstruction: stringValue(context.userInstruction),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "coherence.keepTogether.selectionContext",
      operation: "increaseWeight",
      value: 0.1,
    },
  }];
}

export function reviewChartNarrativeFit(input: ChartNarrativeFitInput): ReviewFinding[] {
  const model = normalizeReviewModel(input);
  const findings: ReviewFinding[] = [];
  for (const placement of input.chartPlacements) {
    const sourceSlide = model.slideById.get(placement.sourceSlideId);
    if (!sourceSlide) continue;
    const layoutSlide = model.layoutSlides.find((slide) => slide.sourceSlideId === placement.sourceSlideId);
    const slideRole = layoutSlide ? semanticSlideRole(sourceSlide, layoutSlide) : (sourceSlide.intent ?? "unknown");
    const fit = placement.intent.visualApplication.narrativeFit;
    const layoutBlocks = layoutSlide ? blocksForLayoutSlide(layoutSlide, model.blockById) : sourceSlide.blocks;
    const hasClaimSupport = layoutBlocks.some(isClaimBlock) || Boolean(sourceSlide.title && sourceSlide.title.trim().length >= 12);
    const slideId = layoutSlide?.id ?? sourceSlide.id;
    const placedBlock = placement.chartBlockId ? sourceSlide.blocks.find((block) => block.id === placement.chartBlockId) : undefined;
    const layoutBlockIds = new Set(layoutBlocks.map((block) => block.id));

    if (placement.chartBlockId && (!placedBlock || (layoutSlide && !layoutBlockIds.has(placement.chartBlockId)))) {
      findings.push({
        severity: "warning",
        type: "CHART_PLACEMENT_BLOCK_MISSING",
        slideId,
        evidence: {
          sourceSlideId: sourceSlide.id,
          chartBlockId: placement.chartBlockId,
          chartIntent: placement.intent.intent,
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.chartNarrativeFit.placementBlock",
          operation: "enableRule",
        },
      });
    } else if (placedBlock && !isEvidenceBlock(placedBlock)) {
      findings.push({
        severity: "warning",
        type: "CHART_PLACEMENT_BLOCK_TYPE_MISMATCH",
        slideId,
        evidence: {
          sourceSlideId: sourceSlide.id,
          chartBlockId: placement.chartBlockId,
          chartIntent: placement.intent.intent,
          blockType: placedBlock.type,
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.chartNarrativeFit.placementBlockType",
          operation: "enableRule",
        },
      });
    } else if (placedBlock && !chartPlacementBlockMatchesIntent(placedBlock, placement.intent.intent)) {
      findings.push({
        severity: "warning",
        type: "CHART_PLACEMENT_INTENT_MISMATCH",
        slideId,
        evidence: {
          sourceSlideId: sourceSlide.id,
          chartBlockId: placement.chartBlockId,
          chartIntent: placement.intent.intent,
          blockType: placedBlock.type,
          semanticTerms: [...semanticTermsForBlocks([placedBlock])].slice(0, 8),
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.chartNarrativeFit.intentBinding",
          operation: "enableRule",
        },
      });
    }

    if (!fit.preferredSlideRoles.includes(slideRole)) {
      findings.push({
        severity: "warning",
        type: "CHART_NARRATIVE_FIT_GAP",
        slideId,
        evidence: {
          sourceSlideId: sourceSlide.id,
          chartBlockId: placement.chartBlockId,
          chartIntent: placement.intent.intent,
          actualSlideRole: slideRole,
          preferredSlideRoles: fit.preferredSlideRoles,
          evidenceBinding: fit.evidenceBinding,
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.chartNarrativeFit.slideRole",
          operation: "enableRule",
        },
      });
    }

    if (fit.requiresClaimSupport && !hasClaimSupport) {
      findings.push({
        severity: "warning",
        type: "CHART_CLAIM_SUPPORT_MISSING",
        slideId,
        evidence: {
          sourceSlideId: sourceSlide.id,
          chartBlockId: placement.chartBlockId,
          chartIntent: placement.intent.intent,
          requiredBinding: fit.evidenceBinding,
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.chartNarrativeFit.claimSupport",
          operation: "enableRule",
        },
      });
    }
  }
  return findings;
}

export function reviewNarrativeSpine(input: NarrativeSpineInput): NarrativeSpineSuggestion[] {
  const sections = parseMarkdownSections(input.markdown);
  const evidence = narrativeEvidenceBase(input);
  const suggestions: NarrativeSpineSuggestion[] = [];
  const weakClaimSection = sections.find((section) => headingNeedsClaim(section) && sectionHasEvidence(section));

  if (weakClaimSection) {
    suggestions.push({
      type: "NARRATIVE_CLAIM_TITLE_WEAK",
      kind: "claim-title",
      generatedBy: "mdpr-skill",
      evidence: {
        ...evidence,
        markdownHeading: weakClaimSection.heading,
      },
      suggestion: {
        action: "rewrite-title-as-claim",
        text: `Rewrite "${weakClaimSection.heading}" as a claim title that states the takeaway before the evidence.`,
      },
    });
  }

  if (sections.length >= 2 && !sections.some((section) => /why|so what|implication|transition/i.test(section.heading))) {
    suggestions.push({
      type: "NARRATIVE_SECTION_FLOW_GAP",
      kind: "section-flow",
      generatedBy: "mdpr-skill",
      evidence: {
        ...evidence,
        markdownHeading: sections.map((section) => section.heading).join(" -> "),
      },
      suggestion: {
        action: "add-section-transition",
        text: "Add a short transition or implication section so the deck explains why the evidence leads to the recommended action.",
      },
    });
  }

  return suggestions;
}

export function reviewTemplateLayoutIntent(input: TemplateLayoutIntentInput): TemplateLayoutIntentHint[] {
  const layouts = normalizeTemplateLayouts(input.layoutCatalog ?? input.templateSummary);
  return layouts.map((layout) => {
    const intent = inferTemplateIntent(layout.label, layout.roles);
    return {
      type: "TEMPLATE_LAYOUT_INTENT",
      kind: "semantic-layout-intent",
      generatedBy: "mdpr-skill",
      intent,
      evidence: {
        sourcePath: input.sourcePath ?? "template-layout-catalog",
        layoutLabel: layout.label,
        placeholderRoles: layout.roles,
      },
      hint: {
        suitableFor: suitableContentForIntent(intent),
        rationale: layoutIntentRationale(intent, layout.roles),
      },
    };
  });
}

export function reviewSpeakerNotes(input: SpeakerNotesInput): SpeakerNoteSuggestion[] {
  const sections = parseMarkdownSections(input.markdown);
  const sourcePath = input.sourcePath ?? "markdown";
  const noteSection = sections.find((section) => section.body.join("\n").trim().length > 0);
  const suggestions: SpeakerNoteSuggestion[] = [];
  if (noteSection) {
    const excerpt = firstMeaningfulLine(noteSection.body) ?? noteSection.heading;
    suggestions.push({
      type: "SPEAKER_NOTE_DRAFT",
      kind: "speaker-note",
      generatedBy: "mdpr-skill",
      evidence: {
        sourcePath,
        markdownHeading: noteSection.heading,
        sourceExcerpt: excerpt,
      },
      suggestion: {
        text: `Presenter note for "${noteSection.heading}": state the takeaway, cite the visible evidence, then close with the decision or implication.`,
      },
    });
  }
  if (input.sourceNotes?.trim()) {
    const target = sections[sections.length - 1]?.heading ?? "deck";
    suggestions.push({
      type: "REVIEW_COMMENT_DRAFT",
      kind: "review-comment",
      generatedBy: "mdpr-skill",
      evidence: {
        sourcePath,
        markdownHeading: target,
        sourceNotesExcerpt: input.sourceNotes.trim().slice(0, 160),
      },
      suggestion: {
        text: "Reviewer comment: tighten the talk track around the audience need, the main risk, and the decision requested.",
      },
    });
  }
  return suggestions;
}

export function reviewCitationProvenance(input: CitationProvenanceInput): CitationProvenanceFinding[] {
  const sourcePath = input.sourcePath ?? "markdown";
  const findings: CitationProvenanceFinding[] = [];
  const lines = input.markdown.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const claimLine = lines.find((line) => hasQuantitativeClaim(line) && !hasCitationMarker(line));
  if (claimLine) {
    findings.push({
      type: "CITATION_MISSING",
      kind: "missing-citation",
      generatedBy: "mdpr-skill",
      evidence: {
        sourcePath,
        markdownExcerpt: claimLine.slice(0, 180),
      },
      suggestion: {
        text: "Add a citation or source note for the quantitative claim before using it in a slide.",
      },
    });
  }

  const unsupported = lines.find((line) => hasStrongClaim(line) && !hasCitationMarker(line));
  if (unsupported) {
    findings.push({
      type: "CLAIM_UNSUPPORTED",
      kind: "unsupported-claim",
      generatedBy: "mdpr-skill",
      evidence: {
        sourcePath,
        markdownExcerpt: unsupported.slice(0, 180),
      },
      suggestion: {
        text: "Attach explicit source evidence or soften the unsupported claim.",
      },
    });
  }

  const asOf = input.asOfDate ? Date.parse(input.asOfDate) : undefined;
  if (asOf !== undefined && Number.isFinite(asOf)) {
    for (const source of input.sources ?? []) {
      const sourceTime = source.date ? Date.parse(source.date) : undefined;
      if (sourceTime === undefined || !Number.isFinite(sourceTime)) continue;
      const ageDays = Math.floor((asOf - sourceTime) / 86_400_000);
      if (ageDays < 365 * 3) continue;
      findings.push({
        type: "SOURCE_STALE",
        kind: "stale-source",
        generatedBy: "mdpr-skill",
        evidence: {
          sourcePath,
          sourceId: source.id ?? source.title ?? "source",
          sourceDate: source.date,
          sourcePathOrUrl: source.path ?? source.url,
        },
        suggestion: {
          text: "Refresh or qualify this source because it is older than three years.",
        },
      });
    }
  }

  return dedupeCitationFindings(findings);
}

export function reviewRenderedPreviewCritique(input: RenderedPreviewCritiqueInput): RenderedPreviewCritiqueNote[] {
  return input.renderedImages
    .filter((image) => image.imagePath.trim().length > 0)
    .map((image) => ({
      type: "RENDERED_PREVIEW_CONCERN_NOTE",
      kind: "visual-concern-note",
      generatedBy: "mdpr-skill",
      evidence: {
        ...(image.slideId ? { slideId: image.slideId } : {}),
        renderedImagePath: image.imagePath,
        ...(image.contactSheetPath ? { contactSheetPath: image.contactSheetPath } : {}),
        ...(image.mdprFindingId ? { mdprFindingId: image.mdprFindingId } : {}),
        ...(image.mdprFindingType ? { mdprFindingType: image.mdprFindingType } : {}),
      },
      note: {
        text: "Review the rendered preview for visual concerns and keep MDPR rule findings as the validation authority.",
      },
      boundary: {
        mdprValidationAuthority: true,
        llmMayOverrideMdprGate: false,
      },
    }));
}

export function reviewAccessibilityContent(input: AccessibilityContentInput): AccessibilityContentSuggestion[] {
  const sourcePath = input.sourcePath ?? "markdown";
  const suggestions: AccessibilityContentSuggestion[] = [];
  const imageWithoutAlt = [...input.markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]
    .find((match) => !match[1]?.trim() && match[2]?.trim());
  if (imageWithoutAlt) {
    const imagePath = imageWithoutAlt[2]!.trim();
    suggestions.push({
      type: "ALT_TEXT_DRAFT",
      kind: "alt-text-draft",
      generatedBy: "mdpr-skill",
      evidence: { sourcePath, imagePath, markdownExcerpt: imageWithoutAlt[0] },
      suggestion: {
        text: `Draft concise alt text for ${imagePath} that states the chart or image takeaway without describing layout.`,
      },
      boundary: { mdprVisualAccessibilityAuthority: true },
    });
  }

  const longLine = input.markdown.split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 150);
  if (longLine) {
    suggestions.push({
      type: "PLAIN_LANGUAGE_CHECK",
      kind: "plain-language",
      generatedBy: "mdpr-skill",
      evidence: { sourcePath, markdownExcerpt: longLine.slice(0, 180) },
      suggestion: {
        text: "Rewrite this sentence into shorter, audience-readable language before converting it into slide content.",
      },
      boundary: { mdprVisualAccessibilityAuthority: true },
    });
  }

  const acronym = firstUnexpandedAcronym(input.markdown);
  if (acronym) {
    suggestions.push({
      type: "ACRONYM_EXPANSION",
      kind: "acronym-expansion",
      generatedBy: "mdpr-skill",
      evidence: { sourcePath, acronym },
      suggestion: {
        text: `Expand ${acronym} on first use or add a short speaker note for audiences that may not know it.`,
      },
      boundary: { mdprVisualAccessibilityAuthority: true },
    });
  }

  const audienceLine = input.markdown.split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /\b(obviously|everyone|always|single best|clearly)\b/i.test(line));
  if (audienceLine) {
    suggestions.push({
      type: "AUDIENCE_FIT_NOTE",
      kind: "audience-fit",
      generatedBy: "mdpr-skill",
      evidence: {
        sourcePath,
        audience: input.audience,
        markdownExcerpt: audienceLine.slice(0, 180),
      },
      suggestion: {
        text: `Adjust the claim for ${input.audience ?? "the target audience"} by stating the assumption and decision relevance explicitly.`,
      },
      boundary: { mdprVisualAccessibilityAuthority: true },
    });
  }

  return suggestions;
}

export function buildSourceSlideEvidenceLedger(input: SourceSlideEvidenceLedgerInput): SourceSlideEvidenceLedger {
  const sourcePath = input.sourcePath ?? "markdown";
  const sections = parseMarkdownSections(input.markdown);
  const entries = sections
    .map((section) => {
      const claimExcerpt = firstClaimLine(section);
      if (!claimExcerpt) return undefined;
      return {
        slideRef: section.heading,
        sourcePath,
        claimExcerpt,
        sources: sourcesForClaim(claimExcerpt, input.sources ?? []),
        mdprEvidenceRefs: (input.mdprEvidence ?? []).filter((evidence) => evidence.slideId === section.heading),
      } satisfies SourceSlideEvidenceLedgerEntry;
    })
    .filter((entry): entry is SourceSlideEvidenceLedgerEntry => Boolean(entry));

  return {
    schemaVersion: "mdpr-source-slide-evidence-ledger-v1",
    generatedBy: "mdpr-skill",
    entries,
  };
}

export function renderReadmeTeaserSvg(input: ReadmeTeaserSpec): string {
  const title = cleanDisplayText(input.title);
  if (!title) throw new Error("README teaser spec requires a non-empty title");

  const subtitle = cleanDisplayText(input.subtitle ?? "");
  const chips = normalizeDisplayList(input.chips, 5);
  const metrics = normalizeTeaserMetrics(input.metrics, 4);
  const pipeline = normalizeDisplayList(input.pipeline, 8);
  const accent = normalizeAccent(input.accent);
  const footer = cleanDisplayText(input.footer ?? "Generated with mdpr-skill teaser pipeline");

  const pipelineNodes = pipeline.length ? renderPipelineNodes(pipeline, accent) : "";
  const metricCards = metrics.map((metric, index) => renderMetricCard(metric, index, accent)).join("\n");
  const chipBadges = chips.map((chip, index) => renderChip(chip, index, accent)).join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">`,
    `  <title id="title">${escapeXml(title)}</title>`,
    `  <desc id="desc">${escapeXml(subtitle || `${title} README teaser`)}</desc>`,
    `  <defs>`,
    `    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
    `      <stop offset="0" stop-color="#fbfcfe"/>`,
    `      <stop offset="1" stop-color="#eef3f7"/>`,
    `    </linearGradient>`,
    `    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">`,
    `      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.12"/>`,
    `    </filter>`,
    `  </defs>`,
    `  <style>`,
    `    .title{font:700 54px Arial,Helvetica,sans-serif;fill:#111827}`,
    `    .subtitle{font:400 25px Arial,Helvetica,sans-serif;fill:#334155}`,
    `    .chip{font:700 17px Arial,Helvetica,sans-serif;fill:${accent}}`,
    `    .metric-value{font:700 36px Arial,Helvetica,sans-serif;fill:#111827}`,
    `    .metric-label{font:600 15px Arial,Helvetica,sans-serif;fill:#64748b;text-transform:uppercase}`,
    `    .pipeline-label{font:700 16px Arial,Helvetica,sans-serif;fill:#1f2937}`,
    `    .footer{font:600 15px Arial,Helvetica,sans-serif;fill:#64748b}`,
    `  </style>`,
    `  <rect width="1200" height="630" rx="0" fill="url(#bg)"/>`,
    `  <rect x="52" y="52" width="1096" height="526" rx="22" fill="#ffffff" stroke="#d8e1ea" filter="url(#shadow)"/>`,
    `  <rect x="52" y="52" width="10" height="526" fill="${accent}"/>`,
    `  <g transform="translate(92 98)">`,
    ...renderWrappedText(title, 0, 0, 920, 58, "title", 2),
    ...renderWrappedText(subtitle, 0, title.length > 34 ? 132 : 74, 980, 32, "subtitle", 2),
    `  </g>`,
    `  <g class="teaser-chips">${chipBadges}</g>`,
    `  <g class="teaser-metrics">${metricCards}</g>`,
    `  <g class="teaser-pipeline" aria-label="Pipeline">${pipelineNodes}</g>`,
    `  <text x="92" y="548" class="footer">${escapeXml(footer)}</text>`,
    `</svg>`,
    "",
  ].join("\n");
}

function renderMetricCard(metric: ReadmeTeaserMetric, index: number, accent: string): string {
  const x = 92 + index * 264;
  const y = 308;
  return [
    `    <g class="metric-card" transform="translate(${x} ${y})">`,
    `      <rect width="238" height="96" rx="14" fill="#f8fafc" stroke="#d8e1ea"/>`,
    `      <rect width="5" height="96" rx="2.5" fill="${accent}"/>`,
    `      <text x="22" y="42" class="metric-value">${escapeXml(truncateText(metric.value, 14))}</text>`,
    `      <text x="22" y="70" class="metric-label">${escapeXml(truncateText(metric.label, 24))}</text>`,
    `    </g>`,
  ].join("\n");
}

function renderChip(chip: string, index: number, accent: string): string {
  const widths = [0, 150, 320, 490, 660];
  const x = 92 + (widths[index] ?? index * 170);
  const y = 248;
  return [
    `    <g class="chip-badge" transform="translate(${x} ${y})">`,
    `      <rect width="140" height="34" rx="17" fill="${accent}" opacity="0.1"/>`,
    `      <text x="18" y="23" class="chip">${escapeXml(truncateText(chip, 16))}</text>`,
    `    </g>`,
  ].join("\n");
}

function renderPipelineNodes(pipeline: string[], accent: string): string {
  const x = 92;
  const y = 446;
  const width = 1016;
  const nodeGap = 18;
  const nodeWidth = Math.floor((width - nodeGap * (pipeline.length - 1)) / pipeline.length);
  const nodeHeight = 62;
  const nodes: string[] = [];

  for (let index = 0; index < pipeline.length; index += 1) {
    const nodeX = x + index * (nodeWidth + nodeGap);
    if (index > 0) {
      const lineX1 = nodeX - nodeGap + 2;
      const lineX2 = nodeX - 4;
      const lineY = y + nodeHeight / 2;
      nodes.push(`    <path class="pipeline-connector" d="M ${lineX1} ${lineY} L ${lineX2} ${lineY}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`);
      nodes.push(`    <path class="pipeline-connector-arrow" d="M ${lineX2 - 7} ${lineY - 5} L ${lineX2} ${lineY} L ${lineX2 - 7} ${lineY + 5}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    const labelLines = splitLabel(pipeline[index]!, Math.max(7, Math.floor(nodeWidth / 9)));
    nodes.push(`    <g class="pipeline-node" transform="translate(${nodeX} ${y})">`);
    nodes.push(`      <rect width="${nodeWidth}" height="${nodeHeight}" rx="13" fill="#ffffff" stroke="${accent}" stroke-width="2"/>`);
    nodes.push(`      <circle cx="18" cy="18" r="5" fill="${accent}"/>`);
    for (let lineIndex = 0; lineIndex < labelLines.length; lineIndex += 1) {
      const textY = labelLines.length === 1 ? 39 : 31 + lineIndex * 18;
      nodes.push(`      <text x="${nodeWidth / 2}" y="${textY}" text-anchor="middle" class="pipeline-label">${escapeXml(labelLines[lineIndex]!)}</text>`);
    }
    nodes.push(`    </g>`);
  }

  return nodes.join("\n");
}

function renderWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, className: string, maxLines: number): string[] {
  if (!text) return [];
  const maxChars = Math.max(18, Math.floor(maxWidth / (className === "title" ? 29 : 13)));
  const lines = wrapWords(text, maxChars, maxLines);
  return lines.map((line, index) => `  <text x="${x}" y="${y + index * lineHeight}" class="${className}">${escapeXml(line)}</text>`);
}

function normalizeTeaserMetrics(metrics: ReadmeTeaserMetric[] | undefined, maxItems: number): ReadmeTeaserMetric[] {
  return (metrics ?? [])
    .map((metric) => ({
      label: cleanDisplayText(metric?.label ?? ""),
      value: cleanDisplayText(metric?.value ?? ""),
    }))
    .filter((metric) => metric.label && metric.value)
    .slice(0, maxItems);
}

function normalizeDisplayList(values: string[] | undefined, maxItems: number): string[] {
  return (values ?? [])
    .map((value) => cleanDisplayText(value))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeAccent(value: string | undefined): string {
  const accent = cleanDisplayText(value ?? "");
  return /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#2563eb";
}

function cleanDisplayText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function wrapWords(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if (!current || current.length + word.length + 1 > maxChars) {
      if (lines.length >= maxLines) {
        lines[lines.length - 1] = truncateText(`${lines[lines.length - 1]} ${word}`, maxChars);
      } else {
        lines.push(truncateText(word, maxChars));
      }
      continue;
    }
    lines[lines.length - 1] = `${current} ${word}`;
  }
  return lines.slice(0, maxLines);
}

function splitLabel(label: string, maxChars: number): string[] {
  const lines = wrapWords(label, maxChars, 2);
  return lines.length ? lines : [truncateText(label, maxChars)];
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  if (maxChars <= 1) return value.slice(0, maxChars);
  return `${value.slice(0, maxChars - 1)}...`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function detachedCaptionFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const slide of normalized.presentationSlides) {
    for (let index = 0; index < slide.blocks.length - 1; index++) {
      const current = slide.blocks[index]!;
      const next = slide.blocks[index + 1]!;
      if (!isEvidenceBlock(current) || !isCaptionBlock(next)) continue;
      const evidenceLayout = normalized.layoutSlideIdByBlockId.get(current.id);
      const captionLayout = normalized.layoutSlideIdByBlockId.get(next.id);
      if (!evidenceLayout || !captionLayout || evidenceLayout === captionLayout) continue;
      findings.push({
        severity: "warning",
        type: "DETACHED_CAPTION_RISK",
        slideId: evidenceLayout,
        evidence: {
          sourceSlideId: slide.id,
          evidenceBlockId: current.id,
          captionBlockId: next.id,
          evidenceLayoutSlideId: evidenceLayout,
          captionLayoutSlideId: captionLayout,
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.keepTogether.caption",
          operation: "increaseWeight",
          value: 0.15,
        },
      });
    }
  }
  return findings;
}

export function orphanEvidenceFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const slide of normalized.presentationSlides) {
    const evidenceBlocks = slide.blocks.filter(isEvidenceBlock);
    if (!evidenceBlocks.length) continue;
    const supportBlocks = slide.blocks.filter((block) => !isEvidenceBlock(block) && isSupportTextBlock(block));
    if (supportBlocks.length) continue;
    findings.push({
      severity: "warning",
      type: "ORPHAN_EVIDENCE_RISK",
      slideId: normalized.layoutSlideIdByBlockId.get(evidenceBlocks[0]!.id) ?? slide.id,
      evidence: {
        sourceSlideId: slide.id,
        evidenceBlockIds: evidenceBlocks.map((block) => block.id),
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "coherence.requireClaimForEvidence",
        operation: "enableRule",
      },
    });
  }
  return findings;
}

export function claimlessEvidenceFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const layoutSlide of normalized.layoutSlides) {
    const blocks = blocksForLayoutSlide(layoutSlide, normalized.blockById);
    const evidenceBlocks = blocks.filter(isEvidenceBlock);
    if (!evidenceBlocks.length) continue;
    const hasClaim = blocks.some(isClaimBlock);
    if (hasClaim) continue;
    const hasSupport = blocks.some((block) => !isEvidenceBlock(block) && isSupportTextBlock(block));
    if (!hasSupport) continue;
    findings.push({
      severity: "warning",
      type: "CLAIMLESS_EVIDENCE_SLIDE",
      slideId: layoutSlide.id,
      evidence: {
        sourceSlideId: layoutSlide.sourceSlideId,
        evidenceBlockIds: evidenceBlocks.map((block) => block.id),
        supportBlockIds: blocks.filter((block) => !isEvidenceBlock(block) && isSupportTextBlock(block)).map((block) => block.id),
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "layout.scoring.emphasisPenalty.claim",
        operation: "increaseWeight",
        value: 0.1,
      },
    });
  }
  return findings;
}

export function evidenceClaimAlignmentFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const layoutSlide of normalized.layoutSlides) {
    const blocks = blocksForLayoutSlide(layoutSlide, normalized.blockById);
    const evidenceBlocks = blocks.filter(isEvidenceBlock);
    const claimBlocks = blocks.filter(isClaimBlock);
    if (!evidenceBlocks.length || !claimBlocks.length) continue;
    const evidenceTerms = semanticTermsForBlocks(evidenceBlocks);
    const claimTerms = semanticTermsForBlocks(claimBlocks);
    const sharedTerms = [...evidenceTerms].filter((term) => claimTerms.has(term));
    if (sharedTerms.length) continue;
    findings.push({
      severity: "warning",
      type: "EVIDENCE_CLAIM_ALIGNMENT_GAP",
      slideId: layoutSlide.id,
      evidence: {
        sourceSlideId: layoutSlide.sourceSlideId,
        evidenceBlockIds: evidenceBlocks.map((block) => block.id),
        claimBlockIds: claimBlocks.map((block) => block.id),
        evidenceSemanticTerms: [...evidenceTerms].slice(0, 8),
        claimSemanticTerms: [...claimTerms].slice(0, 8),
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "coherence.evidenceClaimSemanticBinding",
        operation: "enableRule",
      },
    });
  }
  return findings;
}

export function semanticMotifDriftFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const motifs = new Map<string, Array<{ section: string; motif: string; slideId: string; role: string }>>();
  for (const layoutSlide of normalized.layoutSlides) {
    const sourceSlide = normalized.slideById.get(layoutSlide.sourceSlideId);
    const section = sourceSlide?.headingPath[0];
    if (!section || !sourceSlide) continue;
    const evidenceBlocks = blocksForLayoutSlide(layoutSlide, normalized.blockById).filter(isEvidenceBlock);
    for (const block of evidenceBlocks) {
      const motif = semanticMotifForBlock(block);
      const key = `${section}:${motif}`;
      const role = semanticSlideRole(sourceSlide, layoutSlide);
      motifs.set(key, [...(motifs.get(key) ?? []), { section, motif, slideId: layoutSlide.id, role }]);
    }
  }

  const findings: ReviewFinding[] = [];
  for (const group of motifs.values()) {
    const roles = [...new Set(group.map((item) => item.role))];
    if (group.length < 3 || roles.length < 3) continue;
    const first = group[0]!;
    findings.push({
      severity: "warning",
      type: "SEMANTIC_MOTIF_DRIFT",
      slideId: first.slideId,
      evidence: {
        section: first.section,
        motif: first.motif,
        layoutSlideIds: group.map((item) => item.slideId),
        semanticRoles: roles,
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "coherence.semanticMotifConsistency",
        operation: "enableRule",
      },
    });
  }
  return findings;
}

export function sectionRhythmFindings(model: ReviewModel | ReviewCoreInput, skippedSections = new Set<string>()): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const grouped = new Map<string, LayoutSlideLike[]>();
  for (const layoutSlide of normalized.layoutSlides) {
    const section = normalized.slideById.get(layoutSlide.sourceSlideId)?.headingPath[0];
    if (!section || skippedSections.has(section)) continue;
    grouped.set(section, [...(grouped.get(section) ?? []), layoutSlide]);
  }

  const findings: ReviewFinding[] = [];
  for (const [section, slides] of grouped.entries()) {
    const presets = [...new Set(slides.map((slide) => slide.preset).filter(Boolean))];
    if (slides.length < 3 || presets.length < 3) continue;
    findings.push({
      severity: "warning",
      type: "SECTION_RHYTHM_DRIFT",
      slideId: slides[0]!.id,
      evidence: {
        section,
        layoutSlideIds: slides.map((slide) => slide.id),
        presetFamilies: presets,
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "layout.scoring.sectionContinuity",
        operation: "increaseWeight",
        value: 0.1,
      },
    });
  }
  return findings;
}

export function reviewVisualPolicy(input: ReviewCoreInput): ReviewFinding[] {
  return [
    ...rawHexFindings(input),
    ...mixedRadiusFindings(input),
    ...mixedShadowFindings(input),
    ...effectBudgetFindings(input),
    ...accentOveruseFindings(input),
    ...nonEditableObjectFindings(input),
  ];
}

export function reviewDesignPolicy(input: ReviewCoreInput): ReviewFinding[] {
  return [
    ...pptEffectUnsupportedFindings(input),
    ...rasterPrimaryContentRiskFindings(input),
    ...componentStyleDriftFindings(input),
    ...diagramComplexityBudgetFindings(input),
    ...diagramAccentBudgetFindings(input),
  ];
}

export function pptEffectUnsupportedFindings(input: ReviewCoreInput): ReviewFinding[] {
  return htmlEffectMappings(input)
    .filter((mapping) => stringValue(mapping.feasibility) === "unsupported")
    .map((mapping) => ({
      severity: "warning" as const,
      type: "PPT_EFFECT_UNSUPPORTED",
      slideId: "deck",
      evidence: {
        cssDeclaration: stringValue(mapping.cssPath) ?? "unknown",
        feasibility: stringValue(mapping.feasibility) ?? "unsupported",
        riskLevel: stringValue(mapping.editabilityRisk) ?? "medium",
      },
      suggestion: {
        kind: "mdpr-policy" as const,
        target: "design.pptEffectFeasibility",
        operation: "enableRule" as const,
      },
    }));
}

export function rasterPrimaryContentRiskFindings(input: ReviewCoreInput): ReviewFinding[] {
  return htmlEffectMappings(input)
    .filter((mapping) => stringValue(mapping.feasibility) === "raster-risk" || stringValue(mapping.editabilityRisk) === "high")
    .filter((mapping) => stringValue(mapping.feasibility) !== "unsupported")
    .map((mapping) => ({
      severity: "warning" as const,
      type: "RASTER_PRIMARY_CONTENT_RISK",
      slideId: "deck",
      evidence: {
        cssDeclaration: stringValue(mapping.cssPath) ?? "unknown",
        feasibility: stringValue(mapping.feasibility) ?? "raster-risk",
        riskLevel: stringValue(mapping.editabilityRisk) ?? "high",
      },
      suggestion: {
        kind: "mdpr-policy" as const,
        target: "renderer.editablePrimaryContent",
        operation: "enableRule" as const,
      },
    }));
}

export function componentStyleDriftFindings(input: ReviewCoreInput): ReviewFinding[] {
  const pack = asRecord(input.componentPackCandidate);
  const radiusCount = new Set(stringArrayAt(pack, "radiusScale")).size;
  const depthCount = new Set(stringArrayAt(pack, "depthScale")).size;
  if (radiusCount < 4 && depthCount < 4) return [];
  return [{
    severity: "warning",
    type: "COMPONENT_STYLE_DRIFT",
    slideId: "deck",
    evidence: {
      distinctCornerCount: radiusCount,
      distinctDepthCount: depthCount,
      maxRecommendedDistinctCount: 3,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "design.packConsistency",
      operation: "enableRule",
    },
  }];
}

export function diagramComplexityBudgetFindings(input: ReviewCoreInput): ReviewFinding[] {
  const metrics = asRecord(input.diagramMetrics);
  const nodes = numberValue(metrics?.nodes) ?? 0;
  const edges = numberValue(metrics?.edges) ?? 0;
  if (nodes <= 9 && edges <= 12) return [];
  return [{
    severity: "warning",
    type: "DIAGRAM_COMPLEXITY_BUDGET_EXCEEDED",
    slideId: "deck",
    evidence: {
      diagramId: stringValue(metrics?.diagramId) ?? "unknown",
      nodeCount: nodes,
      edgeCount: edges,
      maxNodeCount: 9,
      maxEdgeCount: 12,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "diagram.split.overviewDetail",
      operation: "enableRule",
    },
  }];
}

export function diagramAccentBudgetFindings(input: ReviewCoreInput): ReviewFinding[] {
  const metrics = asRecord(input.diagramMetrics);
  const accentCount = numberValue(metrics?.accentCount) ?? 0;
  if (accentCount <= 2) return [];
  return [{
    severity: "warning",
    type: "DIAGRAM_ACCENT_BUDGET_EXCEEDED",
    slideId: "deck",
    evidence: {
      diagramId: stringValue(metrics?.diagramId) ?? "unknown",
      accentCount,
      maxAccentCount: 2,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "diagram.visualHierarchy.accentBudget",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function rawHexFindings(input: ReviewCoreInput): ReviewFinding[] {
  const rawHexPaths = collectRawHexPaths(input.designLock ?? {});
  if (!rawHexPaths.length) return [];
  return [{
    severity: "warning",
    type: "RAW_HEX_STYLE_VALUE",
    slideId: "deck",
    evidence: {
      pathCount: rawHexPaths.length,
      sampleLocations: rawHexPaths.slice(0, 4),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "theme.tokens",
      operation: "document",
    },
  }];
}

export function mixedRadiusFindings(input: ReviewCoreInput): ReviewFinding[] {
  const values = stringArrayAt(input.designLock, "cornerScale");
  if (new Set(values).size < 4) return [];
  return [{
    severity: "warning",
    type: "MIXED_RADIUS_SCALE",
    slideId: "deck",
    evidence: {
      scaleKind: "corner",
      distinctCount: new Set(values).size,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "theme.tokenScale.corner",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function mixedShadowFindings(input: ReviewCoreInput): ReviewFinding[] {
  const values = stringArrayAt(input.designLock, "depthScale");
  if (new Set(values).size < 3) return [];
  return [{
    severity: "warning",
    type: "MIXED_SHADOW_SCALE",
    slideId: "deck",
    evidence: {
      scaleKind: "depth",
      distinctCount: new Set(values).size,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "theme.tokenScale.depth",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function effectBudgetFindings(input: ReviewCoreInput): ReviewFinding[] {
  const treatments = stringArrayAt(input.designLock, "visualTreatments");
  if (new Set(treatments).size <= 4) return [];
  return [{
    severity: "warning",
    type: "EFFECT_BUDGET_EXCEEDED",
    slideId: "deck",
    evidence: {
      visualTreatmentCount: new Set(treatments).size,
      budget: 4,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "visual.budget.depth",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function accentOveruseFindings(input: ReviewCoreInput): ReviewFinding[] {
  const usage = asRecord(input.manifest?.accentUsage);
  const accentedObjects = numberValue(usage?.accentedObjects) ?? 0;
  const totalObjects = numberValue(usage?.totalObjects) ?? 0;
  if (accentedObjects < 9 || totalObjects <= 0 || accentedObjects / totalObjects <= 0.6) return [];
  return [{
    severity: "warning",
    type: "ACCENT_OVERUSE_RISK",
    slideId: "deck",
    evidence: {
      accentedObjects,
      totalObjects,
      ratio: Number((accentedObjects / totalObjects).toFixed(2)),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "visual.hierarchy.accentBudget",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function nonEditableObjectFindings(input: ReviewCoreInput): ReviewFinding[] {
  const objects = asArray(input.manifest?.pptxObjects).map((value) => asRecord(value) ?? {});
  const nonEditable = objects.filter((object) => {
    const kind = String(object.objectKind ?? "").toLowerCase();
    const role = String(object.role ?? "").toLowerCase();
    return /raster|bitmap|image/.test(kind) && ["title", "body", "table", "chart", "code"].includes(role);
  });
  return nonEditable.map((object) => ({
    severity: "error",
    type: "NON_EDITABLE_PRIMARY_OBJECT",
    slideId: stringValue(object.slideId) ?? "deck",
    evidence: {
      objectKind: stringValue(object.objectKind) ?? "unknown",
      role: stringValue(object.role) ?? "unknown",
      blockIds: asArray(object.blockIds).map((blockId) => String(blockId)),
    },
    suggestion: {
      kind: "mdpr-policy" as const,
      target: "renderer.nativeEditableObjects",
      operation: "enableRule" as const,
    },
  }));
}

export function screenshotEvidence(input: ScreenshotEvidenceInput): Record<string, unknown> {
  return {
    ...(input.screenshotPath ? { screenshotPath: input.screenshotPath } : {}),
    ...(input.selectionPath ? { selectionPath: input.selectionPath } : {}),
    ...(input.blockIds ? { blockIds: input.blockIds } : {}),
  };
}

type ReviewModel = {
  presentationSlides: PresentationSlideLike[];
  layoutSlides: LayoutSlideLike[];
  slideById: Map<string, PresentationSlideLike>;
  blockById: Map<string, BlockLike>;
  layoutSlideIdByBlockId: Map<string, string>;
};

function normalizeReviewModel(input: ReviewCoreInput): ReviewModel {
  const presentationSlides = normalizePresentationSlides(input.presentation);
  const layoutSlides = normalizeLayoutSlides(input.layout);
  const slideById = new Map(presentationSlides.map((slide) => [slide.id, slide]));
  const blockById = new Map<string, BlockLike>();
  for (const slide of presentationSlides) {
    for (const block of slide.blocks) blockById.set(block.id, block);
  }
  const layoutSlideIdByBlockId = new Map<string, string>();
  for (const layoutSlide of layoutSlides) {
    for (const region of layoutSlide.regions) {
      for (const blockId of region.blockIds) {
        layoutSlideIdByBlockId.set(blockId, layoutSlide.id);
      }
    }
  }
  return { presentationSlides, layoutSlides, slideById, blockById, layoutSlideIdByBlockId };
}

function normalizePresentationSlides(value: unknown): PresentationSlideLike[] {
  const slides = asArray(asRecord(value)?.slides);
  return slides.map((slideValue, index) => {
    const slide = asRecord(slideValue) ?? {};
    const id = stringValue(slide.id) ?? `slide-${index + 1}`;
    return {
      id,
      title: stringValue(slide.title),
      intent: stringValue(slide.intent),
      headingPath: asArray(slide.headingPath).map((item) => String(item)),
      blocks: asArray(slide.blocks).map((blockValue, blockIndex) => normalizeBlock(blockValue, `${id}:block-${blockIndex + 1}`)),
    };
  });
}

function normalizeBlock(value: unknown, fallbackId: string): BlockLike {
  const block = asRecord(value) ?? {};
  return {
    id: stringValue(block.id) ?? fallbackId,
    type: stringValue(block.type) ?? "unknown",
    text: stringValue(block.text),
    alt: stringValue(block.alt),
  };
}

function normalizeLayoutSlides(value: unknown): LayoutSlideLike[] {
  const slides = asArray(asRecord(value)?.slides);
  return slides.map((slideValue, index) => {
    const slide = asRecord(slideValue) ?? {};
    const id = stringValue(slide.id) ?? `layout-slide-${index + 1}`;
    const layout = asRecord(slide.layout) ?? {};
    return {
      id,
      sourceSlideId: stringValue(slide.sourceSlideId) ?? id,
      preset: stringValue(layout.preset) ?? "unknown",
      regions: asArray(slide.regions).map((regionValue, regionIndex) => {
        const region = asRecord(regionValue) ?? {};
        return {
          id: stringValue(region.id) ?? `${id}:region-${regionIndex + 1}`,
          role: stringValue(region.role),
          blockIds: asArray(region.blockIds).map((blockId) => String(blockId)),
        };
      }),
    };
  });
}

type MarkdownSection = {
  level: number;
  heading: string;
  body: string[];
};

function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^(#{2,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      sections.push({ level: heading[1]!.length, heading: heading[2]!.trim(), body: [] });
      continue;
    }
    if (sections.length) sections[sections.length - 1]!.body.push(line);
  }
  return sections;
}

function headingNeedsClaim(section: MarkdownSection): boolean {
  const words = section.heading.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return true;
  return !/\b(is|are|was|were|drives|drops|rises|falls|needs|shows|proves|requires|wins|loses)\b/i.test(section.heading);
}

function sectionHasEvidence(section: MarkdownSection): boolean {
  const body = section.body.join("\n");
  return /^\s*\|.+\|\s*$/m.test(body) || /\b(chart|table|figure|source|metric|rate|revenue|cost|conversion|activation|retention)\b|%/.test(body);
}

function firstMeaningfulLine(lines: string[]): string | undefined {
  return lines.map((line) => line.trim()).find((line) => line.length > 0 && !/^[-*]\s*$/.test(line))?.slice(0, 160);
}

function firstClaimLine(section: MarkdownSection): string | undefined {
  return section.body
    .map((line) => line.trim())
    .find((line) => !line.startsWith("!") && (hasQuantitativeClaim(line) || hasStrongClaim(line)))
    ?.slice(0, 220);
}

function visualGuidanceCategory(finding: ReviewFinding): VisualGuidanceCategory {
  const type = finding.type.toUpperCase();
  if (/NON_EDITABLE|RASTER/.test(type)) return "editability_risk";
  if (/RAW_HEX|THEME|TOKEN|RADIUS|SHADOW/.test(type)) return "theme_fit";
  if (/EFFECT|ACCENT|STYLE_DRIFT/.test(type)) return "decoration_noise";
  if (/CONTRAST|CLIP|FONT|LEGIBILITY/.test(type)) return "contrast_or_legibility";
  if (/DIAGRAM|OBJECT|ICON|IMAGE/.test(type)) return "object_semantics";
  if (/DENSITY|OVERFLOW|BUDGET|COMPLEXITY/.test(type)) return "layout_density";
  if (/CAPTION|CLAIM|SECTION|GROUPING|ORPHAN/.test(type)) return "hierarchy";
  return "readability";
}

function scientificChartIntentsForSheet(sheet: ScientificChartSheetEvidence): ScientificChartIntentEntry[] {
  const normalizedLabel = sheet.sheetLabel.toLowerCase();
  const intents: ScientificChartIntentEntry[] = [];
  if (normalizedLabel.includes("cdf")) {
    intents.push(scientificChartIntentEntry(sheet, "cdf_curve", [
      "x_metric",
      "y_cumulative_probability",
      "monotone_non_decreasing_probability",
    ], [
      "CDF guidance requires cumulative probability semantics before line or step styling.",
    ]));
  }
  if (/\bbw\b|box|whisker|distribution/.test(normalizedLabel)) {
    intents.push(scientificChartIntentEntry(sheet, "distribution_box_whisker", [
      "median_field",
      "quartile_fields",
      "whisker_fields",
      "outlier_policy_if_known",
    ], [
      "Distribution guidance requires median, quartile, and whisker semantics before a visual family is selected.",
    ]));
    intents.push(scientificChartIntentEntry(sheet, "distribution_quantile_band", [
      "median_field",
      "quantile_fields",
      "band_range",
      "dense_group_fallback",
    ], [
      "Quantile-band guidance is a semantic fallback when MDPR cannot render or should not use a native box-whisker object.",
    ]));
  }
  if (sheet.errorBarCount && sheet.errorBarCount > 0) {
    intents.push(scientificChartIntentEntry(sheet, "mean_with_error_bars", [
      "center_value",
      "error_bar_kind",
      "error_axis",
      "confidence_level_if_known",
    ], [
      sheet.errorBarKind && sheet.errorBarKind !== "unknown"
        ? `Error-bar semantics declared as ${sheet.errorBarKind}.`
        : "Error-bar kind is unknown; annotate or suppress until uncertainty semantics are defined.",
    ]));
  }
  if (normalizedLabel.includes("heatmap")) {
    intents.push(scientificChartIntentEntry(sheet, "heatmap_summary", [
      "matrix_x_dimension",
      "matrix_y_dimension",
      "cell_value_metric",
      "aggregation_policy",
    ], [
      "Heatmap guidance should summarize matrix evidence before any theme or palette request.",
    ]));
  }
  if (sheet.maxColumns >= 100 || (sheet.formulaCellCount > 0 && sheet.numericCellCount >= 1000)) {
    intents.push(scientificChartIntentEntry(sheet, "matrix_series", [
      "series_dimension",
      "measurement_axis",
      "formula_dependency_summary",
      "density_reduction_policy",
    ], [
      "Dense matrix series need summarization or small-multiple grouping before foreground chart selection.",
    ]));
  }
  return dedupeScientificChartIntents(intents);
}

function highNeedChartRecipes(): HighNeedChartRecipe[] {
  const order: ScientificChartDesignOrderStep[] = [
    "data_evidence",
    "scientific_chart_intent",
    "semantic_visual_guidance",
    "renderer_capability_request",
    "review_notes",
  ];
  const recipe = (
    kind: HighNeedChartRecipeKind,
    displayName: string,
    whyNeeded: string,
    dataShapeRequirements: string[],
    semanticRoles: string[],
    supportNeeded: string,
    fallbackStrategy: string,
    excelDefaultSupport: HighNeedChartRecipe["excelDefaultSupport"] = "not_direct_native",
  ): HighNeedChartRecipe => ({
    kind,
    displayName,
    excelDefaultSupport,
    whyNeeded,
    dataShapeRequirements,
    semanticRoles,
    designOrder: order,
    visualApplication: chartVisualApplicationForKind(kind),
    mdprCapabilityRequest: {
      target: "mdpr.chart-capability",
      supportNeeded,
    },
    fallbackStrategy,
  });
  return [
    recipe(
      "cdf_curve",
      "CDF / ECDF curve",
      "Cumulative probability is common in latency, reliability, accuracy, and threshold studies but is usually built as a line or scatter workaround.",
      ["ordered x metric", "cumulative probability or rank proportion", "optional group series"],
      ["x_metric", "y_cumulative_probability", "monotone_expectation", "percentile_callouts"],
      "cdf or ecdf curve primitive with monotone/probability-axis validation",
      "Use a step or line curve request and add percentile callout candidates; avoid smoothing unless source semantics allow it.",
    ),
    recipe(
      "quantile_band",
      "Quantile band",
      "Distribution uncertainty is often clearer as median plus bands than as many overlapping lines.",
      ["x metric or group", "median", "lower quantile", "upper quantile", "optional outer band"],
      ["median_field", "inner_band", "outer_band", "uncertainty_region"],
      "quantile band primitive with median marker and band ordering validation",
      "Request an editable band-plus-line object; fall back to grouped distribution strip when bands are too dense.",
    ),
    recipe(
      "violin_plot",
      "Violin plot",
      "Distribution shape and multimodality are important in experiments but are not a direct basic Excel chart.",
      ["group label", "sample values or density estimate", "optional median and quartiles"],
      ["distribution_density", "group_comparison", "median_marker", "quartile_markers"],
      "violin or mirrored-density primitive with optional box overlay",
      "If density cannot be rendered, request box-whisker or quantile-band fallback with a density-unavailable note.",
    ),
    recipe(
      "beeswarm_plot",
      "Beeswarm / strip plot",
      "Small samples and outliers need individual points without hiding distribution behind bars.",
      ["group label", "individual observations", "optional jitter grouping key"],
      ["individual_point", "group_axis", "outlier_visibility", "sample_size_visibility"],
      "beeswarm or jittered strip primitive with collision management",
      "Fall back to strip plot with deterministic jitter and sample-count labels when true collision packing is unavailable.",
    ),
    recipe(
      "ridgeline_density",
      "Ridgeline density",
      "Many related distributions need compact comparison across groups without a grid of separate charts.",
      ["ordered groups", "density curve per group", "shared x metric"],
      ["group_stack", "density_curve", "shared_axis", "overlap_policy"],
      "ridgeline density primitive with shared-axis and overlap validation",
      "Fall back to small multiples or quantile-band rows when filled densities would be too crowded.",
    ),
    recipe(
      "slopegraph",
      "Slopegraph",
      "Before/after or two-period comparisons are often more readable as connected endpoints than as clustered bars.",
      ["entity label", "start value", "end value", "optional group"],
      ["start_point", "end_point", "change_direction", "direct_label"],
      "slopegraph primitive with endpoint label deconfliction",
      "Fall back to paired dot plot if label density exceeds the slide budget.",
      "workaround_only",
    ),
    recipe(
      "dumbbell_plot",
      "Dumbbell plot",
      "Two-condition comparisons need gap emphasis and direct labels, not generic clustered bars.",
      ["entity label", "left condition value", "right condition value", "optional delta"],
      ["condition_a", "condition_b", "delta_gap", "ordered_entity_axis"],
      "dumbbell primitive with delta ordering and direct-label support",
      "Fall back to paired lollipop marks with delta labels when connector overlap is too high.",
      "workaround_only",
    ),
    recipe(
      "bullet_chart",
      "Bullet chart",
      "KPI actual/target/range displays are compact alternatives to gauges and speedometers.",
      ["metric label", "actual value", "target value", "qualitative range thresholds"],
      ["actual_marker", "target_marker", "range_band", "performance_state"],
      "bullet chart primitive with threshold bands and target marker",
      "Fall back to horizontal progress bar plus target marker if compact bullet rendering is unavailable.",
      "workaround_only",
    ),
    recipe(
      "sankey_alluvial",
      "Sankey / alluvial flow",
      "Flow magnitude between stages or categories is difficult to communicate with stock Excel charts.",
      ["source node", "target node", "flow value", "optional stage order"],
      ["source_node", "target_node", "flow_width", "stage_order"],
      "sankey or alluvial primitive with flow conservation checks",
      "Fall back to staged connected bars or flow table when path routing is unsupported.",
    ),
    recipe(
      "marimekko_mosaic",
      "Marimekko / mosaic plot",
      "Two-dimensional composition needs area encoding across both category share and segment share.",
      ["primary category", "secondary category", "value share"],
      ["category_width", "segment_height", "part_to_whole", "composition_comparison"],
      "mosaic or marimekko primitive with normalized area validation",
      "Fall back to small-multiple stacked bars if area encoding would impair readability.",
    ),
    recipe(
      "ternary_plot",
      "Ternary plot",
      "Three-part compositions that sum to one need triangular coordinates rather than x/y scatter axes.",
      ["component a", "component b", "component c", "optional point label"],
      ["three_part_composition", "sum_to_one_check", "triangle_axis", "point_label"],
      "ternary plot primitive with composition-sum validation",
      "Fall back to normalized stacked bars plus flagged ternary-unavailable note.",
    ),
    recipe(
      "forest_plot",
      "Forest plot",
      "Effect estimates with confidence intervals are common in scientific summaries and need aligned intervals plus a null reference.",
      ["study or subgroup label", "effect estimate", "lower interval", "upper interval", "null reference"],
      ["effect_estimate", "confidence_interval", "null_line", "study_label"],
      "forest plot primitive with interval and null-reference semantics",
      "Fall back to interval dot plot when grouped study rows are too dense.",
      "workaround_only",
    ),
    recipe(
      "bland_altman_plot",
      "Bland-Altman plot",
      "Agreement analysis needs mean-vs-difference scatter with bias and limits of agreement, not a generic scatter alone.",
      ["paired measurements", "mean value", "difference value", "bias", "agreement limits"],
      ["mean_axis", "difference_axis", "bias_line", "agreement_limit_lines"],
      "Bland-Altman primitive with bias and limit reference lines",
      "Fall back to scatter plus explicit reference-line request and agreement semantics warning.",
      "workaround_only",
    ),
    recipe(
      "control_chart",
      "Control chart",
      "Process monitoring requires centerline and control limits with rule-based anomaly notes.",
      ["ordered observation", "metric value", "centerline", "upper limit", "lower limit"],
      ["time_order", "centerline", "control_limits", "rule_violation"],
      "control chart primitive with limit lines and anomaly-rule evidence",
      "Fall back to line chart plus semantic limit-line request if process-control rules are unavailable.",
      "workaround_only",
    ),
  ];
}

function scientificChartIntentEntry(
  sheet: ScientificChartSheetEvidence,
  intent: ScientificChartIntentKind,
  semanticRoles: string[],
  reviewNotes: string[],
): ScientificChartIntentEntry {
  return {
    intent,
    sourceSheetLabel: sheet.sheetLabel,
    evidenceRefs: scientificChartEvidenceRefs(sheet),
    semanticRoles,
    designOrder: [
      "data_evidence",
      "scientific_chart_intent",
      "semantic_visual_guidance",
      "renderer_capability_request",
      "review_notes",
    ],
    visualApplication: chartVisualApplicationForIntent(intent),
    rendererRequest: {
      target: "mdpr.chart-capability",
      supportNeeded: scientificChartSupportNeeded(intent),
    },
    reviewNotes,
  };
}

function scientificChartEvidenceRefs(sheet: ScientificChartSheetEvidence): string[] {
  const refs = [
    `sheet:${sheet.sheetLabel}`,
    `rows:${sheet.nonemptyRows}`,
    `columns:${sheet.maxColumns}`,
    `numericCells:${sheet.numericCellCount}`,
    `formulaCells:${sheet.formulaCellCount}`,
  ];
  if (sheet.chartFamilies?.length) refs.push(`chartFamilies:${sheet.chartFamilies.join("+")}`);
  if (sheet.errorBarCount && sheet.errorBarCount > 0) refs.push(`errorBars:${sheet.errorBarCount}`);
  if (sheet.errorBarKind) refs.push(`errorBarKind:${sheet.errorBarKind}`);
  return refs;
}

function deckDesignOrderEntry(
  stage: DeckDesignOrderStage,
  evidenceRefs: string[],
  dependsOn: DeckDesignOrderStage[],
): DeckDesignOrderTraceEntry {
  const refs = [...new Set(evidenceRefs.map((ref) => String(ref)).filter(Boolean))];
  return {
    stage,
    evidenceRefs: refs,
    dependsOn,
    status: refs.length ? "present" : "missing",
  };
}

function deckDesignOrderPrerequisiteFindings(entries: DeckDesignOrderTraceEntry[]): ReviewFinding[] {
  const byStage = new Map(entries.map((entry) => [entry.stage, entry]));
  const findings: ReviewFinding[] = [];
  for (const entry of entries) {
    if (entry.status !== "present") continue;
    const missing = entry.dependsOn.filter((stage) => byStage.get(stage)?.status !== "present");
    if (!missing.length) continue;
    findings.push({
      severity: "warning",
      type: "DESIGN_ORDER_PREREQUISITE_MISSING",
      slideId: "deck",
      evidence: {
        stage: entry.stage,
        missingPrerequisites: missing,
        evidenceRefs: entry.evidenceRefs,
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "review.designOrder.prerequisites",
        operation: "enableRule",
      },
    });
  }
  return findings;
}

function deckDesignOrderSourceEvidenceBackfilledFindings(evidenceRefs: string[]): ReviewFinding[] {
  return [{
    severity: "warning",
    type: "DESIGN_ORDER_SOURCE_EVIDENCE_BACKFILLED",
    slideId: "deck",
    evidence: {
      stage: "source_evidence",
      evidenceRefs,
      rule: "source evidence was derived from structural chart evidence, not independent deck evidence refs",
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "review.designOrder.independentSourceEvidence",
      operation: "enableRule",
    },
  }];
}

function deckDesignOrderStageRefFindings(entries: DeckDesignOrderTraceEntry[]): ReviewFinding[] {
  return entries.flatMap((entry) => {
    const mismatchedRefs = entry.evidenceRefs.filter((ref) => !deckDesignOrderRefMatchesStage(entry.stage, ref));
    if (!mismatchedRefs.length) return [];
    return [{
      severity: "warning" as const,
      type: "DESIGN_ORDER_REF_STAGE_MISMATCH",
      slideId: "deck",
      evidence: {
        stage: entry.stage,
        mismatchedRefs,
        allowedRefPrefixes: DECK_DESIGN_STAGE_REF_PREFIXES[entry.stage],
      },
      suggestion: {
        kind: "mdpr-policy" as const,
        target: "review.designOrder.stageEvidenceNamespaces",
        operation: "enableRule" as const,
      },
    }];
  });
}

const DECK_DESIGN_STAGE_REF_PREFIXES: Record<DeckDesignOrderStage, string[]> = {
  narrative_spine: ["narrative:", "claim:", "section:"],
  source_evidence: ["source:", "evidence:", "claim:", "slide:", "sheet:", "rows:", "columns:", "numericCells:", "formulaCells:", "chartFamilies:", "errorBars:", "errorBarKind:"],
  slide_role: ["slideRole:", "slide:", "layout:", "role:"],
  chart_intent: ["chartIntent:", "sourceSheet:", "sheet:", "rows:", "columns:", "numericCells:", "formulaCells:", "chartFamilies:", "errorBars:", "errorBarKind:"],
  semantic_visual_guidance: ["visual:", "visualApplication:", "density:", "downshift:", "labelBudget:", "aggregation:"],
  theme_binding_request: ["theme.", "theme:"],
  mdpr_validation_refs: ["mdpr:"],
  review_notes: ["review:", "reviewNote:"],
};

function deckDesignOrderRefMatchesStage(stage: DeckDesignOrderStage, ref: string): boolean {
  return DECK_DESIGN_STAGE_REF_PREFIXES[stage].some((prefix) => ref.startsWith(prefix));
}

function sourceEvidenceLedgerDisconnectedFindings(sourceEvidenceRefs: string[], ledgerRefs: string[]): ReviewFinding[] {
  return [{
    severity: "warning",
    type: "SOURCE_EVIDENCE_LEDGER_DISCONNECTED",
    slideId: "deck",
    evidence: {
      sourceEvidenceRefs,
      ledgerEvidenceRefs: ledgerRefs.slice(0, 12),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "review.designOrder.sourceLedgerBridge",
      operation: "enableRule",
    },
  }];
}

function chartIntentEvidenceRefs(report: ScientificChartIntentReport | undefined): string[] {
  if (!report) return [];
  return report.intents.flatMap((intent) => [
    `chartIntent:${intent.intent}`,
    `sourceSheet:${intent.sourceSheetLabel}`,
    ...intent.evidenceRefs,
  ]);
}

function chartStructuralSourceEvidenceRefs(report: ScientificChartIntentReport | undefined): string[] {
  if (!report) return [];
  return [...new Set(report.intents.flatMap((intent) => intent.evidenceRefs.filter((ref) => !ref.startsWith("chartIntent:"))))];
}

function chartVisualGuidanceRefs(report: ScientificChartIntentReport | undefined): string[] {
  if (!report) return [];
  return report.intents.flatMap((intent) => [
    `visualApplication:${intent.intent}:${intent.visualApplication.chartChoice}`,
    `density:${intent.visualApplication.densityClass}`,
    `downshift:${intent.visualApplication.recommendedDownshift}`,
  ]);
}

function chartThemeBindingRefs(report: ScientificChartIntentReport | undefined): string[] {
  if (!report) return [];
  return report.intents.flatMap((intent) => [
    intent.visualApplication.backgroundTreatment,
    ...intent.visualApplication.toneSlots,
  ]);
}

function chartReviewNoteRefs(report: ScientificChartIntentReport | undefined): string[] {
  if (!report) return [];
  return report.reviewNotes.map((note) => `reviewNote:${note.type}:${note.sourceSheetLabel}`);
}

function collectDesignOrders(record: Record<string, unknown>): string[][] {
  const orders: string[][] = [];
  const direct = asArray(record.designOrder).map((stage) => String(stage)).filter(Boolean);
  if (direct.length) orders.push(direct);
  for (const intent of asArray(record.intents)) {
    const order = asArray(asRecord(intent)?.designOrder).map((stage) => String(stage)).filter(Boolean);
    if (order.length) orders.push(order);
  }
  for (const recipe of asArray(record.recipes)) {
    const order = asArray(asRecord(recipe)?.designOrder).map((stage) => String(stage)).filter(Boolean);
    if (order.length) orders.push(order);
  }
  return orders;
}

function hasNestedReviewEvidence(record: Record<string, unknown>): boolean {
  if (asArray(record.intents).some((intent) => asArray(asRecord(intent)?.evidenceRefs).length > 0)) return true;
  if (asArray(record.recipes).some((recipe) => {
    const recipeRecord = asRecord(recipe);
    return asArray(recipeRecord?.dataShapeRequirements).length > 0 || asArray(recipeRecord?.semanticRoles).length > 0;
  })) return true;
  return false;
}

function isReviewDesignOrderSequence(order: string[]): boolean {
  const expected = expectedDesignOrderFor(order);
  let cursor = -1;
  for (const stage of order) {
    const next = expected.indexOf(stage);
    if (next < 0) continue;
    if (next < cursor) return false;
    cursor = next;
  }
  return true;
}

function expectedDesignOrderFor(order: string[]): string[] {
  return order.some((stage) => ["data_evidence", "scientific_chart_intent", "renderer_capability_request"].includes(stage))
    ? SCIENTIFIC_CHART_DESIGN_ORDER
    : DECK_DESIGN_ORDER;
}

function chartVisualApplicationForIntent(intent: ScientificChartIntentKind): ChartVisualApplicationGuidance {
  if (intent === "cdf_curve") {
    return {
      chartChoice: "primary-visual",
      toneSlots: ["theme.chart.sequence", "theme.chart.accent", "theme.text.primary"],
      backgroundTreatment: "theme.surface.chartPanel",
      ...chartVisualStructure("moderate", "direct-labels", "small-multiple", false, ["data", "comparison", "summary"], true, "primary chart must bind to the slide claim or title takeaway"),
      labelStrategy: "Directly label percentile or threshold callouts; keep axis labels semantic and sparse.",
      densityStrategy: "Use a single emphasized curve first; use small multiples when groups exceed the label budget.",
    };
  }
  if (intent === "distribution_box_whisker" || intent === "distribution_quantile_band") {
    return {
      chartChoice: "supporting-proof",
      toneSlots: ["theme.chart.sequence", "theme.chart.neutral", "theme.chart.accent"],
      backgroundTreatment: "theme.surface.subtleBand",
      ...chartVisualStructure("dense", "key-labels", "distribution-strip", true, ["data", "appendix", "comparison"], true, "distribution proof must cite the compared groups and summary statistic"),
      labelStrategy: "Label median and selected quantile or whisker roles, not every mark.",
      densityStrategy: "Downshift to compact distribution strips when group count or labels exceed readable density.",
    };
  }
  if (intent === "mean_with_error_bars") {
    return {
      chartChoice: "supporting-proof",
      toneSlots: ["theme.chart.accent", "theme.chart.warning", "theme.text.primary"],
      backgroundTreatment: "theme.surface.proofHighlight",
      ...chartVisualStructure("moderate", "legend-or-callouts", "fallback-note", false, ["data", "comparison", "appendix"], true, "uncertainty chart must bind interval meaning to the claim before visual emphasis"),
      labelStrategy: "Name the uncertainty meaning near the legend or callout before emphasizing the interval.",
      densityStrategy: "Prefer fewer emphasized intervals; suppress or annotate unknown uncertainty kinds.",
    };
  }
  if (intent === "matrix_series") {
    return {
      chartChoice: "small-multiple",
      toneSlots: ["theme.chart.sequence", "theme.chart.neutral", "theme.text.secondary"],
      backgroundTreatment: "theme.surface.transparent",
      ...chartVisualStructure("very-dense", "aggregate-first", "small-multiple", true, ["data", "appendix"], true, "dense series must bind summarized groups to the claim before foreground use"),
      labelStrategy: "Use row or group labels outside the plotting area and reserve direct labels for selected traces.",
      densityStrategy: "Summarize dense series into representative bands, small multiples, or connected strips.",
    };
  }
  return {
    chartChoice: "background-proof",
    toneSlots: ["theme.chart.sequence", "theme.chart.accent", "theme.text.primary"],
    backgroundTreatment: "theme.surface.chartPanel",
    ...chartVisualStructure("dense", "aggregate-first", "aggregate-summary", true, ["data", "appendix"], true, "heatmap summary must name the aggregated metric and scale role"),
    labelStrategy: "Label the aggregated metric and show the scale legend only when the chart is the primary evidence.",
    densityStrategy: "Bucket or aggregate matrix cells before requesting heatmap rendering.",
  };
}

function chartVisualApplicationForKind(kind: HighNeedChartRecipeKind): ChartVisualApplicationGuidance {
  if (kind === "cdf_curve") return chartVisualApplicationForIntent("cdf_curve");
  if (kind === "quantile_band" || kind === "violin_plot" || kind === "ridgeline_density") {
    return {
      chartChoice: kind === "ridgeline_density" ? "small-multiple" : "supporting-proof",
      toneSlots: ["theme.chart.sequence", "theme.chart.neutral", "theme.text.primary"],
      backgroundTreatment: "theme.surface.subtleBand",
      ...chartVisualStructure("dense", "key-labels", kind === "ridgeline_density" ? "small-multiple" : "distribution-strip", true, ["data", "comparison", "appendix"], true, "distribution recipe must bind groups and summary statistic to the nearby claim"),
      labelStrategy: "Name groups and key distribution markers; avoid labeling every sample or density contour.",
      densityStrategy: "Use compact rows or bands before adding ornament when groups are numerous.",
    };
  }
  if (kind === "beeswarm_plot") {
    return {
      chartChoice: "supporting-proof",
      toneSlots: ["theme.chart.accent", "theme.chart.neutral", "theme.text.secondary"],
      backgroundTreatment: "theme.surface.transparent",
      ...chartVisualStructure("dense", "key-labels", "distribution-strip", true, ["data", "comparison", "appendix"], true, "point-level evidence must bind outliers or sample size to the claim"),
      labelStrategy: "Label groups and notable outliers while preserving individual-point evidence.",
      densityStrategy: "Use deterministic jitter or strip fallback when collision packing is unavailable.",
    };
  }
  if (kind === "slopegraph" || kind === "dumbbell_plot") {
    return {
      chartChoice: "comparison-strip",
      toneSlots: ["theme.chart.sequence", "theme.chart.accent", "theme.text.primary"],
      backgroundTreatment: "theme.surface.chartPanel",
      ...chartVisualStructure("moderate", "direct-labels", "table-plus-chart", false, ["comparison", "summary", "data"], true, "comparison strip must bind endpoints and delta to the stated takeaway"),
      labelStrategy: "Directly label endpoints and deltas; avoid legends when two states are obvious.",
      densityStrategy: "Sort by delta and cap visible comparisons before switching to table-plus-chart.",
    };
  }
  if (kind === "bullet_chart" || kind === "control_chart" || kind === "forest_plot" || kind === "bland_altman_plot") {
    return {
      chartChoice: "primary-visual",
      toneSlots: ["theme.chart.accent", "theme.chart.warning", "theme.chart.neutral", "theme.text.primary"],
      backgroundTreatment: "theme.surface.proofHighlight",
      ...chartVisualStructure("moderate", "legend-or-callouts", "fallback-note", false, ["data", "summary", "comparison"], true, "reference-line chart must bind target, limit, or interval role to the slide claim"),
      labelStrategy: "Keep reference lines, targets, or limits explicitly named because they carry the argument.",
      densityStrategy: "Prioritize the reference structure and reduce decoration when intervals or limits are dense.",
    };
  }
  if (kind === "sankey_alluvial" || kind === "marimekko_mosaic") {
    return {
      chartChoice: "primary-visual",
      toneSlots: ["theme.chart.sequence", "theme.chart.accent", "theme.chart.neutral"],
      backgroundTreatment: "theme.surface.chartPanel",
      ...chartVisualStructure("very-dense", "aggregate-first", "aggregate-summary", true, ["data", "process", "summary"], true, "flow or area composition must bind major categories to the narrative takeaway"),
      labelStrategy: "Label major flows or segments directly and route minor categories to an aggregated note.",
      densityStrategy: "Aggregate small categories before routing paths or area segments.",
    };
  }
  return {
    chartChoice: "supporting-proof",
    toneSlots: ["theme.chart.sequence", "theme.chart.accent", "theme.text.primary"],
    backgroundTreatment: "theme.surface.subtleBand",
    ...chartVisualStructure("dense", "key-labels", "fallback-note", true, ["data", "appendix", "comparison"], true, "specialized composition chart must bind axes or components to the claim"),
    labelStrategy: "Label component axes and selected points before adding explanatory decoration.",
    densityStrategy: "Validate composition constraints and reduce labels before rendering dense point clouds.",
  };
}

function chartVisualStructure(
  densityClass: ChartVisualApplicationGuidance["densityClass"],
  labelBudgetClass: ChartVisualApplicationGuidance["labelBudgetClass"],
  recommendedDownshift: ChartVisualApplicationGuidance["recommendedDownshift"],
  aggregationRequired: boolean,
  preferredSlideRoles: string[],
  requiresClaimSupport: boolean,
  evidenceBinding: string,
): Pick<ChartVisualApplicationGuidance, "densityClass" | "labelBudgetClass" | "recommendedDownshift" | "aggregationRequired" | "narrativeFit"> {
  return {
    densityClass,
    labelBudgetClass,
    recommendedDownshift,
    aggregationRequired,
    narrativeFit: {
      preferredSlideRoles,
      requiresClaimSupport,
      evidenceBinding,
    },
  };
}

function scientificChartSupportNeeded(intent: ScientificChartIntentKind): string {
  if (intent === "cdf_curve") return "cdf-or-ecdf curve semantics with probability-axis validation";
  if (intent === "distribution_box_whisker") return "box-whisker or equivalent distribution primitive";
  if (intent === "distribution_quantile_band") return "quantile-band distribution fallback with median marker";
  if (intent === "mean_with_error_bars") return "uncertainty/error-bar semantics and render validation";
  if (intent === "matrix_series") return "dense matrix series summarization or small-multiple grouping";
  return "heatmap or matrix summary primitive";
}

function scientificChartReviewNoteType(
  intent: ScientificChartIntentKind,
  text: string,
): ScientificChartIntentReport["reviewNotes"][number]["type"] {
  if (intent === "mean_with_error_bars" && text.toLowerCase().includes("unknown")) return "ERROR_BAR_KIND_UNKNOWN";
  if (intent === "matrix_series" || intent === "heatmap_summary") return "DENSE_MATRIX_NEEDS_SUMMARY";
  if (intent === "distribution_box_whisker" || intent === "distribution_quantile_band") return "DISTRIBUTION_SEMANTICS_REQUIRED";
  return "CDF_SEMANTICS_REQUIRED";
}

function dedupeScientificChartIntents(intents: ScientificChartIntentEntry[]): ScientificChartIntentEntry[] {
  const seen = new Set<string>();
  return intents.filter((intent) => {
    const key = `${intent.sourceSheetLabel}:${intent.intent}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceRefsForFinding(finding: ReviewFinding): string[] {
  const refs = new Set<string>();
  if (finding.slideId) refs.add(`slide:${finding.slideId}`);
  const evidence = asRecord(finding.evidence);
  if (evidence) {
    const objectKind = evidence.objectKind;
    if (typeof objectKind === "string" && objectKind) refs.add(`objectKind:${objectKind}`);
    const role = evidence.role;
    if (typeof role === "string" && role) refs.add(`role:${role}`);
    for (const key of ["blockIds", "layoutSlideIds", "regionIds", "sampleLocations"]) {
      const values = asArray(evidence[key]).map((value) => String(value)).filter(Boolean);
      for (const value of values.slice(0, 4)) refs.add(`${key}:${value}`);
    }
  }
  if (refs.size === 0) refs.add(`finding:${finding.type}`);
  return [...refs];
}

function guidanceTextForFinding(finding: ReviewFinding): string {
  const category = visualGuidanceCategory(finding);
  if (category === "editability_risk") return "Prefer MDPR-native editable objects or record an explicit generated-asset boundary before accepting raster primary content.";
  if (category === "theme_fit") return "Move visual style values into MDPR theme/profile tokens and keep raw style values out of review hints.";
  if (category === "decoration_noise") return "Reduce decorative intensity or route the issue to an MDPR rulebook/profile update with density-aware downshift behavior.";
  if (category === "contrast_or_legibility") return "Use MDPR validation evidence to tune contrast, clipping, and readable text scale before treating the deck as visually ready.";
  if (category === "object_semantics") return "Align object form with source semantics and prefer MDPR rule/config changes over exact asset or geometry instructions.";
  if (category === "layout_density") return "Split or simplify dense content through MDPR rules, config, or approved override candidates before adding ornament.";
  if (category === "hierarchy") return "Strengthen source narrative hierarchy, grouping, or evidence pairing before changing theme or decoration.";
  return "Record a bounded MDPR rulebook, config, or source cleanup recommendation with concrete evidence references.";
}

function sourcesForClaim(claimExcerpt: string, sources: CitationSource[]): SourceSlideEvidenceLedgerEntry["sources"] {
  const numericCitation = /\[\^?(\d+)\]/.exec(claimExcerpt);
  if (numericCitation) {
    const source = sources[Number(numericCitation[1]) - 1];
    return source ? [sourceToLedgerSource(source)] : [];
  }
  const namedSource = sources.find((source) => {
    const title = source.title?.toLowerCase();
    const sourceId = source.id?.toLowerCase();
    const claim = claimExcerpt.toLowerCase();
    return Boolean(title && claim.includes(title)) || Boolean(sourceId && claim.includes(sourceId));
  });
  return namedSource ? [sourceToLedgerSource(namedSource)] : [];
}

function sourceToLedgerSource(source: CitationSource): SourceSlideEvidenceLedgerEntry["sources"][number] {
  return {
    ...(source.id ? { sourceId: source.id } : {}),
    ...(source.title ? { title: source.title } : {}),
    ...(source.date ? { date: source.date } : {}),
    ...(source.path ? { path: source.path } : {}),
    ...(source.url ? { url: source.url } : {}),
  };
}

function hasCitationMarker(line: string): boolean {
  return /\[\^?\w+\]|\(\s*https?:\/\/|source:/i.test(line);
}

function hasQuantitativeClaim(line: string): boolean {
  return /\b\d+(?:\.\d+)?\s*(?:%|percent\b|x\b|k\b|m\b|b\b|ms\b|s\b|days?\b|weeks?\b|months?\b|years?\b)/i.test(line);
}

function hasStrongClaim(line: string): boolean {
  return /\b(proves?|shows?|confirms?|demonstrates?|reduces?|increases?|drives?|causes?)\b/i.test(line);
}

function firstUnexpandedAcronym(markdown: string): string | undefined {
  const matches = markdown.match(/\b[A-Z]{2,}\b/g) ?? [];
  return matches.find((acronym) => !new RegExp(`\\(${escapeRegExp(acronym)}\\)`).test(markdown));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dedupeCitationFindings(findings: CitationProvenanceFinding[]): CitationProvenanceFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.kind}:${finding.evidence.markdownExcerpt ?? finding.evidence.sourceId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function narrativeEvidenceBase(input: NarrativeSpineInput): Omit<NarrativeSpineSuggestion["evidence"], "markdownHeading"> {
  const metrics = asRecord(input.manifest?.metrics);
  const manifestSlideCount = numberValue(metrics?.slideCount) ?? numberValue(input.manifest?.slideCount);
  return {
    sourcePath: input.sourcePath ?? "markdown",
    ...(manifestSlideCount !== undefined ? { manifestSlideCount } : {}),
    ...(input.sourceNotes ? { sourceNotesExcerpt: input.sourceNotes.trim().slice(0, 160) } : {}),
  };
}

type TemplateLayoutLike = {
  label: string;
  roles: string[];
};

function normalizeTemplateLayouts(value: unknown): TemplateLayoutLike[] {
  const record = asRecord(value);
  const layouts = asArray(record?.layouts ?? record?.slideLayouts ?? record?.masters);
  return layouts.map((layoutValue, index) => {
    const layout = asRecord(layoutValue) ?? {};
    const placeholders = asArray(layout.placeholders ?? layout.shapes ?? layout.slots).map((placeholder) => asRecord(placeholder) ?? {});
    return {
      label: stringValue(layout.name) ?? stringValue(layout.title) ?? stringValue(layout.label) ?? `layout-${index + 1}`,
      roles: [...new Set(placeholders.map((placeholder) => normalizedPlaceholderRole(placeholder)).filter(Boolean))],
    };
  }).filter((layout) => layout.roles.length > 0);
}

function normalizedPlaceholderRole(placeholder: Record<string, unknown>): string {
  const raw = stringValue(placeholder.role)
    ?? stringValue(placeholder.kind)
    ?? stringValue(placeholder.type)
    ?? stringValue(placeholder.placeholderType)
    ?? "";
  const normalized = raw.toLowerCase();
  if (/chart|graph|plot/.test(normalized)) return "chart";
  if (/table|grid/.test(normalized)) return "table";
  if (/image|picture|media/.test(normalized)) return "image";
  if (/title|heading/.test(normalized)) return "title";
  if (/subtitle|caption|note/.test(normalized)) return "support";
  if (/body|content|text/.test(normalized)) return "body";
  return normalized.replace(/[^a-z0-9-]+/g, "-");
}

function inferTemplateIntent(label: string, roles: string[]): TemplateLayoutIntentHint["intent"] {
  const haystack = `${label} ${roles.join(" ")}`.toLowerCase();
  const bodyLikeCount = roles.filter((role) => role === "body" || role === "table" || role === "image").length;
  if (/compare|versus|vs|two column|before after/.test(haystack) || bodyLikeCount >= 2 && roles.includes("body")) return "comparison";
  if (roles.includes("chart")) return "chart-focus";
  if (roles.includes("table") || roles.includes("image")) return "evidence";
  return "section-divider";
}

function suitableContentForIntent(intent: TemplateLayoutIntentHint["intent"]): string[] {
  if (intent === "comparison") return ["tradeoff", "before-after", "option-comparison"];
  if (intent === "chart-focus") return ["metric-trend", "chart-with-commentary", "quantitative-evidence"];
  if (intent === "evidence") return ["table-evidence", "image-evidence", "artifact-summary"];
  return ["section-break", "agenda-transition", "chapter-title"];
}

function layoutIntentRationale(intent: TemplateLayoutIntentHint["intent"], roles: string[]): string {
  if (intent === "comparison") return `Multiple comparable content roles suggest a comparison layout intent. Roles: ${roles.join(", ")}.`;
  if (intent === "chart-focus") return `Chart placeholders suggest a quantitative evidence layout intent. Roles: ${roles.join(", ")}.`;
  if (intent === "evidence") return `Evidence placeholders suggest a source artifact or data display intent. Roles: ${roles.join(", ")}.`;
  return `Title-oriented placeholders suggest a section transition intent. Roles: ${roles.join(", ")}.`;
}

function isReviewModel(value: ReviewModel | ReviewCoreInput): value is ReviewModel {
  return "presentationSlides" in value && "layoutSlides" in value && "blockById" in value;
}

function hasFinalDecisionKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasFinalDecisionKey);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
    FINAL_DECISION_FIELDS.has(key) || hasFinalDecisionKey(child)
  );
}

function blocksForLayoutSlide(layoutSlide: LayoutSlideLike, blockById: Map<string, BlockLike>): BlockLike[] {
  return layoutSlide.regions
    .flatMap((region) => region.blockIds)
    .map((blockId) => blockById.get(blockId))
    .filter((block): block is BlockLike => Boolean(block));
}

function isEvidenceBlock(block: BlockLike): boolean {
  return EVIDENCE_BLOCK_TYPES.has(block.type);
}

function isSupportTextBlock(block: BlockLike): boolean {
  return ["paragraph", "quote", "bulletList", "orderedList"].includes(block.type) && blockText(block).trim().length > 0;
}

function isCaptionBlock(block: BlockLike): boolean {
  if (!isSupportTextBlock(block)) return false;
  return /^(figure|fig\.|table|chart|source|note|caption)\b/i.test(blockText(block).trim());
}

function isClaimBlock(block: BlockLike): boolean {
  if (!isSupportTextBlock(block) || isCaptionBlock(block)) return false;
  const text = blockText(block).trim();
  return text.length >= 18;
}

function blockText(block: BlockLike): string {
  return block.text ?? block.alt ?? "";
}

function semanticTermsForBlocks(blocks: BlockLike[]): Set<string> {
  const stopwords = new Set(["the", "and", "with", "from", "after", "before", "this", "that", "figure", "table", "chart", "source", "note", "main"]);
  const terms = new Set<string>();
  for (const block of blocks) {
    for (const token of blockText(block).toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? []) {
      if (!stopwords.has(token)) terms.add(token);
    }
  }
  return terms;
}

function semanticMotifForBlock(block: BlockLike): string {
  const text = blockText(block).toLowerCase();
  if (/\bcdf\b|ecdf|percentile|p95|p99/.test(text)) return "cdf_or_percentile";
  if (/box|whisker|violin|quantile|distribution/.test(text)) return "distribution";
  if (/error|interval|confidence|uncertainty/.test(text)) return "uncertainty_interval";
  if (/heatmap|matrix/.test(text)) return "matrix_or_heatmap";
  if (/flow|sankey|alluvial/.test(text)) return "flow";
  return block.type;
}

function chartPlacementBlockMatchesIntent(block: BlockLike, intent: ScientificChartIntentKind): boolean {
  const motif = semanticMotifForBlock(block);
  if (intent === "cdf_curve") return motif === "cdf_or_percentile";
  if (intent === "distribution_box_whisker" || intent === "distribution_quantile_band") return motif === "distribution";
  if (intent === "mean_with_error_bars") return motif === "uncertainty_interval";
  if (intent === "matrix_series" || intent === "heatmap_summary") return motif === "matrix_or_heatmap";
  return isEvidenceBlock(block);
}

function semanticSlideRole(slide: PresentationSlideLike, layoutSlide: LayoutSlideLike): string {
  const intent = (slide.intent ?? "").toLowerCase();
  if (intent) return intent;
  const regionRoles = layoutSlide.regions.map((region) => (region.role ?? "").toLowerCase()).filter(Boolean);
  if (regionRoles.includes("section")) return "section";
  if (regionRoles.includes("appendix")) return "appendix";
  if (regionRoles.includes("chart")) return "data";
  if (layoutSlide.preset.toLowerCase().includes("section")) return "section";
  return layoutSlide.preset;
}

function safeRefSegment(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "unknown";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArrayAt(record: Record<string, unknown> | undefined, key: string): string[] {
  return asArray(record?.[key]).map((value) => String(value)).filter(Boolean);
}

function htmlEffectMappings(input: ReviewCoreInput): Record<string, unknown>[] {
  return asArray(asRecord(input.htmlDesignAnalysis)?.pptEffectMapping).map((value) => asRecord(value) ?? {});
}

function collectRawHexPaths(value: unknown, path: string[] = []): string[] {
  if (typeof value === "string") {
    if (/^#[0-9a-f]{6}$/i.test(value) && !isTokenizedStylePath(path)) return [path.join(".")];
    return [];
  }
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRawHexPaths(item, [...path, String(index)]));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => collectRawHexPaths(child, [...path, key]));
}

function isTokenizedStylePath(path: string[]): boolean {
  const normalized = path.map((item) => item.toLowerCase());
  return normalized.includes("tokens")
    || normalized.includes("palette")
    || normalized.includes("themecolors")
    || normalized.includes("colortokens");
}
