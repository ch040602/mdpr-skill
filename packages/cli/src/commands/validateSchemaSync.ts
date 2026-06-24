import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const validateSchemaSyncCommand = "python -m unittest tests.test_agent_hint_schema_sync";

export type ValidateSchemaSyncInput = {
  mdprPath?: string;
  localSchemaPath?: string;
};

export type ValidateSchemaSyncResult = {
  status: "pass" | "fail";
  findings: string[];
  localSchemaPath: string;
  mdprSchemaPath: string;
};

export function runValidateSchemaSync(input: ValidateSchemaSyncInput = {}): ValidateSchemaSyncResult {
  const localSchemaPath = resolve(input.localSchemaPath ?? "schemas/agent-hint.schema.json");
  const mdprSchemaPath = resolve(input.mdprPath ?? ".cache/mdpr", "schemas", "agent-hint.schema.json");
  const findings: string[] = [];

  if (!existsSync(localSchemaPath)) findings.push(`local agent-hint schema is missing: ${localSchemaPath}`);
  if (!existsSync(mdprSchemaPath)) findings.push(`MDPR agent-hint schema is missing: ${mdprSchemaPath}`);
  if (findings.length === 0) {
    const localSchema = readFileSync(localSchemaPath, "utf-8");
    const mdprSchema = readFileSync(mdprSchemaPath, "utf-8");
    if (localSchema !== mdprSchema) {
      findings.push("agent-hint schema drift detected between mdpr-skill and MDPR");
    }
  }

  return {
    status: findings.length === 0 ? "pass" : "fail",
    findings,
    localSchemaPath,
    mdprSchemaPath,
  };
}
