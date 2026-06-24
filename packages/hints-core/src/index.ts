export type SkillHint = {
  slideId: string;
  intentCandidate?: string;
  confidence: number;
  groupCandidates?: Array<{ elementIds: string[]; role: string; confidence: number }>;
  importanceCandidates?: Array<{ elementId: string; importance: "primary" | "secondary" | "supporting"; confidence: number }>;
  iconKeywordCandidates?: string[];
  rationale?: string;
};

export type AgentHintManifest = {
  schemaVersion: "mdpr-agent-hint-v1";
  sourceSha256: string;
  mdprVersion?: string;
  generatedBy: "mdpr-skill";
  generatedAt: string;
  hints: SkillHint[];
};

export const FORBIDDEN_AGENT_HINT_FIELDS = [
  "recipeId",
  "variantId",
  "box",
  "x",
  "y",
  "w",
  "h",
  "color",
  "colors",
  "fontSize",
  "fontFamily",
  "typography",
  "zOrder",
  "z-order",
  "radius",
  "shadow",
  "effect",
  "arrow",
  "component",
  "style",
  "iconPath",
  "iconName",
  "coordinates",
  "geometry",
  "rendererObjectId",
] as const;

export function buildAgentHintManifest(
  sourceSha256: string,
  hints: SkillHint[],
  options: { mdprVersion?: string; generatedAt?: string } = {},
): AgentHintManifest {
  const manifest: AgentHintManifest = {
    schemaVersion: "mdpr-agent-hint-v1",
    sourceSha256,
    ...(options.mdprVersion ? { mdprVersion: options.mdprVersion } : {}),
    generatedBy: "mdpr-skill",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    hints,
  };
  assertNoForbiddenFields(manifest);
  return manifest;
}

export function assertNoForbiddenFields(value: unknown, path = "$"): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((FORBIDDEN_AGENT_HINT_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`${path}.${key} is a forbidden final-decision field for mdpr-skill hints`);
    }
    if (Array.isArray(child)) child.forEach((item, index) => assertNoForbiddenFields(item, `${path}.${key}[${index}]`));
    else assertNoForbiddenFields(child, `${path}.${key}`);
  }
}
