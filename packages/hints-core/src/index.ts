export type SkillHint = {
  slideId: string;
  intentCandidate?: string;
  confidence: number;
  groupCandidates?: Array<{ elementIds: string[]; role: string; confidence: number }>;
  importanceCandidates?: Array<{ elementId: string; importance: "primary" | "secondary" | "supporting"; confidence: number }>;
  iconKeywordCandidates?: string[];
  visualAssetCandidates?: VisualAssetCandidate[];
  rationale?: string;
};

export type VisualAssetCandidate = {
  kind: "generated-image";
  trigger: "large-or-ambiguous-icon";
  semanticPrompt: string;
  confidence: number;
};

export type AgentHintManifest = {
  schemaVersion: "mdpr-agent-hint-v1";
  sourceSha256: string;
  mdprVersion?: string;
  generatedBy: "mdpr-skill";
  generatedAt: string;
  hints: SkillHint[];
};

export type SelectionContext = {
  schemaVersion: "mdpr-selection-context-v1";
  source: { kind: "mdpr-ppt" | "mdpr-preview"; sourceSha256: string };
  slideId: string;
  overlappedBlocks?: string[];
  overlappedRegions?: string[];
  screenshotPath?: string;
  selectionPath?: string;
  userInstruction?: string;
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

export function hintFromSelectionContext(context: SelectionContext): SkillHint {
  const blockIds = [...new Set(context.overlappedBlocks ?? [])].filter(Boolean);
  const groupCandidates = blockIds.length >= 2
    ? [{ elementIds: blockIds, role: "evidence-pack", confidence: 0.78 }]
    : undefined;
  const visualAssetCandidates = buildVisualAssetCandidates(context.userInstruction);
  return {
    slideId: context.slideId,
    confidence: groupCandidates ? 0.78 : visualAssetCandidates ? 0.72 : 0.62,
    ...(groupCandidates ? { groupCandidates } : {}),
    ...(visualAssetCandidates ? { visualAssetCandidates } : {}),
    rationale: visualAssetCandidates
      ? "Selection context suggests generated imagery may be safer than a large or ambiguous icon; final assets remain MDPR-owned."
      : context.userInstruction
      ? "Selection context suggests semantic grouping; final layout remains MDPR-owned."
      : "Selection context supplied block handles; final layout remains MDPR-owned.",
  };
}

function buildVisualAssetCandidates(userInstruction: string | undefined): VisualAssetCandidate[] | undefined {
  if (!userInstruction || !shouldSuggestGeneratedImage(userInstruction)) return undefined;
  return [{
    kind: "generated-image",
    trigger: "large-or-ambiguous-icon",
    semanticPrompt: buildSemanticImagePrompt(userInstruction),
    confidence: 0.72,
  }];
}

function shouldSuggestGeneratedImage(userInstruction: string): boolean {
  const text = userInstruction.toLowerCase();
  const mentionsIcon = /\b(icon|icons|glyph|pictogram)\b|아이콘/.test(text);
  const mentionsLarge = /\b(large|big|oversized|too large)\b|크거나|크다|큰|대형|너무 크/.test(text);
  const mentionsAmbiguous = /\b(ambiguous|unclear|vague|metaphor|symbolic)\b|애매|모호|비유|메타포|상징/.test(text);
  const asksForGeneratedImage = /\b(generate an image|generate image|generated image|image generation)\b|이미지 생성|생성 이미지|그림 생성/.test(text);
  return mentionsIcon && (mentionsLarge || mentionsAmbiguous || asksForGeneratedImage);
}

function buildSemanticImagePrompt(userInstruction: string): string {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "be",
    "icon",
    "icons",
    "instead",
    "is",
    "need",
    "of",
    "the",
    "to",
    "too",
    "would",
  ]);
  const tokens = userInstruction
    .toLowerCase()
    .match(/[a-z0-9가-힣]+/g) ?? [];
  const semanticTokens = tokens
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .slice(0, 8);
  const prompt = semanticTokens.join(" ") || "generated image semantic visual";
  return prompt.length <= 160 ? prompt : prompt.slice(0, 160).trimEnd();
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
