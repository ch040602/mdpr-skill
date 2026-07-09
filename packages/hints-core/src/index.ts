export type SkillHint = {
  slideId: string;
  workflowIntentCandidate?: WorkflowIntentCandidate;
  intentCandidate?: string;
  confidence: number;
  groupCandidates?: Array<{ elementIds: string[]; role: string; confidence: number }>;
  importanceCandidates?: Array<{ elementId: string; importance: "primary" | "secondary" | "supporting"; confidence: number }>;
  keyMessageCandidates?: KeyMessageCandidate[];
  contentSplitCandidates?: ContentSplitCandidate[];
  readabilityCandidates?: ReadabilityCandidate[];
  templateUseCandidate?: TemplateUseCandidate;
  mediaPolicyCandidate?: MediaPolicyCandidate;
  iconKeywordCandidates?: IconKeywordCandidate[];
  visualAssetCandidates?: VisualAssetCandidate[];
  rationale?: string;
};

export type WorkflowIntent = "template-fill" | "style-transform" | "theme-import" | "generated-asset-request";

export type WorkflowIntentCandidate = {
  intent: WorkflowIntent;
  confidence: number;
  evidenceRefs: string[];
};

export type KeyMessageCandidate = {
  messageRole: "main-takeaway" | "decision-needed" | "risk-callout" | "proof-anchor" | "section-transition";
  emphasisLevel: "primary" | "secondary" | "supporting";
  elementIds: string[];
  evidenceRefs?: string[];
  claimRef?: string;
  preferredPlaceholderRole?: "title" | "subtitle" | "body" | "callout" | "caption";
  reason: string;
  confidence: number;
};

export type ContentSplitCandidate = {
  reason: "dense-content" | "mixed-topics" | "long-bullets" | "evidence-overload";
  elementIds: string[];
  preferredSplitBy: "h2" | "h3" | "h4" | "block-group" | "list-chunk";
  confidence: number;
};

export type ReadabilityCandidate = {
  action: "shorten-copy" | "plain-language" | "reduce-bullet-count" | "claim-title" | "move-detail-to-notes";
  elementIds: string[];
  reason: string;
  confidence: number;
};

export type TemplateUseCandidate = {
  templateSourceRef: string;
  masterSlidePolicy: "preserve-existing-master-slides" | "use-master-as-theme-source";
  placeholderPolicy: "prefer-existing-placeholders" | "fill-named-slots-only";
  confidence: number;
};

export type MediaPolicyCandidate = {
  imageUse: "no-image" | "source-image-only" | "generated-asset-approved";
  imageSearch: "disabled" | "source-evidence-only" | "explicit-request-only";
  iconUse: "no-new-icons" | "semantic-keywords-only";
  evidenceRefs: string[];
};

export type IconKeywordCandidate = {
  keyword: string;
  elementIds: string[];
  evidenceRefs: string[];
  reason: string;
  confidence: number;
  workflowIntentRef?: string;
};

export type VisualAssetCandidate = {
  kind: "generated-image";
  trigger: "explicit-generated-asset-request";
  requestRef: string;
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

export type AgentHintPreflightFinding = {
  severity: "info" | "warning";
  type:
    | "MULTIPLE_PRIMARY_KEY_MESSAGES"
    | "KEY_MESSAGE_EVIDENCE_MISSING"
    | "HINT_RESTATES_SOURCE_ELEMENTS"
    | "TEMPLATE_FILL_HINT_POLICY_CONFLICT"
    | "MEDIA_POLICY_CANDIDATE_CONFLICT"
    | "MEDIA_PERMISSION_EVIDENCE_MISSING"
    | "RUNTIME_OWNERSHIP_FIELD_CONFLICT"
    | "STYLE_TRANSFORM_EVIDENCE_MISSING"
    | "DUPLICATE_HINT_CANDIDATE";
  slideId: string;
  evidence: Record<string, unknown>;
  suggestion: {
    kind: "mdpr-skill-preflight";
    target: string;
    operation: "reduce" | "addEvidence" | "removeConflict" | "dedupe";
  };
};

export type AgentHintPreflightOptions = {
  sourceElementIdsBySlide?: Record<string, string[]>;
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
  workflowIntent?: WorkflowIntent;
  templateSourceRef?: string;
  preserveMasterSlides?: boolean;
  sourceImageRefs?: string[];
  sourceEvidenceRefs?: string[];
  explicitGeneratedAssetRequestRef?: string;
  imagePolicy?: MediaPolicyCandidate["imageUse"];
  imageSearchPolicy?: MediaPolicyCandidate["imageSearch"];
  iconPolicy?: MediaPolicyCandidate["iconUse"];
};

export type HintBuildOptions = {
  workflowIntent?: WorkflowIntent;
  templateSourceRef?: string;
  preserveMasterSlides?: boolean;
  sourceImageRefs?: string[];
  sourceEvidenceRefs?: string[];
  explicitGeneratedAssetRequestRef?: string;
  imagePolicy?: MediaPolicyCandidate["imageUse"];
  imageSearchPolicy?: MediaPolicyCandidate["imageSearch"];
  iconPolicy?: MediaPolicyCandidate["iconUse"];
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
  "crop",
  "cropRect",
  "exactIcon",
  "finalImageAsset",
  "finalImagePath",
  "geometry",
  "layoutId",
  "rendererObject",
  "rendererObjectId",
] as const;

export type RoundTodoProposal = {
  id?: string;
  title: string;
  owner?: string;
  rationale?: string;
  files?: string[];
  acceptance?: string[];
  validation?: string[];
  evidenceRefs?: string[];
};

export type RoundTodoQualityFinding = {
  severity: "info" | "warning";
  type: "ROUND_TODO_DUPLICATE_OR_VAGUE" | "ROUND_TODO_EVIDENCE_MISSING";
  todoTitle: string;
  evidence: Record<string, unknown>;
  suggestion: {
    kind: "mdpr-skill-round-review";
    target: string;
    operation: "dedupe" | "addEvidence" | "reduce";
  };
};

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

export function hintFromSelectionContext(context: SelectionContext, options: HintBuildOptions = {}): SkillHint {
  const blockIds = [...new Set(context.overlappedBlocks ?? [])].filter(Boolean);
  const groupCandidates = blockIds.length >= 2
    ? [{ elementIds: blockIds, role: "evidence-pack", confidence: 0.78 }]
    : undefined;
  const merged = mergeHintOptions(context, options);
  const workflowIntentCandidate = buildWorkflowIntentCandidate(context, merged);
  const templateUseCandidate = buildTemplateUseCandidate(merged);
  const mediaPolicyCandidate = buildMediaPolicyCandidate(context, merged);
  const keyMessageCandidates = buildKeyMessageCandidates(context.userInstruction, blockIds, merged.sourceEvidenceRefs);
  const contentSplitCandidates = buildContentSplitCandidates(context.userInstruction, blockIds);
  const readabilityCandidates = buildReadabilityCandidates(context.userInstruction, blockIds);
  const iconKeywordCandidates = buildIconKeywordCandidates(
    context.userInstruction,
    mediaPolicyCandidate.iconUse,
    blockIds,
    merged.sourceEvidenceRefs.length ? merged.sourceEvidenceRefs : mediaPolicyCandidate.evidenceRefs,
    workflowIntentCandidate,
  );
  const visualAssetCandidates = buildVisualAssetCandidates(context.userInstruction, merged, mediaPolicyCandidate);
  return {
    slideId: context.slideId,
    confidence: groupCandidates ? 0.78 : visualAssetCandidates ? 0.72 : 0.62,
    ...(workflowIntentCandidate ? { workflowIntentCandidate } : {}),
    ...(groupCandidates ? { groupCandidates } : {}),
    ...(keyMessageCandidates ? { keyMessageCandidates } : {}),
    ...(contentSplitCandidates ? { contentSplitCandidates } : {}),
    ...(readabilityCandidates ? { readabilityCandidates } : {}),
    ...(templateUseCandidate ? { templateUseCandidate } : {}),
    ...(mediaPolicyCandidate ? { mediaPolicyCandidate } : {}),
    ...(iconKeywordCandidates ? { iconKeywordCandidates } : {}),
    ...(visualAssetCandidates ? { visualAssetCandidates } : {}),
    rationale: visualAssetCandidates
      ? "Selection context contains explicit generated-asset evidence; final asset acceptance and placement remain MDPR-owned."
      : context.userInstruction
      ? "Selection context suggests semantic grouping; final layout remains MDPR-owned."
      : "Selection context supplied block handles; final layout remains MDPR-owned.",
  };
}

export function validateAgentHintPreflight(
  input: AgentHintManifest | SkillHint[],
  options: AgentHintPreflightOptions = {},
): AgentHintPreflightFinding[] {
  const hints = Array.isArray(input) ? input : input.hints;
  const findings: AgentHintPreflightFinding[] = [];
  for (const hint of hints) {
    const forbiddenPaths = forbiddenFieldPaths(hint);
    if (forbiddenPaths.length) {
      findings.push({
        severity: "warning",
        type: "RUNTIME_OWNERSHIP_FIELD_CONFLICT",
        slideId: hint.slideId,
        evidence: {
          fieldPaths: forbiddenPaths,
          rule: "mdpr-skill-hints-must-not-own-geometry-theme-assets-or-renderer-objects",
          runtimeOwner: "MDPR",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.runtimeOwnership",
          operation: "removeConflict",
        },
      });
    }

    const primaryKeyMessages = (hint.keyMessageCandidates ?? []).filter((candidate) => candidate.emphasisLevel === "primary");
    if (primaryKeyMessages.length > 1) {
      findings.push({
        severity: "warning",
        type: "MULTIPLE_PRIMARY_KEY_MESSAGES",
        slideId: hint.slideId,
        evidence: {
          primaryCandidateCount: primaryKeyMessages.length,
          messageRoles: primaryKeyMessages.map((candidate) => candidate.messageRole),
          rule: "one-primary-key-message-per-slide-unless-comparison-is-explicit",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.keyMessageCandidates.primary",
          operation: "reduce",
        },
      });
    }

    for (const candidate of hint.keyMessageCandidates ?? []) {
      const hasGrounding = Boolean(candidate.evidenceRefs?.length || candidate.claimRef);
      const sectionTransitionWithRef = candidate.messageRole === "section-transition" && candidate.elementIds.some((id) => /section|heading|narrative/i.test(id));
      if (!candidate.elementIds?.length || !candidate.reason || !candidate.confidence || candidate.emphasisLevel === "primary" && !hasGrounding && !sectionTransitionWithRef) {
        findings.push({
          severity: "warning",
          type: "KEY_MESSAGE_EVIDENCE_MISSING",
          slideId: hint.slideId,
          evidence: {
            messageRole: candidate.messageRole,
            hasElementRefs: Boolean(candidate.elementIds?.length),
            hasEvidenceRefs: hasGrounding,
            hasReason: Boolean(candidate.reason),
            hasConfidence: Boolean(candidate.confidence),
          },
          suggestion: {
            kind: "mdpr-skill-preflight",
            target: "hints.keyMessageCandidates.evidence",
            operation: "addEvidence",
          },
        });
      }
    }

    const sourceElementIds = options.sourceElementIdsBySlide?.[hint.slideId] ?? [];
    const referencedElementIds = referencedHintElementIds(hint);
    if (sourceElementIds.length >= 4 && referencedElementIds.size >= sourceElementIds.length) {
      findings.push({
        severity: "warning",
        type: "HINT_RESTATES_SOURCE_ELEMENTS",
        slideId: hint.slideId,
        evidence: {
          sourceElementCount: sourceElementIds.length,
          referencedElementCount: referencedElementIds.size,
          rule: "weak-hints-should-not-restates-every-source-element-without-specific-need",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.minimality",
          operation: "reduce",
        },
      });
    }

    const workflowIntent = hint.workflowIntentCandidate?.intent;
    if (
      hint.mediaPolicyCandidate?.iconUse === "no-new-icons"
      && (hint.iconKeywordCandidates?.length ?? 0) > 0
    ) {
      findings.push({
        severity: "warning",
        type: "MEDIA_POLICY_CANDIDATE_CONFLICT",
        slideId: hint.slideId,
        evidence: {
          policy: "iconUse:no-new-icons",
          hasIconKeywords: true,
          candidateCount: hint.iconKeywordCandidates?.length ?? 0,
          runtimeOwner: "MDPR rejects schema-valid conflicting icon hints at handoff",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.mediaPolicy.iconUse",
          operation: "removeConflict",
        },
      });
    }
    if (
      hint.mediaPolicyCandidate?.imageUse === "no-image"
      && (hint.visualAssetCandidates?.length ?? 0) > 0
    ) {
      findings.push({
        severity: "warning",
        type: "MEDIA_POLICY_CANDIDATE_CONFLICT",
        slideId: hint.slideId,
        evidence: {
          policy: "imageUse:no-image",
          hasVisualAssetCandidates: true,
          candidateCount: hint.visualAssetCandidates?.length ?? 0,
          runtimeOwner: "MDPR rejects schema-valid conflicting visual hints at handoff",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.mediaPolicy.imageUse",
          operation: "removeConflict",
        },
      });
    }
    const unauthorizedVisuals = (hint.visualAssetCandidates ?? [])
      .filter((candidate) => !visualAssetHasPositivePermission(hint, candidate));
    if (unauthorizedVisuals.length > 0 && hint.mediaPolicyCandidate?.imageUse !== "no-image") {
      findings.push({
        severity: "warning",
        type: "MEDIA_PERMISSION_EVIDENCE_MISSING",
        slideId: hint.slideId,
        evidence: {
          candidateCount: unauthorizedVisuals.length,
          requiredEvidence: ["workflowIntent:generated-asset-request", "imageSearch:explicit-request-only", "request:* or instruction:generated-asset-request"],
          rule: "no-image-search-generation-or-icon-escalation-without-positive-evidence",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.visualAssetCandidates.evidence",
          operation: "addEvidence",
        },
      });
    }
    if (
      workflowIntent === "template-fill"
      && (
        ((hint.iconKeywordCandidates?.length ?? 0) > 0 && hint.mediaPolicyCandidate?.iconUse !== "semantic-keywords-only")
        || (hint.visualAssetCandidates?.length ?? 0) > 0
      )
    ) {
      findings.push({
        severity: "warning",
        type: "TEMPLATE_FILL_HINT_POLICY_CONFLICT",
        slideId: hint.slideId,
        evidence: {
          workflowIntent,
          hasIconKeywords: Boolean(hint.iconKeywordCandidates?.length),
          hasVisualAssetCandidates: Boolean(hint.visualAssetCandidates?.length),
          rule: "template-fill-defaults-to-no-new-icons-or-images",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.templateFill.mediaPolicy",
          operation: "removeConflict",
        },
      });
    }

    if (
      workflowIntent === "style-transform"
      && !(hint.workflowIntentCandidate?.evidenceRefs ?? []).some((ref) => /style-transform|visual-system|overhaul|approval|proposal/i.test(ref))
    ) {
      findings.push({
        severity: "warning",
        type: "STYLE_TRANSFORM_EVIDENCE_MISSING",
        slideId: hint.slideId,
        evidence: {
          workflowIntent,
          evidenceRefCount: hint.workflowIntentCandidate?.evidenceRefs.length ?? 0,
          rule: "style-transform-requires-explicit-user-or-approval-evidence",
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.workflowIntent.styleTransformEvidence",
          operation: "addEvidence",
        },
      });
    }

    const duplicateKeys = duplicateCandidateKeys(hint);
    if (duplicateKeys.length > 0) {
      findings.push({
        severity: "info",
        type: "DUPLICATE_HINT_CANDIDATE",
        slideId: hint.slideId,
        evidence: {
          duplicateCount: duplicateKeys.length,
          candidateKinds: duplicateKeys.slice(0, 8),
        },
        suggestion: {
          kind: "mdpr-skill-preflight",
          target: "hints.candidates",
          operation: "dedupe",
        },
      });
    }
  }
  return findings;
}

export function validateRoundTodoProposalQuality(
  proposals: RoundTodoProposal[],
  options: { completedTodoTitles?: string[]; completedFeatureIds?: string[] } = {},
): RoundTodoQualityFinding[] {
  const completedKeys = new Set([
    ...(options.completedTodoTitles ?? []).map(normalizeTodoKey),
    ...(options.completedFeatureIds ?? []).map(normalizeTodoKey),
  ].filter(Boolean));
  const seen = new Set<string>();
  const findings: RoundTodoQualityFinding[] = [];
  for (const proposal of proposals) {
    const titleKey = normalizeTodoKey(proposal.title);
    const duplicate = Boolean(titleKey && (seen.has(titleKey) || completedKeys.has(titleKey)));
    const vague = isVagueTodoProposal(proposal);
    if (duplicate || vague) {
      findings.push({
        severity: "warning",
        type: "ROUND_TODO_DUPLICATE_OR_VAGUE",
        todoTitle: proposal.title,
        evidence: {
          duplicate,
          vague,
          hasFiles: Boolean(proposal.files?.length),
          acceptanceCount: proposal.acceptance?.length ?? 0,
          validationCount: proposal.validation?.length ?? 0,
          rule: "round-4-plus-pro-reviews-must-return-non-duplicate-locally-actionable-todos",
        },
        suggestion: {
          kind: "mdpr-skill-round-review",
          target: "pro-review.locally_actionable_todos",
          operation: duplicate ? "dedupe" : "reduce",
        },
      });
    }
    if (!(proposal.evidenceRefs?.length || proposal.files?.length)) {
      findings.push({
        severity: "info",
        type: "ROUND_TODO_EVIDENCE_MISSING",
        todoTitle: proposal.title,
        evidence: {
          rule: "pro-review-todos-need-file-or-evidence-binding-before-import",
        },
        suggestion: {
          kind: "mdpr-skill-round-review",
          target: "pro-review.todo.evidenceRefs",
          operation: "addEvidence",
        },
      });
    }
    if (titleKey) seen.add(titleKey);
  }
  return findings;
}

function mergeHintOptions(context: SelectionContext, options: HintBuildOptions): Required<Pick<HintBuildOptions, "sourceImageRefs" | "sourceEvidenceRefs">> & HintBuildOptions {
  return {
    workflowIntent: options.workflowIntent ?? context.workflowIntent,
    templateSourceRef: options.templateSourceRef ?? context.templateSourceRef,
    preserveMasterSlides: options.preserveMasterSlides ?? context.preserveMasterSlides,
    sourceImageRefs: options.sourceImageRefs ?? context.sourceImageRefs ?? [],
    sourceEvidenceRefs: options.sourceEvidenceRefs ?? context.sourceEvidenceRefs ?? [],
    explicitGeneratedAssetRequestRef: options.explicitGeneratedAssetRequestRef ?? context.explicitGeneratedAssetRequestRef,
    imagePolicy: options.imagePolicy ?? context.imagePolicy,
    imageSearchPolicy: options.imageSearchPolicy ?? context.imageSearchPolicy,
    iconPolicy: options.iconPolicy ?? context.iconPolicy,
  };
}

function buildWorkflowIntentCandidate(context: SelectionContext, options: HintBuildOptions): WorkflowIntentCandidate | undefined {
  const instruction = context.userInstruction ?? "";
  const intent = options.workflowIntent
    ?? (options.templateSourceRef || options.preserveMasterSlides ? "template-fill" : undefined)
    ?? (hasExplicitGeneratedImageRequest(instruction) ? "generated-asset-request" : undefined);
  if (!intent) return undefined;
  return {
    intent,
    confidence: intent === "template-fill" ? 0.86 : 0.72,
    evidenceRefs: [
      ...(options.templateSourceRef ? [`template:${options.templateSourceRef}`] : []),
      ...(options.preserveMasterSlides ? ["template:preserve-master-slides"] : []),
      ...(hasExplicitGeneratedImageRequest(instruction) ? ["instruction:generated-asset-request"] : []),
      ...(intent === "style-transform" && hasExplicitStyleTransformRequest(instruction) ? ["instruction:style-transform-request"] : []),
    ],
  };
}

function buildTemplateUseCandidate(options: HintBuildOptions): TemplateUseCandidate | undefined {
  if (!options.templateSourceRef && !options.preserveMasterSlides) return undefined;
  return {
    templateSourceRef: options.templateSourceRef ?? "template-summary",
    masterSlidePolicy: options.preserveMasterSlides ? "preserve-existing-master-slides" : "use-master-as-theme-source",
    placeholderPolicy: "prefer-existing-placeholders",
    confidence: 0.86,
  };
}

function buildMediaPolicyCandidate(
  context: SelectionContext,
  options: Required<Pick<HintBuildOptions, "sourceImageRefs">> & HintBuildOptions,
): MediaPolicyCandidate {
  const explicitGenerated = Boolean(options.explicitGeneratedAssetRequestRef) || hasExplicitGeneratedImageRequest(context.userInstruction ?? "");
  const imageUse = options.imagePolicy
    ?? (explicitGenerated ? "generated-asset-approved" : options.sourceImageRefs.length ? "source-image-only" : "no-image");
  const imageSearch = options.imageSearchPolicy
    ?? (options.sourceImageRefs.length ? "source-evidence-only" : explicitGenerated ? "explicit-request-only" : "disabled");
  const iconUse = options.iconPolicy
    ?? ((options.workflowIntent ?? context.workflowIntent) === "template-fill" ? "no-new-icons" : "semantic-keywords-only");
  return {
    imageUse,
    imageSearch,
    iconUse,
    evidenceRefs: [
      ...options.sourceImageRefs.map((ref) => `sourceImage:${ref}`),
      ...(options.explicitGeneratedAssetRequestRef ? [`request:${options.explicitGeneratedAssetRequestRef}`] : []),
      ...(explicitGenerated && !options.explicitGeneratedAssetRequestRef ? ["instruction:generated-asset-request"] : []),
    ],
  };
}

function buildVisualAssetCandidates(
  userInstruction: string | undefined,
  options: HintBuildOptions,
  mediaPolicy: MediaPolicyCandidate,
): VisualAssetCandidate[] | undefined {
  if (!userInstruction || mediaPolicy.imageUse !== "generated-asset-approved") return undefined;
  if (!hasExplicitGeneratedImageRequest(userInstruction) && !options.explicitGeneratedAssetRequestRef) return undefined;
  return [{
    kind: "generated-image",
    trigger: "explicit-generated-asset-request",
    requestRef: options.explicitGeneratedAssetRequestRef ?? "instruction:generated-asset-request",
    semanticPrompt: buildSemanticImagePrompt(userInstruction),
    confidence: 0.72,
  }];
}

function hasExplicitGeneratedImageRequest(userInstruction: string): boolean {
  const text = userInstruction.toLowerCase();
  const asksForGeneratedImage = /\b(generate an image|generate image|generated image|image generation)\b|이미지 생성|생성 이미지|그림 생성/.test(text);
  return asksForGeneratedImage;
}

function hasExplicitStyleTransformRequest(userInstruction: string): boolean {
  const text = userInstruction.toLowerCase();
  return /\b(new visual system|change the visual system|style transform|visual overhaul|redesign the style|new theme|different theme)\b|시각 시스템 변경|새로운 시각|스타일 변환|스타일을 바꿔|테마를 바꿔|전면 개편/.test(text);
}

function buildIconKeywordCandidates(
  userInstruction: string | undefined,
  iconUse: MediaPolicyCandidate["iconUse"],
  blockIds: string[],
  evidenceRefs: string[],
  workflowIntentCandidate: WorkflowIntentCandidate | undefined,
): IconKeywordCandidate[] | undefined {
  if (!userInstruction || iconUse === "no-new-icons") return undefined;
  const text = userInstruction.toLowerCase();
  if (!/\b(icon|icons|glyph|pictogram)\b|아이콘/.test(text)) return undefined;
  if (!blockIds.length && !evidenceRefs.length) return undefined;
  const tokens = buildSemanticImagePrompt(userInstruction).split(/\s+/).filter((token) => !/^(icon|icons|아이콘)$/.test(token));
  const refs = evidenceRefs.length ? evidenceRefs.slice(0, 8) : blockIds.slice(0, 4).map((blockId) => `element:${blockId}`);
  return tokens.length
    ? tokens.slice(0, 4).map((keyword) => ({
      keyword,
      elementIds: blockIds.slice(0, 8),
      evidenceRefs: refs,
      reason: "Explicit icon instruction permits semantic keyword search only; final icon asset choice remains MDPR-owned.",
      confidence: 0.7,
      ...(workflowIntentCandidate ? { workflowIntentRef: `workflow:${workflowIntentCandidate.intent}` } : {}),
    }))
    : undefined;
}

function buildKeyMessageCandidates(userInstruction: string | undefined, blockIds: string[], sourceEvidenceRefs: string[] = []): KeyMessageCandidate[] | undefined {
  if (!userInstruction || blockIds.length === 0) return undefined;
  const text = userInstruction.toLowerCase();
  if (!/\b(key message|main point|takeaway|decision|risk|emphasize|highlight)\b|핵심|메시지|강조|결론|리스크|위험/.test(text)) return undefined;
  const messageRole: KeyMessageCandidate["messageRole"] = /\brisk\b|리스크|위험/.test(text)
    ? "risk-callout"
    : /\bdecision\b|결정|의사결정/.test(text)
    ? "decision-needed"
    : /\bproof|evidence\b|근거|증거/.test(text)
    ? "proof-anchor"
    : "main-takeaway";
  return [{
    messageRole,
    emphasisLevel: "primary",
    elementIds: blockIds.slice(0, 3),
    evidenceRefs: sourceEvidenceRefs.length ? sourceEvidenceRefs.slice(0, 8) : blockIds.slice(0, 3).map((blockId) => `element:${blockId}`),
    preferredPlaceholderRole: "title",
    reason: "User instruction asks for key-message emphasis as semantic priority only.",
    confidence: 0.78,
  }];
}

function buildContentSplitCandidates(userInstruction: string | undefined, blockIds: string[]): ContentSplitCandidate[] | undefined {
  if (!userInstruction || blockIds.length === 0) return undefined;
  const text = userInstruction.toLowerCase();
  if (!/\b(split|separate|chunk|too dense|dense content)\b|분리|나누|쪼개|밀도|빽빽|내용이 많/.test(text)) return undefined;
  return [{
    reason: blockIds.length >= 5 ? "evidence-overload" : "dense-content",
    elementIds: blockIds.slice(0, 12),
    preferredSplitBy: blockIds.length >= 5 ? "block-group" : "list-chunk",
    confidence: 0.76,
  }];
}

function buildReadabilityCandidates(userInstruction: string | undefined, blockIds: string[]): ReadabilityCandidate[] | undefined {
  if (!userInstruction || blockIds.length === 0) return undefined;
  const text = userInstruction.toLowerCase();
  const candidates: ReadabilityCandidate[] = [];
  if (/\b(readability|legibility|too wordy|shorten|concise|plain language)\b|가독성|줄임|짧게|간결|읽기/.test(text)) {
    candidates.push({
      action: /\bplain language\b|쉽게|평이/.test(text) ? "plain-language" : "shorten-copy",
      elementIds: blockIds.slice(0, 8),
      reason: "User instruction asks for readability or copy-length reduction.",
      confidence: 0.76,
    });
  }
  if (/\bbullet|bullets\b|불릿|목록/.test(text)) {
    candidates.push({
      action: "reduce-bullet-count",
      elementIds: blockIds.slice(0, 8),
      reason: "User instruction flags list readability.",
      confidence: 0.72,
    });
  }
  return candidates.length ? candidates : undefined;
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

function referencedHintElementIds(hint: SkillHint): Set<string> {
  const refs = new Set<string>();
  const add = (ids: string[] | undefined) => ids?.forEach((id) => refs.add(id));
  hint.groupCandidates?.forEach((candidate) => add(candidate.elementIds));
  hint.importanceCandidates?.forEach((candidate) => add([candidate.elementId]));
  hint.keyMessageCandidates?.forEach((candidate) => add(candidate.elementIds));
  hint.contentSplitCandidates?.forEach((candidate) => add(candidate.elementIds));
  hint.readabilityCandidates?.forEach((candidate) => add(candidate.elementIds));
  hint.iconKeywordCandidates?.forEach((candidate) => add(candidate.elementIds));
  return refs;
}

function duplicateCandidateKeys(hint: SkillHint): string[] {
  const keys = [
    ...(hint.keyMessageCandidates ?? []).map((candidate) => `key:${candidate.messageRole}:${candidate.emphasisLevel}:${candidate.elementIds.join(",")}`),
    ...(hint.contentSplitCandidates ?? []).map((candidate) => `split:${candidate.reason}:${candidate.elementIds.join(",")}`),
    ...(hint.readabilityCandidates ?? []).map((candidate) => `readability:${candidate.action}:${candidate.elementIds.join(",")}`),
    ...(hint.visualAssetCandidates ?? []).map((candidate) => `asset:${candidate.kind}:${candidate.requestRef}`),
  ];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) duplicates.add(key.split(":")[0] ?? "candidate");
    seen.add(key);
  }
  return [...duplicates];
}

export function assertNoForbiddenFields(value: unknown, path = "$"): void {
  const paths = forbiddenFieldPaths(value, path);
  if (paths.length) {
    throw new Error(`${paths[0]} is a forbidden final-decision field for mdpr-skill hints`);
  }
}

function forbiddenFieldPaths(value: unknown, path = "$"): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => forbiddenFieldPaths(item, `${path}[${index}]`));
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const childPath = `${path}.${key}`;
    const own = (FORBIDDEN_AGENT_HINT_FIELDS as readonly string[]).includes(key) ? [childPath] : [];
    return [...own, ...forbiddenFieldPaths(child, childPath)];
  });
}

function visualAssetHasPositivePermission(hint: SkillHint, candidate: VisualAssetCandidate): boolean {
  if (hint.mediaPolicyCandidate?.imageUse !== "generated-asset-approved") return false;
  if (hint.mediaPolicyCandidate.imageSearch !== "explicit-request-only") return false;
  if (candidate.trigger !== "explicit-generated-asset-request") return false;
  const refs = [
    ...(hint.workflowIntentCandidate?.evidenceRefs ?? []),
    ...(hint.mediaPolicyCandidate.evidenceRefs ?? []),
    candidate.requestRef,
  ].filter(Boolean);
  const hasRequestRef = refs.some((ref) => /^(?:request:|instruction:generated-asset-request\b)/i.test(ref));
  return hint.workflowIntentCandidate?.intent === "generated-asset-request" && hasRequestRef;
}

function normalizeTodoKey(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isVagueTodoProposal(proposal: RoundTodoProposal): boolean {
  const text = normalizeTodoKey(`${proposal.title} ${proposal.rationale ?? ""}`);
  const generic = /^(improve|enhance|better|polish|fix|add|개선|보강|정리)\b/.test(text)
    || /\b(readability|icons?|images?|theme|quality|가독성|아이콘|이미지|테마|품질)\b/.test(text);
  const lacksActionableShape = !(proposal.files?.length)
    || (proposal.acceptance?.length ?? 0) < 2
    || (proposal.validation?.length ?? 0) < 1;
  return generic && lacksActionableShape;
}
