import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { runMdprSkillEval } from "../packages/eval-core/src/index";
import { loadMdprArtifacts, type MdprContext } from "../packages/mdpr-adapter/src/index";

const mdprRoot = resolve(".cache/mdpr");
const mdprCli = join(mdprRoot, "packages/cli/dist/index.js");

test("runMdprSkillEval builds a tiny deck through the actual MDPR CLI", { skip: !existsSync(mdprCli) }, () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-e2e-"));
  try {
    const deckPath = join(workDir, "deck.md");
    writeFileSync(deckPath, [
      "# Tiny Eval Deck",
      "",
      "A compact claim for the eval-core integration fixture.",
      "",
      "- Evidence: 42%",
      "- Action: keep deterministic layout",
      "",
    ].join("\n"), "utf-8");
    const sourceSha256 = createHash("sha256").update(readFileSync(deckPath)).digest("hex");

    const report = runMdprSkillEval({
      deckPath,
      mdprPath: mdprRoot,
      outDir: join(workDir, "eval"),
      formats: ["html"],
      hintManifest: {
        schemaVersion: "mdpr-agent-hint-v1",
        sourceSha256,
        generatedBy: "mdpr-skill",
        generatedAt: "2026-06-24T00:00:00Z",
        hints: [{ slideId: "slide-1", confidence: 0.8, intentCandidate: "summary" }],
      },
      reportPath: join(workDir, "eval-report.json"),
      thresholds: { maxBuildMsMultiplier: 100 },
    });

    assert.equal(report.schemaVersion, "mdpr-skill-eval-v1");
    assert.equal(report.gates.schemaSync.status, "pass");
    assert.equal(report.gates.boundary.status, "pass");
    assert.equal(report.gates.regression.status, "pass");
    assert.equal(report.summary.overallStatus, "pass");
    assert.equal(report.baseline.metrics.overflowCount, 0);
    assert.equal(report.skillGuided.metrics.overflowCount, 0);
    assert.ok(existsSync(report.baseline.manifestPath), report.baseline.manifestPath);
    assert.ok(existsSync(report.skillGuided.manifestPath), report.skillGuided.manifestPath);

    const guidedManifest = JSON.parse(readFileSync(report.skillGuided.manifestPath, "utf-8"));
    assert.equal(guidedManifest.agentHints.enabled, true);
    assert.equal(guidedManifest.agentHints.accepted, 1);
    assert.equal(guidedManifest.agentHints.forbiddenFieldCount, 0);
    assert.ok(existsSync(join(workDir, "eval-report.json")));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runMdprSkillEval builds a guided approved pack run through the actual MDPR CLI", { skip: !existsSync(mdprCli) }, () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-e2e-pack-"));
  try {
    const deckPath = join(workDir, "deck.md");
    writeFileSync(deckPath, [
      "# Pack Eval Deck",
      "",
      "A concise claim should keep the pack comparison readable.",
      "",
      "- Baseline remains deterministic.",
      "- Guided pack changes tokenized colors only.",
      "",
    ].join("\n"), "utf-8");
    const packPath = join(workDir, "mdpr.pack.json");
    writeFileSync(packPath, JSON.stringify({
      schemaVersion: "mdpr-pack-v1",
      kind: "theme-component-pack",
      source: {
        kind: "design-md",
        sourceSha256: createHash("sha256").update("approved pack e2e").digest("hex"),
        generatedBy: "mdpr-skill",
        approved: true,
      },
      themeTokens: {
        colors: {
          background: "#111827",
          text: "#F9FAFB",
          accent: "#F97316",
          rule: "#374151",
        },
      },
      componentTokens: {},
      diagramTokens: {},
      components: [],
      pptEffectMappings: [],
      constraints: {
        editablePrimaryContent: true,
        allowRasterBackgroundOnly: true,
        maxAccentRatio: 0.18,
      },
    }, null, 2), "utf-8");

    const report = runMdprSkillEval({
      deckPath,
      mdprPath: mdprRoot,
      outDir: join(workDir, "eval"),
      formats: ["html"],
      guidedPackPath: packPath,
      reportPath: join(workDir, "eval-report.json"),
      thresholds: { maxBuildMsMultiplier: 100 },
    });

    assert.equal(report.schemaVersion, "mdpr-skill-eval-v1");
    assert.equal(report.guidedPackPath, packPath);
    assert.equal(report.gates.schemaSync.status, "pass");
    assert.equal(report.gates.boundary.status, "pass");
    assert.equal(report.gates.regression.status, "pass");
    assert.equal(report.summary.overallStatus, "pass");

    const guidedManifest = JSON.parse(readFileSync(report.skillGuided.manifestPath, "utf-8"));
    assert.equal(guidedManifest.pack.validation.valid, true);
    assert.equal(guidedManifest.pack.source.path, packPath);

    const guidedHtml = readFileSync(join(workDir, "eval", "guided", "deck.html"), "utf-8");
    assert.match(guidedHtml, /--bg: #111827;/);
    assert.match(guidedHtml, /--text: #F9FAFB;/);
    assert.match(guidedHtml, /--primary: #F97316;/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runMdprSkillEval distinguishes a review regression from a successful MDPR CLI run", { skip: !existsSync(mdprCli) }, () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-e2e-review-"));
  try {
    const deckPath = join(workDir, "deck.md");
    writeFileSync(deckPath, [
      "# Review Regression Fixture",
      "",
      "A stable claim keeps the generated evidence slide grounded.",
      "",
      "| Stage | Users |",
      "| --- | ---: |",
      "| Awareness | 8000 |",
      "| Activation | 4000 |",
      "",
      "Figure: Funnel stages remain tied to the evidence.",
      "",
    ].join("\n"), "utf-8");
    const sourceSha256 = createHash("sha256").update(readFileSync(deckPath)).digest("hex");

    const report = runMdprSkillEval({
      deckPath,
      mdprPath: mdprRoot,
      outDir: join(workDir, "eval"),
      formats: ["html"],
      hintManifest: {
        schemaVersion: "mdpr-agent-hint-v1",
        sourceSha256,
        generatedBy: "mdpr-skill",
        generatedAt: "2026-06-24T00:00:00Z",
        hints: [{ slideId: "slide-1", confidence: 0.78, intentCandidate: "evidence" }],
      },
      thresholds: { maxBuildMsMultiplier: 100 },
    }, {
      loadArtifacts: (outDir) => augmentReviewRegressionArtifacts(outDir, loadMdprArtifacts(outDir)),
    });

    assert.equal(report.baseline.run.exitCode, 0);
    assert.equal(report.skillGuided.run.exitCode, 0);
    assert.equal(report.gates.schemaSync.status, "pass");
    assert.equal(report.gates.boundary.status, "pass");
    assert.equal(report.gates.regression.status, "pass");
    assert.equal(report.gates.review.status, "fail");
    assert.equal(report.summary.overallStatus, "fail");
    assert.ok(report.reviews.skillGuided.errorCount > report.reviews.baseline.errorCount);
    assert.ok(report.gates.review.findings.includes("reviewErrors increased"));
    assert.ok(report.reviews.skillGuided.findings.some((finding) => finding.type === "NON_EDITABLE_PRIMARY_OBJECT"));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

function augmentReviewRegressionArtifacts(outDir: string, context: MdprContext): MdprContext {
  const normalizedOutDir = outDir.replace(/\\/g, "/");
  const guided = normalizedOutDir.endsWith("/guided");
  const sourceSha256 = context.sourceSha256 || String((context.manifest.source as { sha256?: unknown } | undefined)?.sha256 ?? "");
  const presentation = guided ? guidedReviewPresentation() : cleanReviewPresentation();
  const layout = guided ? guidedReviewLayout() : cleanReviewLayout();
  return {
    ...context,
    sourceSha256,
    manifest: {
      ...context.manifest,
      ...(guided ? {
        pptxObjects: [{
          slideId: "slide-1",
          role: "table",
          objectKind: "raster-image",
          blockIds: ["b-table"],
        }],
      } : {}),
    },
    presentation,
    layout,
  };
}

function cleanReviewPresentation(): Record<string, unknown> {
  return {
    slides: [{
      id: "source-slide-1",
      title: "Review Regression Fixture",
      headingPath: ["Review Regression Fixture"],
      blocks: [
        { id: "b-claim", type: "paragraph", text: "A stable claim keeps the generated evidence slide grounded." },
        { id: "b-chart", type: "chart", text: "Funnel chart" },
        { id: "b-caption", type: "paragraph", text: "Figure: Funnel stages remain tied to the evidence." },
      ],
    }],
  };
}

function cleanReviewLayout(): Record<string, unknown> {
  return {
    slides: [{
      id: "slide-1",
      sourceSlideId: "source-slide-1",
      layout: { preset: "chart-table" },
      regions: [{ id: "main", blockIds: ["b-claim", "b-chart", "b-caption"] }],
    }],
  };
}

function guidedReviewPresentation(): Record<string, unknown> {
  return {
    slides: [{
      id: "source-slide-1",
      title: "Review Regression Fixture",
      headingPath: ["Review Regression Fixture"],
      blocks: [
        { id: "b-table", type: "table", text: "Stage and user table" },
      ],
    }],
  };
}

function guidedReviewLayout(): Record<string, unknown> {
  return {
    slides: [{
      id: "slide-1",
      sourceSlideId: "source-slide-1",
      layout: { preset: "table-focus" },
      regions: [{ id: "main", blockIds: ["b-table"] }],
    }],
  };
}
