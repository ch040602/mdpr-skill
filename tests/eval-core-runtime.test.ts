import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRegressionGate,
  runMdprSkillEval,
  validateEvalHints,
  type MdprRunMetrics,
} from "../packages/eval-core/src/index";

const sourceSha256 = "a".repeat(64);

test("validateEvalHints reports schema and boundary findings", () => {
  const gates = validateEvalHints({
    schemaVersion: "mdpr-agent-hint-v1",
    sourceSha256,
    generatedBy: "mdpr-skill",
    generatedAt: "2026-06-24T00:00:00Z",
    hints: [{ slideId: "slide-1", confidence: 0.8, x: 10 }],
  }, sourceSha256);

  assert.equal(gates.schemaSync.status, "pass");
  assert.equal(gates.boundary.status, "fail");
  assert.match(gates.boundary.findings.join("\n"), /forbidden final-decision field/);
});

test("buildRegressionGate checks quality and performance thresholds", () => {
  const baseline: MdprRunMetrics = {
    overflowCount: 0,
    coherenceWarnings: 0,
    visualErrors: 0,
    buildMs: 100,
    slideCount: 10,
    outputBytes: 1000,
    minFontPt: 10,
    textClipRiskCount: 0,
    contrastFailures: 0,
    connectorWarnings: 0,
  };
  const guided: MdprRunMetrics = {
    ...baseline,
    buildMs: 140,
    slideCount: 14,
    outputBytes: 1600,
    minFontPt: 8,
    textClipRiskCount: 1,
  };

  const gate = buildRegressionGate(baseline, guided);

  assert.equal(gate.status, "fail");
  assert.deepEqual(gate.findings, [
    "textClipRiskCount increased",
    "buildMs regressed beyond 1.2x",
    "slideCount increased beyond 2",
    "outputBytes increased beyond 1.35x",
    "minFontPt dropped by more than 1pt",
  ]);
});

test("runMdprSkillEval executes baseline and guided builds with injected MDPR adapter", () => {
  const buildInputs: Array<{ outDir?: string; hintsPath?: string }> = [];
  const written = new Map<string, string>();
  let now = 0;

  const report = runMdprSkillEval({
    deckPath: "deck.md",
    outDir: ".tmp/eval",
    hintManifest: {
      schemaVersion: "mdpr-agent-hint-v1",
      sourceSha256,
      generatedBy: "mdpr-skill",
      generatedAt: "2026-06-24T00:00:00Z",
      hints: [{ slideId: "slide-1", confidence: 0.8, intentCandidate: "summary" }],
    },
    reportPath: ".tmp/eval/report.json",
  }, {
    now: () => {
      now += 50;
      return now;
    },
    mkdirp: () => undefined,
    writeText: (path, value) => {
      written.set(path, value);
    },
    runBuild: (input) => {
      buildInputs.push({ outDir: input.outDir, hintsPath: input.hintsPath });
      return {
        command: ["mdpresent", "build"],
        cwd: process.cwd(),
        exitCode: 0,
        stdout: "",
        stderr: "",
        outDir: input.outDir,
        manifestPath: `${input.outDir}/mdpresent-manifest.json`,
      };
    },
    loadArtifacts: (outDir) => ({
      sourceSha256,
      manifest: outDir.includes("guided")
        ? {
            metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 3 },
            visualValidation: { minFontPt: 9, textClipRiskCount: 1 },
            performance: { outputBytes: 1300 },
          }
        : {
            metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 3 },
            visualValidation: { minFontPt: 10, textClipRiskCount: 0 },
            performance: { outputBytes: 1000 },
          },
    }),
    collectMetrics: (manifest) => {
      const metrics = manifest.metrics as MdprRunMetrics | undefined;
      assert.ok(metrics);
      return metrics;
    },
  });

  assert.equal(buildInputs.length, 2);
  assert.equal(buildInputs[0].hintsPath, undefined);
  assert.match(buildInputs[1].hintsPath ?? "", /agent-hint\.json$/);
  assert.equal(report.schemaVersion, "mdpr-skill-eval-v1");
  assert.equal(report.gates.schemaSync.status, "pass");
  assert.equal(report.gates.boundary.status, "pass");
  assert.equal(report.gates.regression.status, "fail");
  assert.equal(report.summary.overallStatus, "fail");
  assert.match(written.get(".tmp/eval/report.json") ?? "", /"overallStatus": "fail"/);
});
