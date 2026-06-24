import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  collectMdprMetrics,
  loadMdprArtifacts,
  runMdprBuild,
  type MdprContext,
  type MdprRunInput,
  type MdprRunResult,
} from "../../mdpr-adapter/src/index";
import { assertNoForbiddenFields, type AgentHintManifest } from "../../hints-core/src/index";

export type MdprRunMetrics = {
  overflowCount: number;
  coherenceWarnings: number;
  visualErrors: number;
  buildMs?: number;
  slideCount?: number;
};

export type MdprSkillComparison = {
  baseline: MdprRunMetrics;
  skillGuided: MdprRunMetrics;
  regressions: string[];
};

export type EvalRunArtifacts = {
  run: MdprRunResult;
  outDir: string;
  manifestPath: string;
  sourceSha256: string;
  metrics: MdprRunMetrics;
};

export type MdprSkillEvalInput = Omit<MdprRunInput, "outDir" | "hintsPath"> & {
  outDir: string;
  baselineOutDir?: string;
  guidedOutDir?: string;
  hintsPath?: string;
  hintManifest?: AgentHintManifest;
  reportPath?: string;
};

export type MdprSkillEvalReport = {
  schemaVersion: "mdpr-skill-eval-v1";
  deck: string;
  baseline: EvalRunArtifacts;
  skillGuided: EvalRunArtifacts;
  gates: {
    schemaSync: "pass" | "fail";
    boundary: "pass" | "fail";
    regression: "pass" | "fail";
  };
  hintsPath?: string;
  regressions: string[];
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

export function compareMdprRuns(baseline: MdprRunMetrics, skillGuided: MdprRunMetrics): MdprSkillComparison {
  const regressions: string[] = [];
  if (skillGuided.overflowCount > baseline.overflowCount) regressions.push("overflowCount increased");
  if (skillGuided.coherenceWarnings > baseline.coherenceWarnings) regressions.push("coherenceWarnings increased");
  if (skillGuided.visualErrors > baseline.visualErrors) regressions.push("visualErrors increased");
  if (baseline.buildMs !== undefined && skillGuided.buildMs !== undefined && skillGuided.buildMs > baseline.buildMs * 1.2) {
    regressions.push("buildMs regressed by more than 20%");
  }
  return { baseline, skillGuided, regressions };
}

export function regressionGate(comparison: MdprSkillComparison): "pass" | "fail" {
  return comparison.regressions.length === 0 ? "pass" : "fail";
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
): EvalRunArtifacts & { hintsPath: string } {
  const outDir = input.guidedOutDir ?? join(input.outDir, "guided");
  const hintsPath = prepareHintsPath(input, outDir, deps);
  const artifact = runEvalBuild({
    ...input,
    outDir,
    hintsPath,
  }, deps);
  return { ...artifact, hintsPath };
}

export function runMdprSkillEval(input: MdprSkillEvalInput, deps: EvalDeps = {}): MdprSkillEvalReport {
  const baseline = runBaseline(input, deps);
  const skillGuided = runSkillGuided({ ...input, sourceSha256: baseline.sourceSha256 }, deps);
  const comparison = compareMdprRuns(baseline.metrics, skillGuided.metrics);
  const report: MdprSkillEvalReport = {
    schemaVersion: "mdpr-skill-eval-v1",
    deck: input.deckPath,
    baseline,
    skillGuided,
    gates: {
      schemaSync: "pass",
      boundary: "pass",
      regression: regressionGate(comparison),
    },
    hintsPath: skillGuided.hintsPath,
    regressions: comparison.regressions,
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
  if (run.exitCode !== 0) {
    throw new Error(`MDPR build failed (${run.exitCode}): ${run.stderr || run.stdout}`);
  }
  const outDir = run.outDir ?? resolve(input.outDir ?? ".");
  const context: MdprContext = loadArtifacts(outDir);
  const metrics = { ...collectMetrics(context.manifest), buildMs };
  return {
    run,
    outDir,
    manifestPath: run.manifestPath ?? join(outDir, "mdpresent-manifest.json"),
    sourceSha256: context.sourceSha256,
    metrics,
  };
}

function prepareHintsPath(
  input: MdprSkillEvalInput & { sourceSha256: string },
  guidedOutDir: string,
  deps: EvalDeps,
): string {
  if (input.hintsPath) {
    const manifest = JSON.parse((deps.readText ?? ((path: string) => readFileSync(path, "utf-8")))(input.hintsPath));
    validateHintManifest(manifest, input.sourceSha256);
    return input.hintsPath;
  }
  if (!input.hintManifest) {
    throw new Error("runSkillGuided requires hintsPath or hintManifest");
  }
  validateHintManifest(input.hintManifest, input.sourceSha256);
  const mkdirp = deps.mkdirp ?? ((dir: string) => mkdirSync(dir, { recursive: true }));
  const writeText = deps.writeText ?? ((target: string, value: string) => writeFileSync(target, value, "utf-8"));
  const hintsPath = join(guidedOutDir, "agent-hint.json");
  mkdirp(dirname(hintsPath));
  writeText(hintsPath, JSON.stringify(input.hintManifest, null, 2) + "\n");
  return hintsPath;
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
