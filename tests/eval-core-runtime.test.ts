import assert from "node:assert/strict";
import test from "node:test";
import {
  MdprAdapterError,
} from "../packages/mdpr-adapter/src/index";
import {
  buildReviewEvidenceRetrievalPlan,
  buildSufficientContextGate,
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

test("buildSufficientContextGate rejects weak review evidence despite non-empty objects", () => {
  const gate = buildSufficientContextGate({
    findingCount: 2,
    errorCount: 0,
    warningCount: 2,
    forbiddenFieldCount: 0,
    missingEvidenceCount: 0,
    findings: [
      {
        severity: "warning",
        type: "SUPPORTED_FINDING",
        slideId: "slide-1",
        evidence: {
          sourceSlideId: "source-slide-1",
          blockIds: ["b1"],
          layoutSlideIds: ["layout-1"],
        },
      },
      {
        severity: "warning",
        type: "WEAK_FINDING",
        slideId: "slide-2",
        evidence: {
          reason: "looks wrong",
        },
      },
    ],
  });

  assert.equal(gate.status, "fail");
  assert.deepEqual(gate.findings, ["insufficient review evidence: WEAK_FINDING on slide-2"]);
  assert.equal(gate.metrics?.coveredReviewFindings, 1);
  assert.equal(gate.metrics?.missingReviewEvidence, 1);
});

test("buildReviewEvidenceRetrievalPlan routes findings to concrete evidence corpora", () => {
  const plan = buildReviewEvidenceRetrievalPlan({
    findingCount: 3,
    errorCount: 1,
    warningCount: 2,
    forbiddenFieldCount: 0,
    missingEvidenceCount: 0,
    findings: [
      {
        severity: "warning",
        type: "BLOCK_LAYOUT_FINDING",
        slideId: "slide-1",
        evidence: {
          sourceSlideId: "source-slide-1",
          blockIds: ["b1"],
          layoutSlideIds: ["layout-1"],
          regionIds: ["main"],
        },
      },
      {
        severity: "error",
        type: "OBJECT_MAP_FINDING",
        slideId: "slide-2",
        evidence: {
          objectKind: "raster-image",
          role: "table",
          blockIds: ["table-1"],
        },
      },
      {
        severity: "warning",
        type: "WEAK_FINDING",
        slideId: "slide-3",
        evidence: {
          reason: "looks wrong",
        },
      },
    ],
  }, {
    artifactRoot: ".tmp/eval/guided",
    exists: (path) => path.endsWith("presentation-ir.json") || path.endsWith("mdpresent-manifest.json"),
  });

  assert.ok(plan.corpusCatalog.some((corpus) => corpus.id === "presentation-ir"));
  assert.ok(plan.corpusCatalog.some((corpus) => corpus.id === "layout-ir"));
  assert.ok(plan.corpusCatalog.some((corpus) => corpus.id === "pptx-object-map"));
  assert.equal(plan.routes.length, 3);
  assert.deepEqual(plan.routes[0].candidateCorpusIds, ["presentation-ir", "layout-ir"]);
  assert.deepEqual(plan.routes[1].candidateCorpusIds, ["presentation-ir", "pptx-object-map"]);
  assert.equal(plan.routes[2].status, "missing");
  assert.match(plan.routes[2].missingFacts.join("\n"), /no routed evidence corpus/);
  assert.deepEqual(plan.routes[2].feedbackQueries, [{
    query: "Collect source slide, block, layout, object-map, or rendered artifact evidence for WEAK_FINDING on slide-3.",
    targetCorpusIds: ["presentation-ir", "layout-ir", "pptx-object-map", "rendered-artifact"],
    reason: "The finding has no routed evidence corpus yet.",
  }]);
  assert.equal(plan.routes[2].artifactAttempts.length, 4);
  assert.deepEqual(plan.routes[2].artifactAttempts[0], {
    query: "Collect source slide, block, layout, object-map, or rendered artifact evidence for WEAK_FINDING on slide-3.",
    targetCorpusId: "presentation-ir",
    candidatePaths: [".tmp/eval/guided/presentation-ir.json", ".tmp/eval/guided/presentation.json"],
    foundPaths: [".tmp/eval/guided/presentation-ir.json"],
    status: "found",
  });
  assert.deepEqual(plan.routes[2].artifactAttempts[2].foundPaths, [".tmp/eval/guided/mdpresent-manifest.json"]);
});

test("runMdprSkillEval reports sufficientContext gate separately from review regression", () => {
  const report = runMdprSkillEval({
    deckPath: "deck.md",
    outDir: ".tmp/eval-sufficient-context",
    thresholds: { maxBuildMsMultiplier: 10 },
  }, {
    now: () => 0,
    mkdirp: () => undefined,
    writeText: () => undefined,
    runBuild: (input) => ({
      command: ["mdpresent", "build"],
      cwd: process.cwd(),
      exitCode: 0,
      stdout: "",
      stderr: "",
      outDir: input.outDir,
      manifestPath: `${input.outDir}/mdpresent-manifest.json`,
    }),
    loadArtifacts: (outDir) => ({
      sourceSha256,
      manifest: {
        metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 1 },
        ...(outDir.includes("guided") ? { accentUsage: { accentedObjects: 9, totalObjects: 10 } } : {}),
      },
      presentation: { slides: [] },
      layout: { slides: [] },
    }),
    collectMetrics: (manifest) => {
      const metrics = manifest.metrics as MdprRunMetrics | undefined;
      assert.ok(metrics);
      return metrics;
    },
    exists: (path) => path.endsWith("guided/mdpresent-manifest.json"),
  });

  assert.equal(report.gates.review.status, "fail");
  assert.equal(report.gates.sufficientContext.status, "pass");
  assert.equal(report.gates.sufficientContext.metrics?.coveredReviewFindings, 1);
  assert.equal(report.evidenceRetrieval.skillGuided.routes.length, 1);
  assert.deepEqual(report.evidenceRetrieval.skillGuided.routes[0].candidateCorpusIds, ["mdpr-manifest"]);
  assert.equal(report.evidenceRetrieval.baseline.routes.length, 0);
  assert.equal(report.evidenceRetrieval.skillGuided.routes[0].artifactAttempts.length, 0);
  assert.equal(report.summary.overallStatus, "fail");
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
            performance: { outputBytes: 1300, renderPptxMs: 80 },
            profile: { mode: "guided" },
          }
        : {
            metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 3 },
            visualValidation: { minFontPt: 10, textClipRiskCount: 0 },
            performance: { outputBytes: 1000, renderPptxMs: 60 },
            profile: { mode: "baseline" },
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
  assert.equal(report.baseline.profile?.profile?.mode, "baseline");
  assert.equal(report.skillGuided.profile?.profile?.mode, "guided");
  assert.equal(report.skillGuided.profile?.performance?.renderPptxMs, 80);
  assert.match(written.get(".tmp/eval/report.json") ?? "", /"overallStatus": "fail"/);
});

test("runMdprSkillEval compares baseline against a guided approved pack without requiring agent hints", () => {
  const buildInputs: Array<{ outDir?: string; hintsPath?: string; packPath?: string }> = [];
  const written = new Map<string, string>();

  const report = runMdprSkillEval({
    deckPath: "deck.md",
    outDir: ".tmp/eval-pack",
    guidedPackPath: ".tmp/mdpr.pack.json",
    thresholds: { maxBuildMsMultiplier: 10 },
  }, {
    now: () => 0,
    mkdirp: () => undefined,
    writeText: (path, value) => {
      written.set(path, value);
    },
    runBuild: (input) => {
      buildInputs.push({ outDir: input.outDir, hintsPath: input.hintsPath, packPath: input.packPath });
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
      manifest: {
        metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 2 },
        pack: outDir.includes("guided") ? { source: { path: ".tmp/mdpr.pack.json" }, validation: { valid: true } } : null,
      },
    }),
    collectMetrics: (manifest) => {
      const metrics = manifest.metrics as MdprRunMetrics | undefined;
      assert.ok(metrics);
      return metrics;
    },
  });

  assert.equal(buildInputs.length, 2);
  assert.equal(buildInputs[0].packPath, undefined);
  assert.equal(buildInputs[1].packPath, ".tmp/mdpr.pack.json");
  assert.equal(buildInputs[1].hintsPath, undefined);
  assert.equal(written.size, 0);
  assert.equal(report.hintsPath, undefined);
  assert.equal(report.guidedPackPath, ".tmp/mdpr.pack.json");
  assert.equal(report.gates.schemaSync.status, "pass");
  assert.equal(report.gates.boundary.status, "pass");
  assert.equal(report.summary.overallStatus, "pass");
});

test("runMdprSkillEval attaches review summaries and fails on review regressions", () => {
  const report = runMdprSkillEval({
    deckPath: "deck.md",
    outDir: ".tmp/eval-review",
    thresholds: { maxBuildMsMultiplier: 10 },
    hintManifest: {
      schemaVersion: "mdpr-agent-hint-v1",
      sourceSha256,
      generatedBy: "mdpr-skill",
      generatedAt: "2026-06-24T00:00:00Z",
      hints: [{ slideId: "slide-1", confidence: 0.8, intentCandidate: "evidence" }],
    },
  }, {
    now: () => 0,
    mkdirp: () => undefined,
    writeText: () => undefined,
    runBuild: (input) => ({
      command: ["mdpresent", "build"],
      cwd: process.cwd(),
      exitCode: 0,
      stdout: "",
      stderr: "",
      outDir: input.outDir,
      manifestPath: `${input.outDir}/mdpresent-manifest.json`,
    }),
    loadArtifacts: (outDir) => outDir.includes("guided")
      ? {
          sourceSha256,
          manifest: {
            metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 1 },
            pptxObjects: [
              { slideId: "layout-guided", objectKind: "raster-image", role: "table", blockIds: ["table-1"] },
            ],
          },
          presentation: {
            slides: [
              {
                id: "slide-guided",
                intent: "evidence",
                headingPath: ["Evidence"],
                blocks: [
                  { id: "table-1", type: "table", text: "Metrics" },
                ],
              },
            ],
          },
          layout: {
            slides: [
              {
                id: "layout-guided",
                sourceSlideId: "slide-guided",
                layout: { preset: "table-focus" },
                regions: [{ id: "table", role: "table", blockIds: ["table-1"] }],
              },
            ],
          },
        }
      : {
          sourceSha256,
          manifest: { metrics: { overflowCount: 0, coherenceWarnings: 0, visualErrors: 0, slideCount: 1 } },
          presentation: {
            slides: [
              {
                id: "slide-baseline",
                intent: "evidence",
                headingPath: ["Evidence"],
                blocks: [
                  { id: "claim-1", type: "paragraph", text: "Activation is the main bottleneck." },
                  { id: "chart-1", type: "chart", text: "Activation funnel" },
                  { id: "caption-1", type: "paragraph", text: "Figure 1. Activation drops by stage." },
                ],
              },
            ],
          },
          layout: {
            slides: [
              {
                id: "layout-baseline",
                sourceSlideId: "slide-baseline",
                layout: { preset: "chart-table" },
                regions: [
                  { id: "claim", role: "body", blockIds: ["claim-1"] },
                  { id: "chart", role: "chart", blockIds: ["chart-1"] },
                  { id: "caption", role: "body", blockIds: ["caption-1"] },
                ],
              },
            ],
          },
        },
    collectMetrics: (manifest) => {
      const metrics = manifest.metrics as MdprRunMetrics | undefined;
      assert.ok(metrics);
      return metrics;
    },
  });

  assert.equal(report.reviews.baseline.findingCount, 0);
  assert.equal(report.reviews.skillGuided.errorCount, 1);
  assert.equal(report.reviews.skillGuided.warningCount, 1);
  assert.equal(report.gates.review.status, "fail");
  assert.match(report.gates.review.findings.join("\n"), /reviewErrors increased/);
  assert.equal(report.summary.overallStatus, "fail");
});

test("runMdprSkillEval preserves adapter command failures as typed errors", () => {
  assert.throws(() => runMdprSkillEval({
    deckPath: "deck.md",
    outDir: ".tmp/eval-error",
    hintManifest: {
      schemaVersion: "mdpr-agent-hint-v1",
      sourceSha256,
      generatedBy: "mdpr-skill",
      generatedAt: "2026-06-24T00:00:00Z",
      hints: [{ slideId: "slide-1", confidence: 0.8 }],
    },
  }, {
    runBuild: (input) => ({
      command: ["mdpresent", "build"],
      cwd: process.cwd(),
      exitCode: 7,
      stdout: "",
      stderr: "boom",
      outDir: input.outDir,
      manifestPath: `${input.outDir}/mdpresent-manifest.json`,
    }),
  }), (error) => {
    assert.ok(error instanceof MdprAdapterError);
    assert.equal(error.kind, "command-failed");
    assert.match(error.message, /MDPR command failed/);
    return true;
  });
});
