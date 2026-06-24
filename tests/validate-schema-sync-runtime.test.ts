import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runValidateSchemaSync } from "../packages/cli/src/commands/validateSchemaSync";

test("runValidateSchemaSync reports synced and drifted agent hint schemas", () => {
  const workDir = mkdtempSync(join(tmpdir(), "mdpr-schema-sync-"));
  try {
    const localSchema = join(workDir, "local", "agent-hint.schema.json");
    const mdprSchema = join(workDir, "mdpr", "schemas", "agent-hint.schema.json");
    mkdirSync(join(workDir, "local"), { recursive: true });
    mkdirSync(join(workDir, "mdpr", "schemas"), { recursive: true });
    writeFileSync(localSchema, '{"schemaVersion":"mdpr-agent-hint-v1"}\n', "utf-8");
    writeFileSync(mdprSchema, '{"schemaVersion":"mdpr-agent-hint-v1"}\n', "utf-8");

    const pass = runValidateSchemaSync({ localSchemaPath: localSchema, mdprPath: join(workDir, "mdpr") });
    assert.equal(pass.status, "pass");
    assert.deepEqual(pass.findings, []);

    writeFileSync(mdprSchema, '{"schemaVersion":"changed"}\n', "utf-8");
    const fail = runValidateSchemaSync({ localSchemaPath: localSchema, mdprPath: join(workDir, "mdpr") });
    assert.equal(fail.status, "fail");
    assert.match(fail.findings.join("\n"), /agent-hint schema drift/);
    assert.equal(fail.localSchemaPath, localSchema);
    assert.equal(fail.mdprSchemaPath, mdprSchema);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

