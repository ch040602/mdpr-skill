import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  assertMdprRunSucceeded,
  collectMdprMetrics,
  loadMdprArtifacts,
  runMdprBuild,
  type MdprContext,
  type MdprRunInput,
  type MdprRunResult,
} from "../../mdpr-adapter/src/index.js";
import { assertNoForbiddenFields, type AgentHintManifest } from "../../hints-core/src/index.js";
import {
  reviewCoherence,
  reviewFindingHasFinalDecisionField,
  reviewVisualPolicy,
  type ReviewFinding,
} from "../../review-core/src/index.js";

export type MdprRunMetrics = {
  overflowCount: number;
  coherenceWarnings: number;
  visualErrors: number;
  buildMs?: number;
  slideCount?: number;
  outputBytes?: number;
  minFontPt?: number;
  textClipRiskCount?: number;
  contrastFailures?: number;
  connectorWarnings?: number;
};

export type MdprSkillComparison = {
  baseline: MdprRunMetrics;
  skillGuided: MdprRunMetrics;
  regressions: string[];
  regressionGate: EvalGateResult;
};

export type EvalGateResult = {
  status: "pass" | "fail";
  findings: string[];
  metrics?: Record<string, number | string | boolean | undefined>;
};

export type EvidenceCorpusEntry = {
  id:
    | "mdpr-manifest"
    | "presentation-ir"
    | "layout-ir"
    | "pptx-object-map"
    | "rendered-artifact"
    | "selection-context"
    | "design-analysis"
    | "diagram-metrics";
  description: string;
};

export type ReviewEvidenceRoute = {
  findingType: string;
  severity: ReviewFinding["severity"];
  slideId?: string;
  candidateCorpusIds: EvidenceCorpusEntry["id"][];
  coveredEvidenceKeys: string[];
  missingFacts: string[];
  feedbackQueries: ReviewEvidenceFeedbackQuery[];
  artifactAttempts: ReviewEvidenceArtifactAttempt[];
  status: "covered" | "missing";
};

export type ReviewEvidenceFeedbackQuery = {
  query: string;
  targetCorpusIds: EvidenceCorpusEntry["id"][];
  reason: string;
};

export type ReviewEvidenceArtifactAttempt = {
  query: string;
  targetCorpusId: EvidenceCorpusEntry["id"];
  candidatePaths: string[];
  foundPaths: string[];
  status: "found" | "missing";
};

export type ReviewEvidenceRetrievalPlan = {
  corpusCatalog: EvidenceCorpusEntry[];
  routes: ReviewEvidenceRoute[];
};

export type EvidenceArtifactRetryOptions = {
  artifactRoot?: string;
  exists?: (path: string) => boolean;
};

export const REVIEW_EVIDENCE_CORPUS_CATALOG: EvidenceCorpusEntry[] = [
  {
    id: "mdpr-manifest",
    description: "Build manifest, validation summaries, visual metrics, accent usage, and renderer metadata.",
  },
  {
    id: "presentation-ir",
    description: "Parsed Markdown semantics, source slide ids, block ids, headings, and source block roles.",
  },
  {
    id: "layout-ir",
    description: "Layout slide ids, regions, role assignments, and block-to-region placement.",
  },
  {
    id: "pptx-object-map",
    description: "PowerPoint object map entries, object kinds, editability, roles, and renderer shape mapping.",
  },
  {
    id: "rendered-artifact",
    description: "Rendered screenshots, PNG exports, contact sheets, and visual evidence files.",
  },
  {
    id: "selection-context",
    description: "Weak mdpr-ppt or preview selection context passed to review and hint rails.",
  },
  {
    id: "design-analysis",
    description: "DESIGN.md or HTML design analysis tokens, CSS declarations, and PPT effect feasibility evidence.",
  },
  {
    id: "diagram-metrics",
    description: "Diagram grammar metrics such as node count, edge count, accent count, and diagram id.",
  },
];

export type EvalRegressionThresholds = {
  maxBuildMsMultiplier: number;
  maxSlideCountDelta: number;
  maxOutputBytesMultiplier: number;
  maxMinFontDropPt: number;
};

export const DEFAULT_REGRESSION_THRESHOLDS: EvalRegressionThresholds = {
  maxBuildMsMultiplier: 1.2,
  maxSlideCountDelta: 2,
  maxOutputBytesMultiplier: 1.35,
  maxMinFontDropPt: 1,
};

export type EvalRunArtifacts = {
  run: MdprRunResult;
  outDir: string;
  manifestPath: string;
  sourceSha256: string;
  metrics: MdprRunMetrics;
  review: ReviewRunSummary;
  profile?: MdprRunProfile;
};

export type MdprRunProfile = {
  profile?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  pdf?: Record<string, unknown>;
  renderer?: Record<string, unknown>;
};

export type ReviewRunSummary = {
  findingCount: number;
  errorCount: number;
  warningCount: number;
  forbiddenFieldCount: number;
  missingEvidenceCount: number;
  findings: ReviewFinding[];
};

export type DeckCoherenceEvidence = {
  status: "recorded";
  run: "baseline" | "skillGuided";
  decisionAuthority: "mdpr-runtime-gates";
  metrics: Pick<MdprRunMetrics, "coherenceWarnings" | "overflowCount" | "textClipRiskCount" | "contrastFailures" | "connectorWarnings">;
  reviewFindingCount: number;
  reviewErrorCount: number;
  reviewWarningCount: number;
  sufficientEvidenceFindingCount: number;
  missingEvidenceFindingCount: number;
};

export type DeckCoherenceReport = {
  status: "recorded";
  boundary: "evidence-only-not-mdpr-pass-fail";
  baseline: DeckCoherenceEvidence;
  skillGuided: DeckCoherenceEvidence;
  deltas: {
    coherenceWarnings: number;
    reviewFindings: number;
    reviewErrors: number;
    reviewWarnings: number;
    missingEvidenceFindings: number;
  };
};

export type DesignDecisionTraceStep = {
  order: number;
  stage:
    | "source"
    | "baseline-build"
    | "guided-input"
    | "guided-build"
    | "review"
    | "evidence-routing"
    | "gate-summary";
  owner: "mdpr" | "mdpr-skill";
  evidenceRefs: string[];
  note: string;
};

export type DesignDecisionTraceReport = {
  status: "recorded";
  boundary: "trace-only-not-renderer-instructions";
  steps: DesignDecisionTraceStep[];
};

export type MdprSkillEvalInput = Omit<MdprRunInput, "outDir" | "hintsPath" | "packPath"> & {
  outDir: string;
  baselineOutDir?: string;
  guidedOutDir?: string;
  hintsPath?: string;
  hintManifest?: AgentHintManifest;
  baselinePackPath?: string;
  guidedPackPath?: string;
  reportPath?: string;
  thresholds?: Partial<EvalRegressionThresholds>;
};

export type MdprSkillEvalReport = {
  schemaVersion: "mdpr-skill-eval-v1";
  deck: string;
  summary: {
    overallStatus: "pass" | "fail";
    regressionCount: number;
    baselineManifestPath: string;
    guidedManifestPath: string;
  };
  baseline: EvalRunArtifacts;
  skillGuided: EvalRunArtifacts & { hintsPath?: string };
  gates: {
    schemaSync: EvalGateResult;
    boundary: EvalGateResult;
    regression: EvalGateResult;
    review: EvalGateResult;
    sufficientContext: EvalGateResult;
  };
  reviews: {
    baseline: ReviewRunSummary;
    skillGuided: ReviewRunSummary;
  };
  evidenceRetrieval: {
    baseline: ReviewEvidenceRetrievalPlan;
    skillGuided: ReviewEvidenceRetrievalPlan;
  };
  deckCoherence: DeckCoherenceReport;
  designDecisionTrace: DesignDecisionTraceReport;
  hintsPath?: string;
  baselinePackPath?: string;
  guidedPackPath?: string;
  regressions: string[];
  thresholds: EvalRegressionThresholds;
};

type EvalDeps = {
  runBuild?: typeof runMdprBuild;
  loadArtifacts?: typeof loadMdprArtifacts;
  collectMetrics?: typeof collectMdprMetrics;
  readText?: (path: string) => string;
  writeText?: (path: string, value: string) => void;
  mkdirp?: (path: string) => void;
  exists?: (path: string) => boolean;
  now?: () => number;
};

export function compareMdprRuns(
  baseline: MdprRunMetrics,
  skillGuided: MdprRunMetrics,
  thresholds: Partial<EvalRegressionThresholds> = {},
): MdprSkillComparison {
  const regressionGate = buildRegressionGate(baseline, skillGuided, thresholds);
  return { baseline, skillGuided, regressions: regressionGate.findings, regressionGate };
}

export function regressionGate(comparison: MdprSkillComparison): "pass" | "fail" {
  return comparison.regressionGate.status;
}

export function buildRegressionGate(
  baseline: MdprRunMetrics,
  skillGuided: MdprRunMetrics,
  partialThresholds: Partial<EvalRegressionThresholds> = {},
): EvalGateResult {
  const thresholds = { ...DEFAULT_REGRESSION_THRESHOLDS, ...partialThresholds };
  const findings: string[] = [];
  if (skillGuided.overflowCount > baseline.overflowCount) findings.push("overflowCount increased");
  if (skillGuided.coherenceWarnings > baseline.coherenceWarnings) findings.push("coherenceWarnings increased");
  if (skillGuided.visualErrors > baseline.visualErrors) findings.push("visualErrors increased");
  if ((skillGuided.textClipRiskCount ?? 0) > (baseline.textClipRiskCount ?? 0)) findings.push("textClipRiskCount increased");
  if ((skillGuided.contrastFailures ?? 0) > (baseline.contrastFailures ?? 0)) findings.push("contrastFailures increased");
  if ((skillGuided.connectorWarnings ?? 0) > (baseline.connectorWarnings ?? 0)) findings.push("connectorWarnings increased");
  if (baseline.buildMs !== undefined && skillGuided.buildMs !== undefined && skillGuided.buildMs > baseline.buildMs * thresholds.maxBuildMsMultiplier) {
    findings.push(`buildMs regressed beyond ${thresholds.maxBuildMsMultiplier}x`);
  }
  if (baseline.slideCount !== undefined && skillGuided.slideCount !== undefined && skillGuided.slideCount - baseline.slideCount > thresholds.maxSlideCountDelta) {
    findings.push(`slideCount increased beyond ${thresholds.maxSlideCountDelta}`);
  }
  if (baseline.outputBytes !== undefined && skillGuided.outputBytes !== undefined && skillGuided.outputBytes > baseline.outputBytes * thresholds.maxOutputBytesMultiplier) {
    findings.push(`outputBytes increased beyond ${thresholds.maxOutputBytesMultiplier}x`);
  }
  if (baseline.minFontPt !== undefined && skillGuided.minFontPt !== undefined && baseline.minFontPt - skillGuided.minFontPt > thresholds.maxMinFontDropPt) {
    findings.push(`minFontPt dropped by more than ${thresholds.maxMinFontDropPt}pt`);
  }
  return {
    status: findings.length === 0 ? "pass" : "fail",
    findings,
    metrics: {
      baselineOverflowCount: baseline.overflowCount,
      guidedOverflowCount: skillGuided.overflowCount,
      baselineBuildMs: baseline.buildMs,
      guidedBuildMs: skillGuided.buildMs,
      baselineSlideCount: baseline.slideCount,
      guidedSlideCount: skillGuided.slideCount,
      baselineMinFontPt: baseline.minFontPt,
      guidedMinFontPt: skillGuided.minFontPt,
    },
  };
}

export function runBaseline(input: MdprSkillEvalInput, deps: EvalDeps = {}): EvalRunArtifacts {
  return runEvalBuild({
    ...input,
    outDir: input.baselineOutDir ?? join(input.outDir, "baseline"),
    packPath: input.baselinePackPath,
  }, deps);
}

export function runSkillGuided(
  input: MdprSkillEvalInput & { sourceSha256: string },
  deps: EvalDeps = {},
): EvalRunArtifacts & { hintsPath?: string; hintGates: { schemaSync: EvalGateResult; boundary: EvalGateResult } } {
  const outDir = input.guidedOutDir ?? join(input.outDir, "guided");
  const preparedHints = prepareEvalHints(input, outDir, deps);
  const artifact = runEvalBuild({
    ...input,
    outDir,
    hintsPath: preparedHints.hintsPath,
    packPath: input.guidedPackPath,
  }, deps);
  return { ...artifact, hintsPath: preparedHints.hintsPath, hintGates: preparedHints.gates };
}

export function runMdprSkillEval(input: MdprSkillEvalInput, deps: EvalDeps = {}): MdprSkillEvalReport {
  const baseline = runBaseline(input, deps);
  const skillGuided = runSkillGuided({ ...input, sourceSha256: baseline.sourceSha256 }, deps);
  const thresholds = { ...DEFAULT_REGRESSION_THRESHOLDS, ...input.thresholds };
  const comparison = compareMdprRuns(baseline.metrics, skillGuided.metrics, thresholds);
  const reviewGate = buildReviewRegressionGate(baseline.review, skillGuided.review);
  const sufficientContextGate = buildSufficientContextGate(skillGuided.review);
  const baselineEvidenceRetrieval = buildReviewEvidenceRetrievalPlan(baseline.review, {
    artifactRoot: baseline.outDir,
    exists: deps.exists,
  });
  const guidedEvidenceRetrieval = buildReviewEvidenceRetrievalPlan(skillGuided.review, {
    artifactRoot: skillGuided.outDir,
    exists: deps.exists,
  });
  const deckCoherence = buildDeckCoherenceReport(baseline, skillGuided);
  const designDecisionTrace = buildDesignDecisionTrace({
    deckPath: input.deckPath,
    baseline,
    skillGuided,
    hintsPath: skillGuided.hintsPath,
    baselinePackPath: input.baselinePackPath,
    guidedPackPath: input.guidedPackPath,
  });
  const overallStatus = [skillGuided.hintGates.schemaSync, skillGuided.hintGates.boundary, comparison.regressionGate, reviewGate, sufficientContextGate]
    .every((gate) => gate.status === "pass") ? "pass" : "fail";
  const report: MdprSkillEvalReport = {
    schemaVersion: "mdpr-skill-eval-v1",
    deck: input.deckPath,
    summary: {
      overallStatus,
      regressionCount: comparison.regressions.length,
      baselineManifestPath: baseline.manifestPath,
      guidedManifestPath: skillGuided.manifestPath,
    },
    baseline,
    skillGuided,
    gates: {
      schemaSync: skillGuided.hintGates.schemaSync,
      boundary: skillGuided.hintGates.boundary,
      regression: comparison.regressionGate,
      review: reviewGate,
      sufficientContext: sufficientContextGate,
    },
    reviews: {
      baseline: baseline.review,
      skillGuided: skillGuided.review,
    },
    evidenceRetrieval: {
      baseline: baselineEvidenceRetrieval,
      skillGuided: guidedEvidenceRetrieval,
    },
    deckCoherence,
    designDecisionTrace,
    hintsPath: skillGuided.hintsPath,
    baselinePackPath: input.baselinePackPath,
    guidedPackPath: input.guidedPackPath,
    regressions: comparison.regressions,
    thresholds,
  };
  if (input.reportPath) emitEvalReport(report, input.reportPath, deps);
  return report;
}

export function buildDeckCoherenceReport(
  baseline: EvalRunArtifacts,
  skillGuided: EvalRunArtifacts,
): DeckCoherenceReport {
  const baselineEvidence = buildDeckCoherenceEvidence("baseline", baseline);
  const guidedEvidence = buildDeckCoherenceEvidence("skillGuided", skillGuided);
  return {
    status: "recorded",
    boundary: "evidence-only-not-mdpr-pass-fail",
    baseline: baselineEvidence,
    skillGuided: guidedEvidence,
    deltas: {
      coherenceWarnings: guidedEvidence.metrics.coherenceWarnings - baselineEvidence.metrics.coherenceWarnings,
      reviewFindings: guidedEvidence.reviewFindingCount - baselineEvidence.reviewFindingCount,
      reviewErrors: guidedEvidence.reviewErrorCount - baselineEvidence.reviewErrorCount,
      reviewWarnings: guidedEvidence.reviewWarningCount - baselineEvidence.reviewWarningCount,
      missingEvidenceFindings: guidedEvidence.missingEvidenceFindingCount - baselineEvidence.missingEvidenceFindingCount,
    },
  };
}

function buildDeckCoherenceEvidence(
  run: DeckCoherenceEvidence["run"],
  artifact: EvalRunArtifacts,
): DeckCoherenceEvidence {
  return {
    status: "recorded",
    run,
    decisionAuthority: "mdpr-runtime-gates",
    metrics: {
      coherenceWarnings: artifact.metrics.coherenceWarnings,
      overflowCount: artifact.metrics.overflowCount,
      textClipRiskCount: artifact.metrics.textClipRiskCount ?? 0,
      contrastFailures: artifact.metrics.contrastFailures ?? 0,
      connectorWarnings: artifact.metrics.connectorWarnings ?? 0,
    },
    reviewFindingCount: artifact.review.findingCount,
    reviewErrorCount: artifact.review.errorCount,
    reviewWarningCount: artifact.review.warningCount,
    sufficientEvidenceFindingCount: artifact.review.findingCount - artifact.review.missingEvidenceCount,
    missingEvidenceFindingCount: artifact.review.missingEvidenceCount,
  };
}

export function buildDesignDecisionTrace(input: {
  deckPath: string;
  baseline: EvalRunArtifacts;
  skillGuided: EvalRunArtifacts & { hintsPath?: string };
  hintsPath?: string;
  baselinePackPath?: string;
  guidedPackPath?: string;
}): DesignDecisionTraceReport {
  return {
    status: "recorded",
    boundary: "trace-only-not-renderer-instructions",
    steps: [
      {
        order: 1,
        stage: "source",
        owner: "mdpr",
        evidenceRefs: [input.deckPath],
        note: "MDPR parses source Markdown and owns source-to-render decisions.",
      },
      {
        order: 2,
        stage: "baseline-build",
        owner: "mdpr",
        evidenceRefs: [input.baseline.manifestPath],
        note: "Baseline build evidence is copied from MDPR artifacts.",
      },
      {
        order: 3,
        stage: "guided-input",
        owner: "mdpr-skill",
        evidenceRefs: [
          ...([input.hintsPath].filter(Boolean) as string[]),
          ...([input.baselinePackPath, input.guidedPackPath].filter(Boolean) as string[]),
        ],
        note: "mdpr-skill supplies schema-checked hints or approved packs as proposal inputs only.",
      },
      {
        order: 4,
        stage: "guided-build",
        owner: "mdpr",
        evidenceRefs: [input.skillGuided.manifestPath],
        note: "MDPR owns guided rendering and emitted artifact semantics.",
      },
      {
        order: 5,
        stage: "review",
        owner: "mdpr-skill",
        evidenceRefs: ["reviews.baseline", "reviews.skillGuided", "deckCoherence"],
        note: "mdpr-skill records review evidence and coherence deltas without issuing renderer instructions.",
      },
      {
        order: 6,
        stage: "evidence-routing",
        owner: "mdpr-skill",
        evidenceRefs: ["evidenceRetrieval.baseline", "evidenceRetrieval.skillGuided"],
        note: "Evidence routing identifies which local corpus can support review findings.",
      },
      {
        order: 7,
        stage: "gate-summary",
        owner: "mdpr-skill",
        evidenceRefs: ["gates"],
        note: "Gate statuses summarize checks; MDPR remains the runtime owner for parsing, layout, rendering, and validation outcomes.",
      },
    ],
  };
}

export function emitEvalReport(report: MdprSkillEvalReport, path: string, deps: EvalDeps = {}): void {
  const mkdirp = deps.mkdirp ?? ((dir: string) => mkdirSync(dir, { recursive: true }));
  const writeText = deps.writeText ?? ((target: string, value: string) => writeFileSync(target, value, "utf-8"));
  mkdirp(dirname(path));
  writeText(path, JSON.stringify(report, null, 2) + "\n");
}

function runEvalBuild(input: MdprRunInput, deps: EvalDeps): EvalRunArtifacts {
  const runBuild = deps.runBuild ?? runMdprBuild;
  const loadArtifacts = deps.loadArtifacts ?? loadMdprArtifacts;
  const collectMetrics = deps.collectMetrics ?? collectMdprMetrics;
  const now = deps.now ?? (() => Date.now());
  const start = now();
  const run = runBuild(input);
  const buildMs = now() - start;
  assertMdprRunSucceeded(run);
  const outDir = run.outDir ?? resolve(input.outDir ?? ".");
  const context: MdprContext = loadArtifacts(outDir);
  const metrics = collectEvalMetrics(context.manifest, collectMetrics, buildMs);
  const review = runReviews(context);
  const profile = extractRunProfile(context.manifest);
  return {
    run,
    outDir,
    manifestPath: run.manifestPath ?? join(outDir, "mdpresent-manifest.json"),
    sourceSha256: context.sourceSha256,
    metrics,
    review,
    ...(profile ? { profile } : {}),
  };
}

export function runReviews(context: MdprContext): ReviewRunSummary {
  return summarizeReviewFindings([
    ...reviewCoherence({
      manifest: context.manifest,
      presentation: context.presentation,
      layout: context.layout,
    }),
    ...reviewVisualPolicy({
      manifest: context.manifest,
      presentation: context.presentation,
      layout: context.layout,
    }),
  ]);
}

export function buildReviewRegressionGate(baseline: ReviewRunSummary, skillGuided: ReviewRunSummary): EvalGateResult {
  const findings: string[] = [];
  if (skillGuided.errorCount > baseline.errorCount) findings.push("reviewErrors increased");
  if (skillGuided.warningCount > baseline.warningCount) findings.push("reviewWarnings increased");
  if (skillGuided.forbiddenFieldCount > 0) findings.push("guidedReviewForbiddenFields present");
  if (skillGuided.missingEvidenceCount > 0) findings.push("guidedReviewMissingEvidence present");
  return {
    status: findings.length === 0 ? "pass" : "fail",
    findings,
    metrics: {
      baselineReviewFindings: baseline.findingCount,
      guidedReviewFindings: skillGuided.findingCount,
      baselineReviewErrors: baseline.errorCount,
      guidedReviewErrors: skillGuided.errorCount,
      baselineReviewWarnings: baseline.warningCount,
      guidedReviewWarnings: skillGuided.warningCount,
      guidedReviewForbiddenFields: skillGuided.forbiddenFieldCount,
      guidedReviewMissingEvidence: skillGuided.missingEvidenceCount,
    },
  };
}

export function buildSufficientContextGate(review: ReviewRunSummary): EvalGateResult {
  const materialFindings = review.findings.filter((finding) => finding.severity === "warning" || finding.severity === "error");
  const missing = materialFindings.filter((finding) => !hasSufficientReviewEvidence(finding));
  return {
    status: missing.length === 0 ? "pass" : "fail",
    findings: missing.map((finding) => `insufficient review evidence: ${finding.type} on ${finding.slideId ?? "deck"}`),
    metrics: {
      reviewFindingsChecked: materialFindings.length,
      coveredReviewFindings: materialFindings.length - missing.length,
      missingReviewEvidence: missing.length,
    },
  };
}

export function buildReviewEvidenceRetrievalPlan(
  review: ReviewRunSummary,
  options: EvidenceArtifactRetryOptions = {},
): ReviewEvidenceRetrievalPlan {
  return {
    corpusCatalog: REVIEW_EVIDENCE_CORPUS_CATALOG,
    routes: review.findings.map((finding) => routeReviewFindingEvidence(finding, options)),
  };
}

function summarizeReviewFindings(findings: ReviewFinding[]): ReviewRunSummary {
  return {
    findingCount: findings.length,
    errorCount: findings.filter((finding) => finding.severity === "error").length,
    warningCount: findings.filter((finding) => finding.severity === "warning").length,
    forbiddenFieldCount: findings.filter(reviewFindingHasFinalDecisionField).length,
    missingEvidenceCount: findings.filter((finding) => !finding.evidence || Object.keys(finding.evidence).length === 0).length,
    findings,
  };
}

function routeReviewFindingEvidence(
  finding: ReviewFinding,
  options: EvidenceArtifactRetryOptions,
): ReviewEvidenceRoute {
  const evidence = asRecord(finding.evidence);
  const route = new Set<EvidenceCorpusEntry["id"]>();
  const coveredKeys: string[] = [];
  if (evidence) {
    if (hasAnyEvidenceKey(evidence, ["sourceSlideId", "blockIds", "evidenceBlockIds", "supportBlockIds", "captionBlockId", "evidenceBlockId"])) {
      route.add("presentation-ir");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["sourceSlideId", "blockIds", "evidenceBlockIds", "supportBlockIds", "captionBlockId", "evidenceBlockId"]));
    }
    if (hasAnyEvidenceKey(evidence, ["layoutSlideIds", "regionIds", "evidenceLayoutSlideId", "captionLayoutSlideId"])) {
      route.add("layout-ir");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["layoutSlideIds", "regionIds", "evidenceLayoutSlideId", "captionLayoutSlideId"]));
    }
    if (hasAnyEvidenceKey(evidence, ["objectKind", "role"])) {
      route.add("pptx-object-map");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["objectKind", "role"]));
    }
    if (hasAnyEvidenceKey(evidence, ["screenshotPath", "renderedImagePath", "contactSheetPath"])) {
      route.add("rendered-artifact");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["screenshotPath", "renderedImagePath", "contactSheetPath"]));
    }
    if (hasAnyEvidenceKey(evidence, ["selectionPath", "userInstruction"])) {
      route.add("selection-context");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["selectionPath", "userInstruction"]));
    }
    if (hasAnyEvidenceKey(evidence, ["cssDeclaration", "feasibility", "riskLevel"])) {
      route.add("design-analysis");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["cssDeclaration", "feasibility", "riskLevel"]));
    }
    if (hasAnyEvidenceKey(evidence, ["diagramId", "nodeCount", "edgeCount", "accentCount"])) {
      route.add("diagram-metrics");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["diagramId", "nodeCount", "edgeCount", "accentCount"]));
    }
    if (hasAnyEvidenceKey(evidence, ["accentedObjects", "totalObjects", "pathCount", "distinctCount", "visualTreatmentCount", "ratio", "budget", "mdprFindingId", "mdprFindingType"])) {
      route.add("mdpr-manifest");
      coveredKeys.push(...presentEvidenceKeys(evidence, ["accentedObjects", "totalObjects", "pathCount", "distinctCount", "visualTreatmentCount", "ratio", "budget", "mdprFindingId", "mdprFindingType"]));
    }
  }
  const candidateCorpusIds = [...route];
  const missingFacts = candidateCorpusIds.length > 0
    ? []
    : [evidence ? "no routed evidence corpus" : "missing evidence object"];
  const status = missingFacts.length === 0 ? "covered" : "missing";
  const feedbackQueries = status === "missing" ? followUpQueriesForFinding(finding, evidence) : [];
  return {
    findingType: finding.type,
    severity: finding.severity,
    ...(finding.slideId ? { slideId: finding.slideId } : {}),
    candidateCorpusIds,
    coveredEvidenceKeys: [...new Set(coveredKeys)].sort(),
    missingFacts,
    feedbackQueries,
    artifactAttempts: buildArtifactAttempts(feedbackQueries, options),
    status,
  };
}

function buildArtifactAttempts(
  feedbackQueries: ReviewEvidenceFeedbackQuery[],
  options: EvidenceArtifactRetryOptions,
): ReviewEvidenceArtifactAttempt[] {
  if (!options.artifactRoot || feedbackQueries.length === 0) return [];
  const exists = options.exists ?? existsSync;
  const attempts: ReviewEvidenceArtifactAttempt[] = [];
  for (const feedbackQuery of feedbackQueries) {
    for (const targetCorpusId of feedbackQuery.targetCorpusIds) {
      const candidatePaths = candidatePathsForEvidenceCorpus(options.artifactRoot, targetCorpusId);
      const foundPaths = candidatePaths.filter((path) => exists(path));
      attempts.push({
        query: feedbackQuery.query,
        targetCorpusId,
        candidatePaths,
        foundPaths,
        status: foundPaths.length > 0 ? "found" : "missing",
      });
    }
  }
  return attempts;
}

function candidatePathsForEvidenceCorpus(
  artifactRoot: string,
  corpusId: EvidenceCorpusEntry["id"],
): string[] {
  const relativePaths: Record<EvidenceCorpusEntry["id"], string[]> = {
    "mdpr-manifest": ["mdpresent-manifest.json", "manifest.json"],
    "presentation-ir": ["presentation-ir.json", "presentation.json"],
    "layout-ir": ["layout-ir.json", "layout.json"],
    "pptx-object-map": ["mdpr-pptx-object-map.json", "pptx-object-map.json", "mdpresent-manifest.json"],
    "rendered-artifact": ["contact-sheet.png", "deck.png", "slides/slide-1.png", "png/slide-1.png"],
    "selection-context": ["selection-context.json", "review/selection-context.json"],
    "design-analysis": ["html-design-analysis.json", "theme-candidate.json", "design-analysis.json"],
    "diagram-metrics": ["diagram-metrics.json", "mdpresent-manifest.json"],
  };
  return relativePaths[corpusId].map((relativePath) => normalizeReportPath(join(artifactRoot, relativePath)));
}

function normalizeReportPath(path: string): string {
  return path.replace(/\\/g, "/");
}

function followUpQueriesForFinding(
  finding: ReviewFinding,
  evidence: Record<string, unknown> | undefined,
): ReviewEvidenceFeedbackQuery[] {
  const slide = finding.slideId ?? "deck";
  const type = finding.type.toUpperCase();
  if (/CAPTION|ORPHAN|CLAIMLESS|SECTION|RHYTHM|GROUPING/.test(type)) {
    return [{
      query: `Collect source block ids, layout slide ids, and region assignments for ${finding.type} on ${slide}.`,
      targetCorpusIds: ["presentation-ir", "layout-ir"],
      reason: evidence ? "The finding evidence does not identify the source/layout objects needed for coherence review." : "The finding has no evidence object.",
    }];
  }
  if (/NON_EDITABLE|OBJECT|RASTER/.test(type)) {
    return [{
      query: `Inspect PPTX object-map entries and renderer metadata for ${finding.type} on ${slide}.`,
      targetCorpusIds: ["pptx-object-map", "mdpr-manifest"],
      reason: evidence ? "The finding evidence does not identify the rendered object contract." : "The finding has no evidence object.",
    }];
  }
  if (/PPT_EFFECT|DESIGN|CSS|TOKEN|HEX|RADIUS|SHADOW|EFFECT|ACCENT/.test(type)) {
    return [{
      query: `Collect design-analysis declarations and manifest metrics for ${finding.type} on ${slide}.`,
      targetCorpusIds: ["design-analysis", "mdpr-manifest"],
      reason: evidence ? "The finding evidence does not identify the design token or manifest metric source." : "The finding has no evidence object.",
    }];
  }
  if (/DIAGRAM/.test(type)) {
    return [{
      query: `Collect diagram metrics and layout placement evidence for ${finding.type} on ${slide}.`,
      targetCorpusIds: ["diagram-metrics", "layout-ir"],
      reason: evidence ? "The finding evidence does not identify diagram metrics or layout placement." : "The finding has no evidence object.",
    }];
  }
  return [{
    query: `Collect source slide, block, layout, object-map, or rendered artifact evidence for ${finding.type} on ${slide}.`,
    targetCorpusIds: ["presentation-ir", "layout-ir", "pptx-object-map", "rendered-artifact"],
    reason: evidence ? "The finding has no routed evidence corpus yet." : "The finding has no evidence object.",
  }];
}

function hasSufficientReviewEvidence(finding: ReviewFinding): boolean {
  const evidence = asRecord(finding.evidence);
  if (!evidence || Object.keys(evidence).length === 0) return false;
  return hasNonEmptyArray(evidence, "blockIds")
    || hasNonEmptyArray(evidence, "evidenceBlockIds")
    || hasNonEmptyArray(evidence, "supportBlockIds")
    || hasNonEmptyArray(evidence, "layoutSlideIds")
    || hasNonEmptyArray(evidence, "regionIds")
    || hasNonEmptyArray(evidence, "sampleLocations")
    || hasString(evidence, "sourceSlideId")
    || hasString(evidence, "evidenceBlockId")
    || hasString(evidence, "captionBlockId")
    || hasString(evidence, "screenshotPath")
    || hasString(evidence, "selectionPath")
    || hasString(evidence, "cssDeclaration")
    || hasString(evidence, "diagramId")
    || hasString(evidence, "objectKind")
    || hasManifestMetricEvidence(evidence);
}

function hasManifestMetricEvidence(evidence: Record<string, unknown>): boolean {
  return [
    "accentedObjects",
    "totalObjects",
    "pathCount",
    "distinctCount",
    "visualTreatmentCount",
    "nodeCount",
    "edgeCount",
    "accentCount",
    "riskLevel",
    "feasibility",
  ].some((key) => evidence[key] !== undefined);
}

function hasNonEmptyArray(record: Record<string, unknown>, key: string): boolean {
  return Array.isArray(record[key]) && (record[key] as unknown[]).length > 0;
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key].length > 0;
}

function hasAnyEvidenceKey(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = record[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
  });
}

function presentEvidenceKeys(record: Record<string, unknown>, keys: string[]): string[] {
  return keys.filter((key) => {
    const value = record[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
  });
}

function prepareEvalHints(
  input: MdprSkillEvalInput & { sourceSha256: string },
  guidedOutDir: string,
  deps: EvalDeps,
): { hintsPath?: string; gates: { schemaSync: EvalGateResult; boundary: EvalGateResult } } {
  if (input.hintsPath) {
    const manifest = JSON.parse((deps.readText ?? ((path: string) => readFileSync(path, "utf-8")))(input.hintsPath));
    const gates = validateEvalHints(manifest, input.sourceSha256);
    assertHintGatesPass(gates);
    return { hintsPath: input.hintsPath, gates };
  }
  if (!input.hintManifest && (input.baselinePackPath || input.guidedPackPath)) {
    return {
      gates: {
        schemaSync: { status: "pass", findings: [], metrics: { hintRail: "not-applicable" } },
        boundary: { status: "pass", findings: [] },
      },
    };
  }
  const manifest = input.hintManifest ?? {
    schemaVersion: "mdpr-agent-hint-v1" as const,
    sourceSha256: input.sourceSha256,
    generatedBy: "mdpr-skill" as const,
    generatedAt: new Date(0).toISOString(),
    hints: [],
  };
  const gates = validateEvalHints(manifest, input.sourceSha256);
  assertHintGatesPass(gates);
  const mkdirp = deps.mkdirp ?? ((dir: string) => mkdirSync(dir, { recursive: true }));
  const writeText = deps.writeText ?? ((target: string, value: string) => writeFileSync(target, value, "utf-8"));
  const hintsPath = join(guidedOutDir, "agent-hint.json");
  mkdirp(dirname(hintsPath));
  writeText(hintsPath, JSON.stringify(manifest, null, 2) + "\n");
  return { hintsPath, gates };
}

export function validateEvalHints(value: unknown, sourceSha256: string): { schemaSync: EvalGateResult; boundary: EvalGateResult } {
  const schemaFindings: string[] = [];
  const boundaryFindings: string[] = [];
  try {
    assertNoForbiddenFields(value);
  } catch (error) {
    boundaryFindings.push(error instanceof Error ? error.message : String(error));
  }
  const manifest = value as Partial<AgentHintManifest>;
  if (!value || typeof value !== "object") schemaFindings.push("hint manifest must be an object");
  if (manifest.schemaVersion !== "mdpr-agent-hint-v1") schemaFindings.push("expected schemaVersion mdpr-agent-hint-v1");
  if (manifest.sourceSha256 !== sourceSha256) schemaFindings.push("sourceSha256 does not match baseline source");
  if (manifest.generatedBy !== "mdpr-skill") schemaFindings.push("generatedBy must be mdpr-skill");
  if (!manifest.generatedAt) schemaFindings.push("generatedAt is required");
  if (!Array.isArray(manifest.hints)) schemaFindings.push("hints must be an array");
  return {
    schemaSync: {
      status: schemaFindings.length === 0 ? "pass" : "fail",
      findings: schemaFindings,
      metrics: { sourceSha256Matches: manifest.sourceSha256 === sourceSha256 },
    },
    boundary: {
      status: boundaryFindings.length === 0 ? "pass" : "fail",
      findings: boundaryFindings,
    },
  };
}

function assertHintGatesPass(gates: { schemaSync: EvalGateResult; boundary: EvalGateResult }): void {
  const findings = [...gates.schemaSync.findings, ...gates.boundary.findings];
  if (findings.length > 0) throw new Error(`hint gate failed: ${findings.join("; ")}`);
}

function collectEvalMetrics(
  manifest: Record<string, unknown>,
  collectMetrics: typeof collectMdprMetrics,
  buildMs: number,
): MdprRunMetrics {
  const base = collectMetrics(manifest);
  const visual = asRecord(manifest.visualValidation) ?? asRecord(manifest.visual) ?? {};
  const performance = asRecord(manifest.performance) ?? {};
  const diagnostics = Array.isArray(manifest.diagnostics) ? manifest.diagnostics as Array<Record<string, unknown>> : [];
  return {
    ...base,
    buildMs: numberValue(performance.buildMs) ?? buildMs,
    outputBytes: numberValue(manifest.outputBytes) ?? numberValue(performance.outputBytes),
    minFontPt: firstNumber(visual, ["minFontPt", "minimumTextSize", "minFontSizeObservedPt"]),
    textClipRiskCount: firstNumber(visual, ["textClipRiskCount", "textClippingCount"]) ?? countDiagnostics(diagnostics, "clip"),
    contrastFailures: firstNumber(visual, ["contrastFailures", "contrastFailureCount"]) ?? countDiagnostics(diagnostics, "contrast"),
    connectorWarnings: firstNumber(visual, ["connectorWarnings", "connectorWarningCount"]) ?? countDiagnostics(diagnostics, "connector"),
  };
}

function extractRunProfile(manifest: Record<string, unknown>): MdprRunProfile | undefined {
  const profile = asRecord(manifest.profile) ?? asRecord(manifest.performanceProfile);
  const performance = asRecord(manifest.performance);
  const pdf = asRecord(manifest.pdf);
  const renderer = asRecord(manifest.renderer);
  const result: MdprRunProfile = {
    ...(profile ? { profile } : {}),
    ...(performance ? { performance } : {}),
    ...(pdf ? { pdf } : {}),
    ...(renderer ? { renderer } : {}),
  };
  return Object.keys(result).length > 0 ? result : undefined;
}

function validateHintManifest(value: unknown, sourceSha256: string): asserts value is AgentHintManifest {
  assertNoForbiddenFields(value);
  const manifest = value as Partial<AgentHintManifest>;
  if (manifest.schemaVersion !== "mdpr-agent-hint-v1") {
    throw new Error("schemaSync gate failed: expected mdpr-agent-hint-v1");
  }
  if (manifest.sourceSha256 !== sourceSha256) {
    throw new Error("schemaSync gate failed: stale sourceSha256");
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = numberValue(record[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function countDiagnostics(diagnostics: Array<Record<string, unknown>>, needle: string): number {
  return diagnostics.filter((item) => String(item.code ?? item.type ?? "").toLowerCase().includes(needle)).length;
}
