import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runCli } from "../packages/cli/src/main";

test("runCli exposes help and command groups", () => {
  const output: string[] = [];
  const exitCode = runCli(["--help"], {
    stdout: (value) => output.push(value),
    stderr: () => undefined,
  });

  assert.equal(exitCode, 0);
  assert.match(output.join("\n"), /mdpr-skill/);
  assert.match(output.join("\n"), /hint/);
  assert.match(output.join("\n"), /review/);
  assert.match(output.join("\n"), /narrative/);
  assert.match(output.join("\n"), /layout-intent/);
  assert.match(output.join("\n"), /speaker-notes/);
  assert.match(output.join("\n"), /citations/);
  assert.match(output.join("\n"), /rendered-preview/);
  assert.match(output.join("\n"), /accessibility/);
  assert.match(output.join("\n"), /evidence-ledger/);
  assert.match(output.join("\n"), /eval/);
  assert.match(output.join("\n"), /design/);
  assert.match(output.join("\n"), /edit/);
  assert.match(output.join("\n"), /teaser/);
  assert.match(output.join("\n"), /formats/);
  assert.match(output.join("\n"), /gate/);
  assert.match(output.join("\n"), /change/);
});

test("runCli reports mdpr-skill format coverage against FigureLabs", () => {
  const output: string[] = [];
  const exitCode = runCli([
    "formats",
    "--compare",
    "figurelabs",
  ], {
    stdout: (value) => output.push(value),
    stderr: () => undefined,
  });

  assert.equal(exitCode, 0);
  const report = JSON.parse(output.join("\n"));
  assert.equal(report.schemaVersion, "mdpr-skill-format-capabilities-v1");
  assert.equal(report.comparisonTarget.name, "FigureLabs");
  assert.equal(report.comparisonTarget.sourceReviewedDate, "2026-06-30");
  assert.equal(report.comparisonTarget.sourceReviewTimezone, "Asia/Seoul");
  assert.match(report.comparisonTarget.sourceReviewScope, /public FigureLabs pages/);
  assert.deepEqual(report.comparisonTarget.publicOutputFormats, ["pptx", "svg", "png", "jpg", "pdf"]);
  assert.ok(Array.isArray(report.comparisonTarget.sourceEvidence));
  assert.equal(report.coverage.figureLabs.publicEvidenceClaims, report.comparisonTarget.sourceEvidence.length);
  assert.ok(report.comparisonTarget.sourceEvidence.some((item: { claimId: string }) => item.claimId === "output-format-exports"));
  assert.ok(report.comparisonTarget.sourceEvidence.some((item: { claimId: string }) => item.claimId === "publication-authorization"));
  for (const item of report.comparisonTarget.sourceEvidence as Array<{ claim: string; sourceRefs: string[] }>) {
    assert.equal(typeof item.claim, "string");
    assert.ok(item.sourceRefs.length > 0);
    assert.ok(item.sourceRefs.every((ref) => report.comparisonTarget.sourceRefs.includes(ref)));
  }
  assert.ok(report.comparisonTarget.publicWorkflowStages.includes("generate"));
  assert.ok(report.comparisonTarget.publicWorkflowStages.includes("edit"));
  assert.ok(report.comparisonTarget.publicWorkflowStages.includes("vectorize"));
  assert.ok(report.comparisonTarget.publicAssuranceArtifacts.includes("publication-authorization-pdf"));
  assert.ok(report.mdprSkill.inputFormats.includes("markdown"));
  assert.ok(report.mdprSkill.inputFormats.includes("selection-context-json"));
  assert.ok(report.mdprSkill.inputFormats.includes("html"));
  assert.ok(report.mdprSkill.outputFormats.includes("pptx"));
  assert.ok(report.mdprSkill.outputFormats.includes("html"));
  assert.ok(report.mdprSkill.outputFormats.includes("pdf"));
  assert.ok(report.mdprSkill.outputFormats.includes("svg"));
  assert.ok(report.mdprSkill.outputFormats.includes("json"));
  assert.deepEqual(report.mdprSkill.comparisonReportFormats, ["json", "markdown", "html"]);
  assert.equal(report.coverage.mdprSkill.comparisonReportFormats, report.mdprSkill.comparisonReportFormats.length);
  assert.equal(report.coverage.mdprSkill.formatFamilies > report.coverage.figureLabs.publicFormatFamilies, true);
  assert.equal(report.coverage.mdprSkill.workflowCompletenessSignals > report.coverage.figureLabs.publicWorkflowStages, true);
  assert.equal(report.coverage.mdprSkill.assuranceArtifacts > report.coverage.figureLabs.publicAssuranceArtifacts, true);
  assert.ok(report.mdprSkill.workflowStages.includes("source-grounded-hinting"));
  assert.ok(report.mdprSkill.workflowStages.includes("approval-bound-change-control"));
  assert.ok(report.mdprSkill.workflowStages.includes("deterministic-mdpr-rendering"));
  assert.ok(report.mdprSkill.workflowStages.includes("release-preflight"));
  assert.ok(report.mdprSkill.figureLabsGapClosures.includes("generated-image-request-candidates-for-large-or-ambiguous-icon-slots"));
  assert.equal(report.coverage.mdprSkill.workflowCompletenessSignals, report.mdprSkill.completenessSignals.length);
  assert.ok(report.mdprSkill.completenessSignals.includes("source-sha256-guard"));
  assert.ok(report.mdprSkill.completenessSignals.includes("schema-valid-agent-hints"));
  assert.ok(report.mdprSkill.completenessSignals.includes("source-to-slide-evidence-ledger"));
  assert.ok(report.mdprSkill.completenessSignals.includes("release-preflight"));
});

test("runCli validates FigureLabs format comparison artifacts", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-format-validate-"));
  try {
    const validPath = join(workDir, "format-capabilities.json");
    const compareOutput: string[] = [];
    const compareExitCode = runCli([
      "formats",
      "--compare",
      "figurelabs",
      "--out",
      validPath,
    ], {
      stdout: (value) => compareOutput.push(value),
      stderr: () => undefined,
    });
    assert.equal(compareExitCode, 0);

    const validationOutput: string[] = [];
    const validationExitCode = runCli([
      "formats",
      "--validate",
      validPath,
    ], {
      stdout: (value) => validationOutput.push(value),
      stderr: () => undefined,
    });

    assert.equal(validationExitCode, 0);
    const validation = JSON.parse(validationOutput.join("\n"));
    assert.equal(validation.status, "pass");
    assert.equal(validation.checks.includes("schema-identity"), true);
    assert.equal(validation.checks.includes("coverage-counts"), true);
    assert.equal(validation.checks.includes("mdpr-skill-superiority"), true);

    const invalidPath = join(workDir, "invalid-format-capabilities.json");
    const invalidReport = JSON.parse(readFileSync(validPath, "utf-8"));
    invalidReport.coverage.figureLabs.publicWorkflowStages = 99;
    writeFileSync(invalidPath, JSON.stringify(invalidReport, null, 2), "utf-8");

    const errors: string[] = [];
    const invalidExitCode = runCli([
      "formats",
      "--validate",
      invalidPath,
    ], {
      stdout: () => undefined,
      stderr: (value) => errors.push(value),
    });

    assert.equal(invalidExitCode, 1);
    assert.match(errors.join("\n"), /coverage\.figureLabs\.publicWorkflowStages/);

    const invalidCompletenessPath = join(workDir, "invalid-format-completeness.json");
    const invalidCompletenessReport = JSON.parse(readFileSync(validPath, "utf-8"));
    invalidCompletenessReport.mdprSkill.completenessSignals.pop();
    writeFileSync(invalidCompletenessPath, JSON.stringify(invalidCompletenessReport, null, 2), "utf-8");

    const completenessErrors: string[] = [];
    const invalidCompletenessExitCode = runCli([
      "formats",
      "--validate",
      invalidCompletenessPath,
    ], {
      stdout: () => undefined,
      stderr: (value) => completenessErrors.push(value),
    });

    assert.equal(invalidCompletenessExitCode, 1);
    assert.match(completenessErrors.join("\n"), /coverage\.mdprSkill\.workflowCompletenessSignals/);

    const invalidEvidencePath = join(workDir, "invalid-format-evidence.json");
    const invalidEvidenceReport = JSON.parse(readFileSync(validPath, "utf-8"));
    invalidEvidenceReport.comparisonTarget.sourceEvidence[0].sourceRefs = ["http://example.com/not-trusted"];
    writeFileSync(invalidEvidencePath, JSON.stringify(invalidEvidenceReport, null, 2), "utf-8");

    const evidenceErrors: string[] = [];
    const invalidEvidenceExitCode = runCli([
      "formats",
      "--validate",
      invalidEvidencePath,
    ], {
      stdout: () => undefined,
      stderr: (value) => evidenceErrors.push(value),
    });

    assert.equal(invalidEvidenceExitCode, 1);
    assert.match(evidenceErrors.join("\n"), /comparisonTarget\.sourceEvidence/);

    const invalidReportFormatsPath = join(workDir, "invalid-report-formats.json");
    const invalidReportFormats = JSON.parse(readFileSync(validPath, "utf-8"));
    invalidReportFormats.mdprSkill.comparisonReportFormats.pop();
    writeFileSync(invalidReportFormatsPath, JSON.stringify(invalidReportFormats, null, 2), "utf-8");

    const reportFormatErrors: string[] = [];
    const invalidReportFormatsExitCode = runCli([
      "formats",
      "--validate",
      invalidReportFormatsPath,
    ], {
      stdout: () => undefined,
      stderr: (value) => reportFormatErrors.push(value),
    });

    assert.equal(invalidReportFormatsExitCode, 1);
    assert.match(reportFormatErrors.join("\n"), /coverage\.mdprSkill\.comparisonReportFormats/);

    const invalidSourceReviewPath = join(workDir, "invalid-source-review.json");
    const invalidSourceReviewReport = JSON.parse(readFileSync(validPath, "utf-8"));
    delete invalidSourceReviewReport.comparisonTarget.sourceReviewedDate;
    writeFileSync(invalidSourceReviewPath, JSON.stringify(invalidSourceReviewReport, null, 2), "utf-8");

    const sourceReviewErrors: string[] = [];
    const invalidSourceReviewExitCode = runCli([
      "formats",
      "--validate",
      invalidSourceReviewPath,
    ], {
      stdout: () => undefined,
      stderr: (value) => sourceReviewErrors.push(value),
    });

    assert.equal(invalidSourceReviewExitCode, 1);
    assert.match(sourceReviewErrors.join("\n"), /comparisonTarget\.sourceReviewedDate/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli renders FigureLabs format comparison as Markdown and HTML reports", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-format-report-"));
  try {
    const markdownPath = join(workDir, "figurelabs-comparison.md");
    const markdownOutput: string[] = [];
    const markdownExitCode = runCli([
      "formats",
      "--compare",
      "figurelabs",
      "--format",
      "markdown",
      "--out",
      markdownPath,
    ], {
      stdout: (value) => markdownOutput.push(value),
      stderr: () => undefined,
    });

    assert.equal(markdownExitCode, 0);
    const markdown = markdownOutput.join("\n");
    assert.match(markdown, /^# FigureLabs Format Capability Comparison/);
    assert.match(markdown, /\| Area \| FigureLabs public workflow \| mdpr-skill \+ MDPR \|/);
    assert.match(markdown, /PPTX, HTML, PDF, SVG, JSON, Markdown/);
    assert.match(markdown, /JSON, Markdown, HTML/);
    assert.match(markdown, /Source reviewed: 2026-06-30 \(Asia\/Seoul\)/);
    assert.match(markdown, /## Source Evidence/);
    assert.match(markdown, /output-format-exports/);
    assert.match(markdown, /schema-identity, required-sections, https-source-refs, source-review-metadata, source-evidence, coverage-counts, mdpr-skill-superiority/);
    assert.equal(readFileSync(markdownPath, "utf-8"), markdown + "\n");

    const htmlPath = join(workDir, "figurelabs-comparison.html");
    const htmlOutput: string[] = [];
    const htmlExitCode = runCli([
      "formats",
      "--compare",
      "figurelabs",
      "--format",
      "html",
      "--out",
      htmlPath,
    ], {
      stdout: (value) => htmlOutput.push(value),
      stderr: () => undefined,
    });

    assert.equal(htmlExitCode, 0);
    const html = htmlOutput.join("\n");
    assert.match(html, /^<!doctype html>/);
    assert.match(html, /<title>FigureLabs Format Capability Comparison<\/title>/);
    assert.match(html, /<table>/);
    assert.match(html, /mdpr-skill \+ MDPR/);
    assert.match(html, /PPTX, HTML, PDF, SVG, JSON, Markdown/);
    assert.match(html, /JSON, Markdown, HTML/);
    assert.match(html, /Source reviewed: 2026-06-30 \(Asia\/Seoul\)/);
    assert.match(html, /<h2>Source Evidence<\/h2>/);
    assert.match(html, /output-format-exports/);
    assert.equal(readFileSync(htmlPath, "utf-8"), html + "\n");
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes README teaser SVG with visual pipeline nodes", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-teaser-"));
  const previousInvokeCwd = process.env.MDPR_SKILL_INVOKE_CWD;
  try {
    const specPath = join(workDir, "readme-teaser.json");
    const outPath = join(workDir, "readme-teaser.svg");
    writeFileSync(specPath, JSON.stringify({
      title: "Agentic RAG",
      subtitle: "Iterative retrieval with sufficiency checks.",
      chips: ["RAG", "citations"],
      metrics: [
        { label: "One-shot fetch", value: "0.5" },
        { label: "Iterative fetch", value: "1.0" },
      ],
      pipeline: ["plan", "route", "retrieve", "judge"],
      accent: "#0f766e",
    }), "utf-8");

    process.env.MDPR_SKILL_INVOKE_CWD = workDir;
    const output: string[] = [];
    const exitCode = runCli([
      "teaser",
      "--spec",
      "readme-teaser.json",
      "--out",
      "readme-teaser.svg",
    ], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    assert.equal(JSON.parse(output.join("\n")).status, "pass");
    const svg = readFileSync(outPath, "utf-8");
    assert.match(svg, /class="pipeline-node"/);
    assert.match(svg, /class="pipeline-connector"/);
    assert.match(svg, />retrieve</);
    assert.equal(svg.includes("plan -> route"), false);
  } finally {
    if (previousInvokeCwd === undefined) {
      delete process.env.MDPR_SKILL_INVOKE_CWD;
    } else {
      process.env.MDPR_SKILL_INVOKE_CWD = previousInvokeCwd;
    }
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes an agent hint manifest without final design fields", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-"));
  try {
    const outPath = join(workDir, "agent-hint.json");
    const exitCode = runCli([
      "hint",
      "--source-sha256",
      "a".repeat(64),
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const manifest = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(manifest.schemaVersion, "mdpr-agent-hint-v1");
    assert.equal(manifest.generatedBy, "mdpr-skill");
    assert.deepEqual(manifest.hints, []);
    assert.equal(JSON.stringify(manifest).includes('"x"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes an agent hint manifest directly from a selection context", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-hint-selection-"));
  try {
    const selectionContextPath = join(workDir, "selection-context.json");
    const outPath = join(workDir, "agent-hint.json");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-preview",
        sourceSha256: "e".repeat(64),
      },
      slideId: "slide-direct",
      overlappedBlocks: ["headline-1"],
      userInstruction: "The icon is too large and ambiguous; generate an image instead.",
    }), "utf-8");

    const exitCode = runCli([
      "hint",
      "--selection-context",
      selectionContextPath,
      "--out",
      outPath,
      "--generated-at",
      "2026-06-29T00:00:00Z",
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const manifest = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(manifest.sourceSha256, "e".repeat(64));
    assert.equal(manifest.hints[0].slideId, "slide-direct");
    assert.equal(manifest.hints[0].visualAssetCandidates[0].kind, "generated-image");
    assert.equal(manifest.hints[0].visualAssetCandidates[0].trigger, "large-or-ambiguous-icon");
    assert.equal(JSON.stringify(manifest).includes("iconPath"), false);
    assert.equal(JSON.stringify(manifest).includes('"coordinates"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli rejects selection-context hints when markdown sha is stale", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-hint-stale-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const selectionContextPath = join(workDir, "selection-context.json");
    const outPath = join(workDir, "agent-hint.json");
    const staleMarkdown = "# Old title\n";
    const currentMarkdown = "# Current title\n";
    const staleSha = createHash("sha256").update(staleMarkdown).digest("hex");
    writeFileSync(markdownPath, currentMarkdown, "utf-8");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-preview",
        sourceSha256: staleSha,
      },
      slideId: "slide-stale",
      userInstruction: "The icon is too large; generate an image instead.",
    }), "utf-8");

    const errors: string[] = [];
    const exitCode = runCli([
      "hint",
      "--selection-context",
      selectionContextPath,
      "--markdown",
      markdownPath,
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: (value) => errors.push(value),
    });

    assert.equal(exitCode, 1);
    assert.match(errors.join("\n"), /does not match markdown sha256/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli reports source verification for markdown-bound selection hints", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-hint-verified-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const selectionContextPath = join(workDir, "selection-context.json");
    const outPath = join(workDir, "agent-hint.json");
    const markdown = "# Verified title\n";
    const sourceSha = createHash("sha256").update(markdown).digest("hex");
    writeFileSync(markdownPath, markdown, "utf-8");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-preview",
        sourceSha256: sourceSha,
      },
      slideId: "slide-verified",
      userInstruction: "The icon is too large; generate an image instead.",
    }), "utf-8");

    const output: string[] = [];
    const exitCode = runCli([
      "hint",
      "--selection-context",
      selectionContextPath,
      "--markdown",
      markdownPath,
      "--out",
      outPath,
    ], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const summary = JSON.parse(output.join("\n"));
    assert.equal(summary.sourceVerified, true);
    assert.equal(summary.sourceSha256, sourceSha);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes an edit-intent setSplit override candidate", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-edit-"));
  try {
    const outPath = join(workDir, "override.candidate.json");
    const exitCode = runCli([
      "edit",
      "override-candidate",
      "--id",
      "edit-1",
      "--source-sha256",
      "b".repeat(64),
      "--slide-ref",
      "Research Findings",
      "--instruction",
      "Split this section by child findings.",
      "--split-by",
      "h3",
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const candidate = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(candidate.version, "1.0");
    assert.equal(candidate.operations[0].op, "setSplit");
    assert.deepEqual(candidate.operations[0].target, { title: "Research Findings" });
    assert.deepEqual(candidate.operations[0].value, { splitBy: "h3" });
    assert.equal(JSON.stringify(candidate).includes('"x"'), false);
    assert.equal(JSON.stringify(candidate).includes('"color"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli converts a PowerPoint selection context into hint and change proposal", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-ppt-"));
  try {
    const selectionContextPath = join(workDir, "selection-context.json");
    const hintsPath = join(workDir, "agent-hint.json");
    const changePath = join(workDir, "change-request.json");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-ppt",
        sourceSha256: "c".repeat(64),
      },
      slideId: "slide-4",
      overlappedBlocks: ["b12", "b13"],
      overlappedRegions: ["region-main"],
      selectionPath: ".mdpresent/ppt/selection.json",
      userInstruction: "Keep this selected table and caption together.",
    }), "utf-8");

    const exitCode = runCli([
      "ppt",
      "propose",
      "--selection-context",
      selectionContextPath,
      "--out",
      changePath,
      "--hints-out",
      hintsPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const hints = JSON.parse(readFileSync(hintsPath, "utf-8"));
    const change = JSON.parse(readFileSync(changePath, "utf-8"));
    assert.equal(hints.schemaVersion, "mdpr-agent-hint-v1");
    assert.deepEqual(hints.hints[0].groupCandidates[0].elementIds, ["b12", "b13"]);
    assert.equal(change.schemaVersion, "mdpr-change-request-v1");
    assert.equal(change.stage, "proposed");
    assert.equal(change.source.selectionRef, ".mdpresent/ppt/selection.json");
    assert.equal(change.changes[0].kind, "agent-hint");
    assert.equal(change.changes[1].kind, "edit-intent");
    assert.deepEqual(change.changes[1].intent.target.blockHints, ["b12", "b13"]);
    assert.deepEqual(change.changes[1].intent.target.regionHints, ["region-main"]);
    assert.equal(JSON.stringify(change).includes('"x"'), false);
    assert.equal(JSON.stringify(change).includes('"color"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli reports source verification for markdown-bound ppt proposals", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-ppt-verified-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const selectionContextPath = join(workDir, "selection-context.json");
    const changePath = join(workDir, "change-request.json");
    const markdown = "# Verified PPT proposal\n";
    const sourceSha = createHash("sha256").update(markdown).digest("hex");
    writeFileSync(markdownPath, markdown, "utf-8");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-ppt",
        sourceSha256: sourceSha,
      },
      slideId: "slide-ppt-verified",
      overlappedBlocks: ["b1"],
      selectionPath: ".mdpresent/ppt/verified-selection.json",
      userInstruction: "Keep this selected object aligned with current Markdown.",
    }), "utf-8");

    const output: string[] = [];
    const exitCode = runCli([
      "ppt",
      "propose",
      "--selection-context",
      selectionContextPath,
      "--markdown",
      markdownPath,
      "--out",
      changePath,
    ], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const summary = JSON.parse(output.join("\n"));
    assert.equal(summary.sourceVerified, true);
    assert.equal(summary.sourceSha256, sourceSha);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli rejects ppt proposals when selection context markdown sha is stale", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-ppt-stale-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const selectionContextPath = join(workDir, "selection-context.json");
    const changePath = join(workDir, "change-request.json");
    const staleMarkdown = "# Previous slide\n";
    const currentMarkdown = "# Current slide\n";
    const staleSha = createHash("sha256").update(staleMarkdown).digest("hex");
    writeFileSync(markdownPath, currentMarkdown, "utf-8");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-ppt",
        sourceSha256: staleSha,
      },
      slideId: "slide-stale",
      overlappedBlocks: ["b1"],
      selectionPath: ".mdpresent/ppt/stale-selection.json",
      userInstruction: "Keep this selected object with the current markdown.",
    }), "utf-8");

    const errors: string[] = [];
    const exitCode = runCli([
      "ppt",
      "propose",
      "--selection-context",
      selectionContextPath,
      "--markdown",
      markdownPath,
      "--out",
      changePath,
    ], {
      stdout: () => undefined,
      stderr: (value) => errors.push(value),
    });

    assert.equal(exitCode, 1);
    assert.match(errors.join("\n"), /does not match markdown sha256/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes generated-image hint candidates for large or ambiguous icon selections", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-ppt-image-"));
  try {
    const selectionContextPath = join(workDir, "selection-context.json");
    const hintsPath = join(workDir, "agent-hint.json");
    const changePath = join(workDir, "change-request.json");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-preview",
        sourceSha256: "f".repeat(64),
      },
      slideId: "slide-icon",
      overlappedBlocks: ["headline-1"],
      selectionPath: ".mdpresent/ppt/selection-icon.json",
      userInstruction: "아이콘이 너무 크거나 의미가 애매하다면 이미지 생성으로 처리해줘.",
    }), "utf-8");

    const exitCode = runCli([
      "ppt",
      "propose",
      "--selection-context",
      selectionContextPath,
      "--out",
      changePath,
      "--hints-out",
      hintsPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const hints = JSON.parse(readFileSync(hintsPath, "utf-8"));
    assert.equal(hints.hints[0].visualAssetCandidates[0].kind, "generated-image");
    assert.equal(hints.hints[0].visualAssetCandidates[0].trigger, "large-or-ambiguous-icon");
    assert.equal(JSON.stringify(hints).includes("iconPath"), false);
    assert.equal(JSON.stringify(hints).includes('"coordinates"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli validates schema sync through semantic comparison", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-schema-"));
  try {
    const localSchema = join(workDir, "local.schema.json");
    const mdprSchema = join(workDir, "mdpr", "schemas", "agent-hint.schema.json");
    mkdirSync(join(workDir, "mdpr", "schemas"), { recursive: true });
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["schemaVersion", "sourceSha256", "hints"],
      properties: {
        schemaVersion: { const: "mdpr-agent-hint-v1" },
        sourceSha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
        hints: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
      },
    };
    const objectMapSchema = {
      type: "object",
      required: ["schemaVersion", "objects"],
      properties: {
        schemaVersion: { const: "mdpr-pptx-object-map-v1" },
        objects: { type: "array" },
      },
    };
    writeFileSync(localSchema, JSON.stringify(schema, null, 2), "utf-8");
    writeFileSync(mdprSchema, JSON.stringify(schema), "utf-8");
    writeFileSync(join(workDir, "mdpr-pptx-object-map.schema.json"), JSON.stringify(objectMapSchema), "utf-8");
    writeFileSync(join(workDir, "mdpr", "schemas", "mdpr-pptx-object-map.schema.json"), JSON.stringify(objectMapSchema), "utf-8");

    const output: string[] = [];
    const exitCode = runCli([
      "validate-schema-sync",
      "--local-schema",
      localSchema,
      "--mdpr-path",
      join(workDir, "mdpr"),
      "--shared-schema",
      "mdpr-pptx-object-map.schema.json",
    ], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    assert.equal(JSON.parse(output.join("\n")).status, "pass");
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes narrative-spine suggestions from Markdown without final design fields", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-narrative-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const manifestPath = join(workDir, "mdpresent-manifest.json");
    const notesPath = join(workDir, "notes.md");
    const outPath = join(workDir, "narrative-review.json");
    writeFileSync(markdownPath, [
      "# Growth Review",
      "## Activation",
      "### Data",
      "| step | rate |",
      "| --- | --- |",
      "| Trial | 42% |",
      "### Action",
      "- Fix onboarding friction before adding acquisition spend.",
    ].join("\n"), "utf-8");
    writeFileSync(manifestPath, JSON.stringify({
      metrics: { slideCount: 2 },
      source: { sha256: "d".repeat(64) },
    }), "utf-8");
    writeFileSync(notesPath, "Audience: executive review. Lead with claims.", "utf-8");

    const exitCode = runCli([
      "narrative",
      "--markdown",
      markdownPath,
      "--manifest",
      manifestPath,
      "--source-notes",
      notesPath,
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-narrative-review-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.deepEqual(report.suggestions.map((suggestion: { kind: string }) => suggestion.kind).sort(), [
      "claim-title",
      "section-flow",
    ]);
    assert.equal(report.suggestions.every((suggestion: { evidence: { sourcePath: string } }) => suggestion.evidence.sourcePath === markdownPath), true);
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"layoutId"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes semantic layout-intent hints from a layout catalog", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-layout-intent-"));
  try {
    const catalogPath = join(workDir, "layout-catalog.json");
    const outPath = join(workDir, "layout-intent.json");
    writeFileSync(catalogPath, JSON.stringify({
      layouts: [
        {
          layoutId: "tpl-compare-01",
          name: "Two Column Comparison",
          placeholders: [
            { id: "title", role: "title", x: 0.2, y: 0.1 },
            { id: "left", role: "body", x: 0.5, y: 1.2 },
            { id: "right", role: "body", x: 6.8, y: 1.2 },
          ],
        },
      ],
    }), "utf-8");

    const exitCode = runCli([
      "layout-intent",
      "--layout-catalog",
      catalogPath,
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-layout-intent-review-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.equal(report.hints[0].intent, "comparison");
    assert.equal(report.hints[0].evidence.sourcePath, catalogPath);
    assert.equal(JSON.stringify(report).includes("layoutId"), false);
    assert.equal(JSON.stringify(report).includes('"x"'), false);
    assert.equal(JSON.stringify(report).includes('"id"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes speaker notes and comments from Markdown without final design fields", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-speaker-notes-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const notesPath = join(workDir, "notes.md");
    const outPath = join(workDir, "speaker-notes.json");
    writeFileSync(markdownPath, [
      "# Launch Readout",
      "## Activation",
      "Activation rose to 42% after onboarding fixes.",
      "## Next Decision",
      "- Shift budget from acquisition into retention experiments.",
    ].join("\n"), "utf-8");
    writeFileSync(notesPath, "Reviewer asks for a sharper executive talk track and one risk callout.", "utf-8");

    const exitCode = runCli([
      "speaker-notes",
      "--markdown",
      markdownPath,
      "--source-notes",
      notesPath,
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-speaker-notes-review-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.deepEqual(report.suggestions.map((suggestion: { kind: string }) => suggestion.kind).sort(), ["review-comment", "speaker-note"]);
    assert.equal(report.suggestions.every((suggestion: { evidence: { sourcePath: string } }) => suggestion.evidence.sourcePath === markdownPath), true);
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"layoutId"'), false);
    assert.equal(JSON.stringify(report).includes('"x"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes citation provenance findings from Markdown and source metadata", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-citations-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const sourcesPath = join(workDir, "sources.json");
    const outPath = join(workDir, "citations.json");
    writeFileSync(markdownPath, [
      "# Retention Research",
      "## Churn",
      "Activation rose by 42% after onboarding changes.",
      "This proves the retention program reduces churn for enterprise users.",
      "According to the market benchmark, teams need faster reporting.[^1]",
      "[^1]: Vendor benchmark, 2022-01-10.",
    ].join("\n"), "utf-8");
    writeFileSync(sourcesPath, JSON.stringify({
      sources: [{ id: "vendor-benchmark", title: "Vendor benchmark", date: "2022-01-10", path: "sources/vendor.md" }],
    }), "utf-8");

    const exitCode = runCli([
      "citations",
      "--markdown",
      markdownPath,
      "--sources",
      sourcesPath,
      "--as-of",
      "2026-06-27",
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-citation-review-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.deepEqual(report.findings.map((finding: { kind: string }) => finding.kind).sort(), [
      "missing-citation",
      "stale-source",
      "unsupported-claim",
    ]);
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"layoutId"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes rendered preview critique notes from image evidence", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-rendered-preview-"));
  try {
    const imagesPath = join(workDir, "images.json");
    const outPath = join(workDir, "rendered-preview.json");
    writeFileSync(imagesPath, JSON.stringify({
      images: [
        { slideId: "slide-1", imagePath: "png/slide-01.png", contactSheetPath: "contact-sheet.png" },
        { slideId: "slide-2", imagePath: "png/slide-02.png", mdprFindingId: "overflow-2", mdprFindingType: "TEXT_OVERFLOW" },
      ],
    }), "utf-8");

    const exitCode = runCli([
      "rendered-preview",
      "--images",
      imagesPath,
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-rendered-preview-review-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.equal(report.notes.length, 2);
    assert.equal(report.notes.every((note: { kind: string }) => note.kind === "visual-concern-note"), true);
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"verdict"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes accessibility content suggestions from Markdown", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-accessibility-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const outPath = join(workDir, "accessibility.json");
    writeFileSync(markdownPath, [
      "# Operator Review",
      "## ARR",
      "![](charts/arr-growth.png)",
      "ARR is obviously the single best metric because this extremely long operating sentence compresses multiple assumptions about sales motion onboarding maturity finance timing and executive ownership into one breathless claim that should be rewritten for readers.",
    ].join("\n"), "utf-8");

    const exitCode = runCli([
      "accessibility",
      "--markdown",
      markdownPath,
      "--audience",
      "executive operators",
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-accessibility-content-review-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.deepEqual(report.suggestions.map((suggestion: { kind: string }) => suggestion.kind).sort(), [
      "acronym-expansion",
      "alt-text-draft",
      "audience-fit",
      "plain-language",
    ]);
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"fontSize"'), false);
    assert.equal(JSON.stringify(report).includes('"verdict"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes source-to-slide evidence ledger", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-evidence-ledger-"));
  try {
    const markdownPath = join(workDir, "deck.md");
    const sourcesPath = join(workDir, "sources.json");
    const evidencePath = join(workDir, "mdpr-evidence.json");
    const outPath = join(workDir, "evidence-ledger.json");
    writeFileSync(markdownPath, [
      "# Pipeline Review",
      "## Activation",
      "Activation rose by 42% after onboarding changes.[^1]",
      "![Activation chart](charts/activation.png)",
      "## Retention",
      "The cohort table shows enterprise retention improved.[^2]",
    ].join("\n"), "utf-8");
    writeFileSync(sourcesPath, JSON.stringify({
      sources: [
        { id: "growth-study", title: "Growth study", date: "2026-01-10", path: "sources/growth.md" },
        { id: "cohort-table", title: "Cohort table", date: "2026-02-10", path: "sources/cohort.csv" },
      ],
    }), "utf-8");
    writeFileSync(evidencePath, JSON.stringify({
      evidence: [
        { evidenceId: "chart-activation", slideId: "Activation", kind: "chart", path: "charts/activation.png" },
        { evidenceId: "table-retention", slideId: "Retention", kind: "table", path: "tables/retention.csv" },
      ],
    }), "utf-8");

    const exitCode = runCli([
      "evidence-ledger",
      "--markdown",
      markdownPath,
      "--sources",
      sourcesPath,
      "--mdpr-evidence",
      evidencePath,
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(report.schemaVersion, "mdpr-source-slide-evidence-ledger-v1");
    assert.equal(report.generatedBy, "mdpr-skill");
    assert.deepEqual(report.entries.map((entry: { slideRef: string }) => entry.slideRef), ["Activation", "Retention"]);
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"layoutId"'), false);
    assert.equal(JSON.stringify(report).includes('"verdict"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
