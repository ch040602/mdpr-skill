import assert from "node:assert/strict";
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
  assert.match(output.join("\n"), /eval/);
  assert.match(output.join("\n"), /design/);
  assert.match(output.join("\n"), /edit/);
  assert.match(output.join("\n"), /gate/);
  assert.match(output.join("\n"), /change/);
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
