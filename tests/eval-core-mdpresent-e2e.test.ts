import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { runMdprSkillEval } from "../packages/eval-core/src/index";

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
