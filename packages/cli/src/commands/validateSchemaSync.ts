import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const validateSchemaSyncCommand = "python -m unittest tests.test_agent_hint_schema_sync";

export type ValidateSchemaSyncInput = {
  mdprPath?: string;
  localSchemaPath?: string;
  sharedSchemaNames?: string[];
};

export type ValidateSchemaSyncResult = {
  status: "pass" | "fail";
  findings: string[];
  localSchemaPath: string;
  mdprSchemaPath: string;
};

export const defaultSharedSchemaNames = [
  "mdpr-pptx-object-map.schema.json",
  "mdpr-selection-context.schema.json",
  "mdpr-ppt-selection.schema.json",
  "mdpr-ppt-pack-candidate.schema.json",
  "mdpr-user-override-candidate.schema.json",
  "mdpr-theme-candidate.schema.json",
  "mdpr-html-design-analysis.schema.json",
] as const;

export function runValidateSchemaSync(input: ValidateSchemaSyncInput = {}): ValidateSchemaSyncResult {
  const localSchemaPath = resolve(input.localSchemaPath ?? "schemas/agent-hint.schema.json");
  const mdprSchemaPath = resolve(input.mdprPath ?? ".cache/mdpr", "schemas", "agent-hint.schema.json");
  const localSchemaDir = dirname(localSchemaPath);
  const mdprSchemaDir = resolve(input.mdprPath ?? ".cache/mdpr", "schemas");
  const findings: string[] = [];

  if (!existsSync(localSchemaPath)) findings.push(`local agent-hint schema is missing: ${localSchemaPath}`);
  if (!existsSync(mdprSchemaPath)) findings.push(`MDPR agent-hint schema is missing: ${mdprSchemaPath}`);
  if (findings.length === 0) {
    findings.push(...compareAgentHintSchemas(
      readSchema(localSchemaPath, "local agent-hint schema"),
      readSchema(mdprSchemaPath, "MDPR agent-hint schema"),
    ));
  }
  const sharedSchemaNames = input.sharedSchemaNames ?? [...defaultSharedSchemaNames];
  for (const schemaName of sharedSchemaNames) {
    const localSharedPath = resolve(localSchemaDir, schemaName);
    const mdprSharedPath = resolve(mdprSchemaDir, schemaName);
    if (!existsSync(localSharedPath)) {
      findings.push(`local shared schema is missing: ${localSharedPath}`);
      continue;
    }
    if (!existsSync(mdprSharedPath)) {
      findings.push(`MDPR shared schema is missing: ${mdprSharedPath}`);
      continue;
    }
    const localShared = readSchema(localSharedPath, `local shared schema ${schemaName}`);
    const mdprShared = readSchema(mdprSharedPath, `MDPR shared schema ${schemaName}`);
    const localParseError = typeof localShared.__parseError === "string" ? localShared.__parseError : undefined;
    const mdprParseError = typeof mdprShared.__parseError === "string" ? mdprShared.__parseError : undefined;
    if (localParseError || mdprParseError) {
      if (localParseError) findings.push(localParseError);
      if (mdprParseError) findings.push(mdprParseError);
      continue;
    }
    if (stableStringify(localShared) !== stableStringify(mdprShared)) {
      findings.push(`shared schema drift: ${schemaName}`);
    }
  }

  return {
    status: findings.length === 0 ? "pass" : "fail",
    findings,
    localSchemaPath,
    mdprSchemaPath,
  };
}

function readSchema(path: string, label: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  } catch (error) {
    return {
      __parseError: `${label} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function compareAgentHintSchemas(
  localSchema: Record<string, unknown>,
  mdprSchema: Record<string, unknown>,
): string[] {
  const findings: string[] = [];
  const localParseError = typeof localSchema.__parseError === "string" ? localSchema.__parseError : undefined;
  const mdprParseError = typeof mdprSchema.__parseError === "string" ? mdprSchema.__parseError : undefined;
  if (localParseError) findings.push(localParseError);
  if (mdprParseError) findings.push(mdprParseError);
  if (findings.length > 0) return findings;

  compareScalar(findings, "schemaVersion const", schemaVersionConst(localSchema), schemaVersionConst(mdprSchema));
  compareStringSet(findings, "required fields", requiredFields(localSchema), requiredFields(mdprSchema));
  compareScalar(findings, "additionalProperties policy", additionalPropertiesPolicy(localSchema), additionalPropertiesPolicy(mdprSchema));
  compareScalar(findings, "sourceSha256 pattern", sourceShaPattern(localSchema), sourceShaPattern(mdprSchema));
  compareScalar(findings, "confidence minimum", confidenceLimit(localSchema, "minimum"), confidenceLimit(mdprSchema, "minimum"));
  compareScalar(findings, "confidence maximum", confidenceLimit(localSchema, "maximum"), confidenceLimit(mdprSchema, "maximum"));
  compareStringSet(findings, "intent enum", enumAt(localSchema, ["hints", "items", "properties", "intentCandidates", "items", "properties", "intent"]), enumAt(mdprSchema, ["hints", "items", "properties", "intentCandidates", "items", "properties", "intent"]));
  compareStringSet(findings, "group role enum", enumAt(localSchema, ["hints", "items", "properties", "groupCandidates", "items", "properties", "role"]), enumAt(mdprSchema, ["hints", "items", "properties", "groupCandidates", "items", "properties", "role"]));
  compareStringSet(findings, "importance enum", enumAt(localSchema, ["hints", "items", "properties", "importanceCandidates", "items", "properties", "importance"]), enumAt(mdprSchema, ["hints", "items", "properties", "importanceCandidates", "items", "properties", "importance"]));

  return findings;
}

function schemaVersionConst(schema: Record<string, unknown>): unknown {
  return propertyAt(schema, ["schemaVersion", "const"]);
}

function requiredFields(schema: Record<string, unknown>): string[] {
  return stringArray(schema.required);
}

function additionalPropertiesPolicy(schema: Record<string, unknown>): unknown {
  return schema.additionalProperties;
}

function sourceShaPattern(schema: Record<string, unknown>): unknown {
  return propertyAt(schema, ["sourceSha256", "pattern"]);
}

function confidenceLimit(schema: Record<string, unknown>, key: "minimum" | "maximum"): unknown {
  return nestedValue(schema, ["properties", "hints", "items", "properties", "confidence", key]);
}

function enumAt(schema: Record<string, unknown>, propertyPath: string[]): string[] {
  return stringArray(propertyAt(schema, [...propertyPath, "enum"]));
}

function propertyAt(schema: Record<string, unknown>, propertyPath: string[]): unknown {
  return nestedValue(schema, ["properties", ...propertyPath]);
}

function nestedValue(root: unknown, path: string[]): unknown {
  let current = root;
  for (const part of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function compareScalar(findings: string[], label: string, localValue: unknown, mdprValue: unknown): void {
  if (localValue !== mdprValue) {
    findings.push(`${label} drift: local=${JSON.stringify(localValue)} mdpr=${JSON.stringify(mdprValue)}`);
  }
}

function compareStringSet(findings: string[], label: string, localValues: string[], mdprValues: string[]): void {
  const localSorted = [...localValues].sort();
  const mdprSorted = [...mdprValues].sort();
  if (localSorted.length !== mdprSorted.length || localSorted.some((value, index) => value !== mdprSorted[index])) {
    findings.push(`${label} drift: local=${JSON.stringify(localSorted)} mdpr=${JSON.stringify(mdprSorted)}`);
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}
