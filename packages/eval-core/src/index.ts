import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  assertMdprRunSucceeded,
  collectMdprMetrics,
  loadMdprArtifacts,
  runMdprBuild,
  type MdprContext,
  type MdprRunInput,
  type MdprRunResult,
} from "../../mdpr-adapter/src/index";
import { assertNoForbiddenFields, type AgentHintManifest } from "../../hints-core/src/index";
import {
  reviewCoherence,
  reviewFindingHasFinalDecisionField,
  reviewVisualPolicy,
  type ReviewFinding,
} from "../../review-core/src/index";

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

export type MdprSkillEvalInput = Omit<MdprRunInput, "outDir" | "hintsPath"> & {
  outDir: string;
  baselineOutDir?: string;
  guidedOutDir?: string;
  hintsPath?: string;
  hintManifest?: AgentHintManifest;
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
  skillGuided: EvalRunArtifacts & { hintsPath: string };
  gates: {
    schemaSync: EvalGateResult;
    boundary: EvalGateResult;
    regression: EvalGateResult;
    review: EvalGateResult;
  };
  reviews: {
    baseline: ReviewRunSummary;
    skillGuided: ReviewRunSummary;
  };
  hintsPath?: string;
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
  }, deps);
}

export function runSkillGuided(
  input: MdprSkillEvalInput & { sourceSha256: string },
  deps: EvalDeps = {},
): EvalRunArtifacts & { hintsPath: string; hintGates: { schemaSync: EvalGateResult; boundary: EvalGateResult } } {
  const outDir = input.guidedOutDir ?? join(input.outDir, "guided");
  const preparedHints = prepareEvalHints(input, outDir, deps);
  const artifact = runEvalBuild({
    ...input,
    outDir,
    hintsPath: preparedHints.hintsPath,
  }, deps);
  return { ...artifact, hintsPath: preparedHints.hintsPath, hintGates: preparedHints.gates };
}

export function runMdprSkillEval(input: MdprSkillEvalInput, deps: EvalDeps = {}): MdprSkillEvalReport {
  const baseline = runBaseline(input, deps);
  const skillGuided = runSkillGuided({ ...input, sourceSha256: baseline.sourceSha256 }, deps);
  const thresholds = { ...DEFAULT_REGRESSION_THRESHOLDS, ...input.thresholds };
  const comparison = compareMdprRuns(baseline.metrics, skillGuided.metrics, thresholds);
  const reviewGate = buildReviewRegressionGate(baseline.review, skillGuided.review);
  const overallStatus = [skillGuided.hintGates.schemaSync, skillGuided.hintGates.boundary, comparison.regressionGate, reviewGate]
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
    },
    reviews: {
      baseline: baseline.review,
      skillGuided: skillGuided.review,
    },
    hintsPath: skillGuided.hintsPath,
    regressions: comparison.regressions,
    thresholds,
  };
  if (input.reportPath) emitEvalReport(report, input.reportPath, deps);
  return report;
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

function prepareEvalHints(
  input: MdprSkillEvalInput & { sourceSha256: string },
  guidedOutDir: string,
  deps: EvalDeps,
): { hintsPath: string; gates: { schemaSync: EvalGateResult; boundary: EvalGateResult } } {
  if (input.hintsPath) {
    const manifest = JSON.parse((deps.readText ?? ((path: string) => readFileSync(path, "utf-8")))(input.hintsPath));
    const gates = validateEvalHints(manifest, input.sourceSha256);
    assertHintGatesPass(gates);
    return { hintsPath: input.hintsPath, gates };
  }
  if (!input.hintManifest) {
    throw new Error("runSkillGuided requires hintsPath or hintManifest");
  }
  const gates = validateEvalHints(input.hintManifest, input.sourceSha256);
  assertHintGatesPass(gates);
  const mkdirp = deps.mkdirp ?? ((dir: string) => mkdirSync(dir, { recursive: true }));
  const writeText = deps.writeText ?? ((target: string, value: string) => writeFileSync(target, value, "utf-8"));
  const hintsPath = join(guidedOutDir, "agent-hint.json");
  mkdirp(dirname(hintsPath));
  writeText(hintsPath, JSON.stringify(input.hintManifest, null, 2) + "\n");
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
