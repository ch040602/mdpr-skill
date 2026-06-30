import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  defaultSharedSchemaNames,
  runValidateSchemaSync,
} from "../packages/cli/src/commands/validateSchemaSync";

test("runValidateSchemaSync reports synced and drifted agent hint schemas", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-schema-sync-"));
  try {
    const localSchema = join(workDir, "local", "agent-hint.schema.json");
    const mdprSchema = join(workDir, "mdpr", "schemas", "agent-hint.schema.json");
    mkdirSync(join(workDir, "local"), { recursive: true });
    mkdirSync(join(workDir, "mdpr", "schemas"), { recursive: true });
    writeFileSync(localSchema, JSON.stringify({
      type: "object",
      required: ["schemaVersion", "sourceSha256", "hints"],
      additionalProperties: false,
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
              intentCandidates: {
                type: "array",
                items: { properties: { intent: { enum: ["summary", "evidence"] } } },
              },
              groupCandidates: {
                type: "array",
                items: { properties: { role: { enum: ["claim", "evidence-pack"] } } },
              },
              importanceCandidates: {
                type: "array",
                items: { properties: { importance: { enum: ["primary", "supporting"] } } },
              },
            },
          },
        },
      },
    }, null, 2), "utf-8");
    writeFileSync(mdprSchema, '{"properties":{"hints":{"items":{"additionalProperties":false,"properties":{"importanceCandidates":{"items":{"properties":{"importance":{"enum":["supporting","primary"]}}},"type":"array"},"groupCandidates":{"items":{"properties":{"role":{"enum":["evidence-pack","claim"]}}},"type":"array"},"intentCandidates":{"items":{"properties":{"intent":{"enum":["evidence","summary"]}}},"type":"array"},"confidence":{"maximum":1,"minimum":0,"type":"number"}},"type":"object"},"type":"array"},"sourceSha256":{"pattern":"^[a-f0-9]{64}$","type":"string"},"schemaVersion":{"const":"mdpr-agent-hint-v1"}},"additionalProperties":false,"required":["hints","sourceSha256","schemaVersion"],"type":"object"}\n', "utf-8");

    const pass = runValidateSchemaSync({ localSchemaPath: localSchema, mdprPath: join(workDir, "mdpr"), sharedSchemaNames: [] });
    assert.equal(pass.status, "pass");
    assert.deepEqual(pass.findings, []);

    writeFileSync(mdprSchema, '{"properties":{"schemaVersion":{"const":"changed"}},"required":["schemaVersion"]}\n', "utf-8");
    const fail = runValidateSchemaSync({ localSchemaPath: localSchema, mdprPath: join(workDir, "mdpr"), sharedSchemaNames: [] });
    assert.equal(fail.status, "fail");
    assert.match(fail.findings.join("\n"), /schemaVersion const drift/);
    assert.equal(fail.localSchemaPath, localSchema);
    assert.equal(fail.mdprSchemaPath, mdprSchema);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("runValidateSchemaSync checks shared MDPR bridge schema copies", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-shared-schema-sync-"));
  try {
    const localDir = join(workDir, "local");
    const mdprDir = join(workDir, "mdpr");
    mkdirSync(localDir, { recursive: true });
    mkdirSync(join(mdprDir, "schemas"), { recursive: true });
    const agentHintSchema = {
      type: "object",
      required: ["schemaVersion", "sourceSha256", "hints"],
      additionalProperties: false,
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
              intentCandidates: { type: "array", items: { properties: { intent: { enum: ["summary"] } } } },
              groupCandidates: { type: "array", items: { properties: { role: { enum: ["claim"] } } } },
              importanceCandidates: { type: "array", items: { properties: { importance: { enum: ["primary"] } } } },
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
    writeFileSync(join(localDir, "agent-hint.schema.json"), JSON.stringify(agentHintSchema), "utf-8");
    writeFileSync(join(mdprDir, "schemas", "agent-hint.schema.json"), JSON.stringify(agentHintSchema), "utf-8");
    writeFileSync(join(localDir, "mdpr-pptx-object-map.schema.json"), JSON.stringify(objectMapSchema), "utf-8");
    writeFileSync(join(mdprDir, "schemas", "mdpr-pptx-object-map.schema.json"), JSON.stringify(objectMapSchema), "utf-8");

    const pass = runValidateSchemaSync({
      localSchemaPath: join(localDir, "agent-hint.schema.json"),
      mdprPath: mdprDir,
      sharedSchemaNames: ["mdpr-pptx-object-map.schema.json"],
    });
    assert.equal(pass.status, "pass");

    writeFileSync(join(mdprDir, "schemas", "mdpr-pptx-object-map.schema.json"), JSON.stringify({
      ...objectMapSchema,
      properties: { schemaVersion: { const: "changed" }, objects: { type: "array" } },
    }), "utf-8");
    const fail = runValidateSchemaSync({
      localSchemaPath: join(localDir, "agent-hint.schema.json"),
      mdprPath: mdprDir,
      sharedSchemaNames: ["mdpr-pptx-object-map.schema.json"],
    });
    assert.equal(fail.status, "fail");
    assert.match(fail.findings.join("\n"), /shared schema drift: mdpr-pptx-object-map\.schema\.json/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("default schema sync covers promoted MDPR bridge and design schemas", () => {
  assert.deepEqual([...defaultSharedSchemaNames].sort(), [
    "mdpr-html-design-analysis.schema.json",
    "mdpr-codex-ppt-compat.schema.json",
    "mdpr-generated-assets.schema.json",
    "mdpr-job-state.schema.json",
    "mdpr-ppt-pack-candidate.schema.json",
    "mdpr-ppt-selection.schema.json",
    "mdpr-pptx-object-map.schema.json",
    "mdpr-selection-context.schema.json",
    "mdpr-theme-candidate.schema.json",
    "mdpr-user-override-candidate.schema.json",
  ].sort());

  if (!existsSync(join(".cache", "mdpr", "schemas", "agent-hint.schema.json"))) {
    return;
  }

  const result = runValidateSchemaSync({ mdprPath: ".cache/mdpr" });
  assert.equal(result.status, "pass", result.findings.join("\n"));
});
