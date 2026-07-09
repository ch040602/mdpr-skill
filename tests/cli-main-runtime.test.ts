import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runCli } from "../packages/cli/src/main";

const forbiddenRuntimeKeys = new Set([
  "x",
  "y",
  "w",
  "h",
  "cropRect",
  "iconPath",
  "imagePath",
  "rendererObjectId",
  "masterId",
  "layoutId",
  "fontFamily",
  "fontName",
  "zOrder",
]);

function collectRuntimeDecisionLeaks(value: unknown, path = "$"): string[] {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && path !== "$.markdown" && /#[0-9a-fA-F]{6}\b/.test(value)) return [`${path}:raw-hex`];
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRuntimeDecisionLeaks(item, `${path}[${index}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    const nextPath = `${path}.${key}`;
    const ownLeak = forbiddenRuntimeKeys.has(key) ? [nextPath] : [];
    return [...ownLeak, ...collectRuntimeDecisionLeaks(item, nextPath)];
  });
}

test("runCli exposes help and command groups", () => {
  const output: string[] = [];
  const exitCode = runCli(["--help"], {
    stdout: (value) => output.push(value),
    stderr: () => undefined,
  });

  assert.equal(exitCode, 0);
  assert.match(output.join("\n"), /mdpr-skill/);
  assert.match(output.join("\n"), /docs/);
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
  assert.match(output.join("\n"), /gate/);
  assert.match(output.join("\n"), /change/);
  assert.match(output.join("\n"), /codex-ppt compat/);
  assert.match(output.join("\n"), /codex-ppt slide-tasks/);
  assert.match(output.join("\n"), /codex-ppt job-state/);
  assert.match(output.join("\n"), /codex-ppt generated-assets/);
});

test("runCli exposes dense agent docs inspired by branch-local CLI guidance", () => {
  const listOutput: string[] = [];
  assert.equal(runCli(["docs", "--list", "--json"], {
    stdout: (value) => listOutput.push(value),
    stderr: () => undefined,
  }), 0);
  const list = JSON.parse(listOutput.join("\n"));
  assert.equal(list.schemaVersion, "mdpr-skill-agent-docs-v1");
  assert.equal(list.topics.some((topic: { topic: string }) => topic.topic === "bootstrap"), true);
  assert.equal(list.topics.some((topic: { topic: string }) => topic.topic === "preflight"), true);
  assert.equal(list.topics.some((topic: { topic: string }) => topic.topic === "astryx-comparison"), true);

  const denseOutput: string[] = [];
  assert.equal(runCli(["docs", "boundaries", "--dense"], {
    stdout: (value) => denseOutput.push(value),
    stderr: () => undefined,
  }), 0);
  const dense = denseOutput.join("\n");
  assert.match(dense, /MDPR owns parsing/);
  assert.match(dense, /Forbidden fields/);
  assert.match(dense, /renderer objects/);
  assert.equal(dense.includes("React component APIs"), false);

  const jsonOutput: string[] = [];
  assert.equal(runCli(["docs", "astryx-comparison", "--dense", "--json"], {
    stdout: (value) => jsonOutput.push(value),
    stderr: () => undefined,
  }), 0);
  const doc = JSON.parse(jsonOutput.join("\n"));
  assert.equal(doc.topic, "astryx-comparison");
  assert.equal(doc.dense, true);
  assert.match(doc.markdown, /local branch CLI docs/);
  assert.match(doc.markdown, /Do not borrow: React component APIs/);

  const preflightOutput: string[] = [];
  assert.equal(runCli(["docs", "preflight", "--json"], {
    stdout: (value) => preflightOutput.push(value),
    stderr: () => undefined,
  }), 0);
  const preflight = JSON.parse(preflightOutput.join("\n"));
  assert.equal(preflight.topic, "preflight");
  assert.match(preflight.markdown, /Read intent first/);
  assert.match(preflight.markdown, /Default image search to disabled/);
  assert.match(preflight.markdown, /Separate content, evidence, prompt, and output artifacts/);
  assert.match(preflight.markdown, /MDPR owns parsing/);
  assert.match(preflight.markdown, /mdpr-skill owns semantic hints/);
  assert.match(preflight.markdown, /Do not encode final PPT geometry/);
  assert.deepEqual(collectRuntimeDecisionLeaks(preflight), []);
  assert.match(preflight.markdown, /Do not encode final PPT geometry/);
  assert.deepEqual(collectRuntimeDecisionLeaks({ markdown: "do not emit x/y/w/h or imagePath in hints" }), []);
  assert.deepEqual(collectRuntimeDecisionLeaks({ layout: { x: 1, y: 2, w: 3, h: 4 } }), [
    "$.layout.x",
    "$.layout.y",
    "$.layout.w",
    "$.layout.h",
  ]);
  assert.deepEqual(collectRuntimeDecisionLeaks({ nested: { iconPath: "icons/a.svg", colorToken: "#ffffff" } }), [
    "$.nested.iconPath",
    "$.nested.colorToken:raw-hex",
  ]);
});

test("runCli writes a codex-ppt compatibility implementation map", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-codex-ppt-compat-"));
  try {
    const outPath = join(workDir, "codex-ppt-compat.json");
    const output: string[] = [];
    const exitCode = runCli([
      "codex-ppt",
      "compat",
      "--source-ref",
      "ningzimu/codex-ppt-skill@93c1e013965a3b42f272252030b2e1a5abede710",
      "--out",
      outPath,
    ], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const summary = JSON.parse(output.join("\n"));
    const report = JSON.parse(readFileSync(outPath, "utf-8"));
    assert.equal(summary.status, "pass");
    assert.equal(report.schemaVersion, "mdpr-codex-ppt-compat-v1");
    assert.equal(report.source.sourceRef, "ningzimu/codex-ppt-skill@93c1e013965a3b42f272252030b2e1a5abede710");
    assert.equal(report.features.length >= 16, true);
    assert.equal(report.features.every((feature: { mdprRail: string }) => feature.mdprRail !== "unmapped"), true);
    assert.equal(report.coverage.unmappedFeatureCount, 0);
    assert.equal(report.coverage.codexPptFeatureCount, report.features.length);
    assert.equal(report.implementationTodos.length, report.coverage.mdprRuntimeRequiredCount);
    assert.equal(report.implementationTodos.every((todo: { owner: string }) => todo.owner === "mdpr" || todo.owner === "mdpr-skill"), true);
    assert.equal(report.implementationTodos.every((todo: { featureIds: string[] }) => todo.featureIds.length >= 1), true);
    assert.equal(report.implementationTodos.every((todo: { acceptance: string[] }) => todo.acceptance.length >= 2), true);
    assert.equal(report.implementationTodos.every((todo: { validation: string[] }) => todo.validation.length >= 1), true);
    assert.equal(report.implementationTodos.every((todo: { dependsOn: string[] }) => Array.isArray(todo.dependsOn)), true);
    assert.deepEqual(report.implementationTodos.map((todo: { id: string }) => todo.id), []);
    assert.equal(
      report.features.find((feature: { id: string }) => feature.id === "per-slide-job-packets").implementationStatus,
      "supported",
    );
    assert.deepEqual(report.workflowStages.map((stage: { gate: string }) => stage.gate), [
      "source-intake",
      "outline-approval",
      "style-approval",
      "sample-or-preview-approval",
      "job-state-preparation",
      "parallel-generation-or-render",
      "qa-repair-notes-assembly",
      "style-library-save",
    ]);
    assert.equal(
      report.features.find((feature: { id: string }) => feature.id === "full-slide-image-generation").mdprAlternative,
      "editable-native-pptx-plus-generated-visual-assets",
    );
    assert.deepEqual(
      report.features.find((feature: { id: string }) => feature.id === "parallel-subagent-generation").requiredMdprSurfaces,
      ["codex-ppt slide-tasks", "codex-ppt job-state", "mdpr-job-state-v1"],
    );
    assert.equal(
      report.features.find((feature: { id: string }) => feature.id === "parallel-subagent-generation").implementationStatus,
      "supported",
    );
    assert.equal(
      report.features.find((feature: { id: string }) => feature.id === "built-in-style-references").implementationStatus,
      "supported",
    );
    assert.equal(
      report.features.find((feature: { id: string }) => feature.id === "image-provider-fallback").implementationStatus,
      "supported",
    );
    assert.equal(
      report.features.find((feature: { id: string }) => feature.id === "high-resolution-and-transparency").implementationStatus,
      "supported",
    );
    assert.equal(JSON.stringify(report).includes('"coordinates"'), false);
    assert.equal(JSON.stringify(report).includes('"rendererObjectId"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli exports codex-ppt compatible slide task packets without renderer internals", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-slide-tasks-"));
  try {
    const manifestPath = join(workDir, "mdpresent-manifest.json");
    const markdownPath = join(workDir, "deck.md");
    const imagesPath = join(workDir, "rendered-images.json");
    const outDir = join(workDir, "slide-tasks");
    writeFileSync(markdownPath, [
      "# Launch Review",
      "",
      "## Growth slowed but retention proof held.",
      "",
      "- Net retention stayed above 120%.",
      "- Expansion is concentrated in platform accounts.",
      "",
      "## Architecture explains the expansion path.",
      "",
      "API intake => workflow engine => governed output",
      "",
    ].join("\n"), "utf-8");
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: 1,
      engine: "mdpresent",
      source: { path: markdownPath, sha256: "abc123" },
      slideCount: 2,
      pptxObjects: [
        {
          slideId: "growth-slowed-but-retention-proof-held",
          layoutSlideId: "layout-growth",
          regionId: "title",
          blockIds: ["b1"],
          shapeName: "mdpr:growth:title:b1",
          objectKind: "native-text",
          role: "title",
          editable: true,
          x: 100,
          y: 200,
          color: "#ff0000",
          rendererObjectId: "secret-renderer-id",
        },
        {
          slideId: "growth-slowed-but-retention-proof-held",
          layoutSlideId: "layout-growth",
          regionId: "body",
          blockIds: ["b2"],
          shapeName: "mdpr:growth:body:b2",
          objectKind: "native-text",
          role: "body",
          editable: true,
        },
        {
          slideId: "architecture-explains-the-expansion-path",
          layoutSlideId: "layout-architecture",
          regionId: "diagram",
          blockIds: ["b3"],
          shapeName: "mdpr:architecture:diagram:b3",
          objectKind: "native-shape",
          role: "diagram",
          editable: true,
        },
      ],
    }), "utf-8");
    writeFileSync(imagesPath, JSON.stringify({
      images: [
        { slideId: "growth-slowed-but-retention-proof-held", imagePath: "png/slide-01.png", evidenceId: "preview-1" },
        { slideId: "architecture-explains-the-expansion-path", imagePath: "png/slide-02.png", evidenceId: "preview-2" },
      ],
    }), "utf-8");

    const output: string[] = [];
    const exitCode = runCli([
      "codex-ppt",
      "slide-tasks",
      "--manifest",
      manifestPath,
      "--markdown",
      markdownPath,
      "--rendered-images",
      imagesPath,
      "--out",
      outDir,
    ], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const summary = JSON.parse(output.join("\n"));
    assert.equal(summary.status, "pass");
    assert.equal(summary.packetCount, 2);
    const index = JSON.parse(readFileSync(join(outDir, "slide-task-packets.json"), "utf-8"));
    assert.equal(index.schemaVersion, "mdpr-slide-task-packet-set-v1");
    assert.equal(index.packets.length, 2);
    const first = JSON.parse(readFileSync(join(outDir, "slide_01.task.json"), "utf-8"));
    assert.equal(first.schemaVersion, "mdpr-slide-task-packet-v1");
    assert.equal(first.slide.slideId, "growth-slowed-but-retention-proof-held");
    assert.equal(first.slide.slideNumber, 1);
    assert.deepEqual(first.slide.roles.sort(), ["body", "title"]);
    assert.equal(first.renderedPreview.imagePath, "png/slide-01.png");
    assert.equal(first.boundary.mdprOwnsFinalLayout, true);
    assert.equal(first.boundary.noRendererInternals, true);
    assert.match(first.localContext.markdownExcerpt, /Net retention/);
    const serialized = JSON.stringify(first);
    assert.equal(serialized.includes("shapeName"), false);
    assert.equal(serialized.includes("layoutSlideId"), false);
    assert.equal(serialized.includes("rendererObjectId"), false);
    assert.equal(serialized.includes('"x"'), false);
    assert.equal(serialized.includes("#ff0000"), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli records codex-ppt compatible job state with evidence-bound completion", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-job-state-"));
  try {
    const tasksPath = join(workDir, "slide-task-packets.json");
    const manifestPath = join(workDir, "mdpresent-manifest.json");
    const statePath = join(workDir, "mdpr-job-state.json");
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: 1,
      engine: "mdpresent",
      slideCount: 2,
    }), "utf-8");
    writeFileSync(tasksPath, JSON.stringify({
      schemaVersion: "mdpr-slide-task-packet-set-v1",
      generatedBy: "mdpr-skill",
      packetCount: 2,
      packets: [
        {
          slideNumber: 1,
          slideId: "growth-slowed-but-retention-proof-held",
          path: "slide_01.task.json",
          roles: ["title", "body"],
          objectKinds: ["native-text"],
        },
        {
          slideNumber: 2,
          slideId: "architecture-explains-the-expansion-path",
          path: "slide_02.task.json",
          roles: ["diagram"],
          objectKinds: ["native-shape"],
        },
      ],
      boundary: {
        mdprOwnsFinalLayout: true,
        mdprOwnsFinalThemeBinding: true,
        noRendererInternals: true,
        forbiddenFieldCategories: ["geometry", "renderer-object-identity"],
      },
    }), "utf-8");

    const initOutput: string[] = [];
    assert.equal(runCli([
      "codex-ppt",
      "job-state",
      "init",
      "--tasks",
      tasksPath,
      "--manifest",
      manifestPath,
      "--out",
      statePath,
    ], {
      stdout: (value) => initOutput.push(value),
      stderr: () => undefined,
    }), 0);
    const initSummary = JSON.parse(initOutput.join("\n"));
    assert.equal(initSummary.status, "pass");
    assert.equal(initSummary.taskCount, 2);

    const missingEvidenceErrors: string[] = [];
    assert.equal(runCli([
      "codex-ppt",
      "job-state",
      "update",
      "--state",
      statePath,
      "--slide",
      "growth-slowed-but-retention-proof-held",
      "--status",
      "accepted",
      "--worker-id",
      "worker-a",
      "--out",
      statePath,
    ], {
      stdout: () => undefined,
      stderr: (value) => missingEvidenceErrors.push(value),
    }), 1);
    assert.match(missingEvidenceErrors.join("\n"), /evidence/);

    const updateOutput: string[] = [];
    assert.equal(runCli([
      "codex-ppt",
      "job-state",
      "update",
      "--state",
      statePath,
      "--slide",
      "growth-slowed-but-retention-proof-held",
      "--status",
      "accepted",
      "--worker-id",
      "worker-a",
      "--evidence",
      "review/slide-01.acceptance.json",
      "--out",
      statePath,
    ], {
      stdout: (value) => updateOutput.push(value),
      stderr: () => undefined,
    }), 0);
    const updateSummary = JSON.parse(updateOutput.join("\n"));
    assert.equal(updateSummary.status, "pass");
    assert.equal(updateSummary.slideId, "growth-slowed-but-retention-proof-held");
    assert.equal(updateSummary.taskStatus, "accepted");

    const statusOutput: string[] = [];
    assert.equal(runCli(["codex-ppt", "job-state", "status", "--state", statePath], {
      stdout: (value) => statusOutput.push(value),
      stderr: () => undefined,
    }), 0);
    const summary = JSON.parse(statusOutput.join("\n"));
    assert.equal(summary.schemaVersion, "mdpr-job-state-summary-v1");
    assert.equal(summary.total, 2);
    assert.equal(summary.byStatus.accepted, 1);
    assert.equal(summary.byStatus.pending, 1);
    assert.equal(summary.completionEvidencePolicy, "artifact-path-or-report-id-required");

    const validateOutput: string[] = [];
    assert.equal(runCli(["codex-ppt", "job-state", "validate", "--state", statePath], {
      stdout: (value) => validateOutput.push(value),
      stderr: () => undefined,
    }), 0);
    const validation = JSON.parse(validateOutput.join("\n"));
    assert.equal(validation.valid, true);

    const state = JSON.parse(readFileSync(statePath, "utf-8"));
    assert.equal(state.schemaVersion, "mdpr-job-state-v1");
    assert.equal(state.tasks.length, 2);
    assert.equal(state.tasks[0].status, "accepted");
    assert.equal(state.tasks[0].workerId, "worker-a");
    assert.equal(state.tasks[0].evidencePath, "review/slide-01.acceptance.json");
    assert.equal(state.boundary.noChatMessageCompletion, true);
    assert.equal(JSON.stringify(state).includes("rendererObjectId"), false);
    assert.equal(JSON.stringify(state).includes('"x"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli validates generated asset provider and quality metadata without secrets or full-slide rendering", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-generated-assets-"));
  try {
    const manifestPath = join(workDir, "generated-assets.json");
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: "mdpr-generated-assets-v1",
      generatedBy: "mdpr-skill",
      assets: [
        {
          assetId: "hero-architecture-visual",
          kind: "generated-image",
          purpose: "primary-visual",
          provider: {
            id: "openai-compatible",
            model: "image-model",
            promptHash: "a".repeat(64),
            sourceInputHashes: ["b".repeat(64)],
            supportsTransparency: false,
            supportedQualities: ["standard"],
          },
          request: {
            size: "1536x1024",
            quality: "hd",
            background: "transparent",
            transparency: "required",
          },
          output: {
            path: "assets/hero-architecture.png",
            mimeType: "image/png",
          },
          boundary: {
            mdprOwnsPlacement: true,
            notFullSlideRenderer: true,
            noSecrets: true,
          },
        },
      ],
    }), "utf-8");

    const output: string[] = [];
    assert.equal(runCli(["codex-ppt", "generated-assets", "validate", "--manifest", manifestPath], {
      stdout: (value) => output.push(value),
      stderr: () => undefined,
    }), 0);
    const validation = JSON.parse(output.join("\n"));
    assert.equal(validation.schemaVersion, "mdpr-generated-assets-validation-v1");
    assert.equal(validation.valid, true);
    assert.equal(validation.assetCount, 1);
    assert.match(validation.warnings.join("\n"), /transparency/);
    assert.match(validation.warnings.join("\n"), /quality/);

    const invalidPath = join(workDir, "generated-assets-invalid.json");
    writeFileSync(invalidPath, JSON.stringify({
      schemaVersion: "mdpr-generated-assets-v1",
      generatedBy: "mdpr-skill",
      assets: [
        {
          assetId: "slide-raster",
          kind: "generated-image",
          purpose: "full-slide-render",
          provider: {
            id: "custom",
            model: "image-model",
            promptHash: "c".repeat(64),
            apiKey: "secret",
          },
          request: {
            size: "1920x1080",
            quality: "high",
            background: "opaque",
            transparency: "not-needed",
            fullSlide: true,
          },
          boundary: {
            mdprOwnsPlacement: false,
            notFullSlideRenderer: false,
            noSecrets: false,
          },
        },
      ],
    }), "utf-8");
    const errors: string[] = [];
    assert.equal(runCli(["codex-ppt", "generated-assets", "validate", "--manifest", invalidPath], {
      stdout: () => undefined,
      stderr: (value) => errors.push(value),
    }), 1);
    assert.match(errors.join("\n"), /secret|full-slide|boundary/);
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
    assert.equal(manifest.hints[0].visualAssetCandidates[0].trigger, "explicit-generated-asset-request");
    assert.equal(manifest.hints[0].visualAssetCandidates[0].requestRef, "instruction:generated-asset-request");
    assert.equal(JSON.stringify(manifest).includes("iconPath"), false);
    assert.equal(JSON.stringify(manifest).includes('"coordinates"'), false);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runCli writes template-fill media and master-slide hint policies", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-skill-cli-hint-template-fill-"));
  try {
    const selectionContextPath = join(workDir, "selection-context.json");
    const outPath = join(workDir, "agent-hint.json");
    writeFileSync(selectionContextPath, JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-preview",
        sourceSha256: "f".repeat(64),
      },
      slideId: "slide-template-fill",
      overlappedBlocks: ["claim-1", "proof-1", "detail-1"],
      userInstruction: "핵심 메시지를 강조하고 가독성 좋게 줄여줘. 이미지는 쓰지 말고 기존 PPT 테마를 유지해.",
    }), "utf-8");

    const exitCode = runCli([
      "hint",
      "--selection-context",
      selectionContextPath,
      "--workflow-intent",
      "template-fill",
      "--template-source",
      "hcs-template",
      "--preserve-master-slides",
      "true",
      "--image-policy",
      "no-image",
      "--image-search-policy",
      "disabled",
      "--icon-policy",
      "no-new-icons",
      "--out",
      outPath,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
    });

    assert.equal(exitCode, 0);
    const manifest = JSON.parse(readFileSync(outPath, "utf-8"));
    const hint = manifest.hints[0];
    assert.equal(hint.workflowIntentCandidate.intent, "template-fill");
    assert.equal(hint.templateUseCandidate.masterSlidePolicy, "preserve-existing-master-slides");
    assert.equal(hint.mediaPolicyCandidate.imageUse, "no-image");
    assert.equal(hint.mediaPolicyCandidate.imageSearch, "disabled");
    assert.equal(hint.mediaPolicyCandidate.iconUse, "no-new-icons");
    assert.equal(hint.visualAssetCandidates, undefined);
    assert.equal(hint.iconKeywordCandidates, undefined);
    assert.equal(hint.keyMessageCandidates[0].messageRole, "main-takeaway");
    assert.equal(JSON.stringify(hint).includes('"coordinates"'), false);
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
    assert.equal(hints.hints[0].visualAssetCandidates[0].trigger, "explicit-generated-asset-request");
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
