export type ReviewFinding = {
  severity: "info" | "warning" | "error";
  type: string;
  slideId?: string;
  evidence?: Record<string, unknown>;
  suggestion?: {
    kind: "mdpr-policy" | "mdpr-rulebook" | "mdpr-config";
    target: string;
    operation: "increaseWeight" | "decreaseWeight" | "enableRule" | "disableRule" | "document";
    value?: string | number | boolean;
  };
};

export type ReviewReport = {
  version: "1.0";
  source: "mdpr-manifest";
  findings: ReviewFinding[];
};

export function buildReviewReport(findings: ReviewFinding[]): ReviewReport {
  return { version: "1.0", source: "mdpr-manifest", findings };
}

export function reviewFindingHasFinalDecisionField(finding: ReviewFinding): boolean {
  return JSON.stringify(finding).match(/\b(x|y|w|h|box|color|colors|fontSize|fontFamily|typography|zOrder|z-order|recipeId|variantId|radius|shadow|effect|arrow|component|style|iconPath|iconName|coordinates|geometry|rendererObjectId)\b/) !== null;
}

export type ReviewCoreInput = {
  presentation?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  designLock?: Record<string, unknown>;
  selectionContext?: Record<string, unknown>;
};

export type ScreenshotEvidenceInput = {
  screenshotPath?: string;
  selectionPath?: string;
  blockIds?: string[];
};

type BlockLike = {
  id: string;
  type: string;
  text?: string;
  alt?: string;
};

type PresentationSlideLike = {
  id: string;
  title?: string;
  intent?: string;
  headingPath: string[];
  blocks: BlockLike[];
};

type LayoutRegionLike = {
  id: string;
  role?: string;
  blockIds: string[];
};

type LayoutSlideLike = {
  id: string;
  sourceSlideId: string;
  preset: string;
  regions: LayoutRegionLike[];
};

const EVIDENCE_BLOCK_TYPES = new Set(["chart", "table", "image", "code", "diagram"]);

export function reviewCoherence(input: ReviewCoreInput): ReviewFinding[] {
  const model = normalizeReviewModel(input);
  const baseFindings = [
    ...detachedCaptionFindings(model),
    ...orphanEvidenceFindings(model),
    ...claimlessEvidenceFindings(model),
  ];
  const noisySections = new Set(
    baseFindings
      .map((finding) => model.slideById.get(String(finding.evidence?.sourceSlideId ?? ""))?.headingPath[0])
      .filter((section): section is string => Boolean(section)),
  );
  return [
    ...baseFindings,
    ...reviewSelectionContext(input),
    ...sectionRhythmFindings(model, noisySections),
  ];
}

export function reviewSelectionContext(input: ReviewCoreInput): ReviewFinding[] {
  const context = asRecord(input.selectionContext);
  if (!context) return [];
  const blockIds = asArray(context.overlappedBlocks).map((blockId) => String(blockId)).filter(Boolean);
  if (blockIds.length < 2) return [];
  return [{
    severity: "warning",
    type: "SELECTION_CONTEXT_GROUPING_RISK",
    slideId: stringValue(context.slideId) ?? "deck",
    evidence: {
      blockIds,
      regionIds: asArray(context.overlappedRegions).map((regionId) => String(regionId)).filter(Boolean),
      ...screenshotEvidence({
        screenshotPath: stringValue(context.screenshotPath),
        selectionPath: stringValue(context.selectionPath),
        blockIds,
      }),
      userInstruction: stringValue(context.userInstruction),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "coherence.keepTogether.selectionContext",
      operation: "increaseWeight",
      value: 0.1,
    },
  }];
}

export function detachedCaptionFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const slide of normalized.presentationSlides) {
    for (let index = 0; index < slide.blocks.length - 1; index++) {
      const current = slide.blocks[index]!;
      const next = slide.blocks[index + 1]!;
      if (!isEvidenceBlock(current) || !isCaptionBlock(next)) continue;
      const evidenceLayout = normalized.layoutSlideIdByBlockId.get(current.id);
      const captionLayout = normalized.layoutSlideIdByBlockId.get(next.id);
      if (!evidenceLayout || !captionLayout || evidenceLayout === captionLayout) continue;
      findings.push({
        severity: "warning",
        type: "DETACHED_CAPTION_RISK",
        slideId: evidenceLayout,
        evidence: {
          sourceSlideId: slide.id,
          evidenceBlockId: current.id,
          captionBlockId: next.id,
          evidenceLayoutSlideId: evidenceLayout,
          captionLayoutSlideId: captionLayout,
        },
        suggestion: {
          kind: "mdpr-policy",
          target: "coherence.keepTogether.caption",
          operation: "increaseWeight",
          value: 0.15,
        },
      });
    }
  }
  return findings;
}

export function orphanEvidenceFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const slide of normalized.presentationSlides) {
    const evidenceBlocks = slide.blocks.filter(isEvidenceBlock);
    if (!evidenceBlocks.length) continue;
    const supportBlocks = slide.blocks.filter((block) => !isEvidenceBlock(block) && isSupportTextBlock(block));
    if (supportBlocks.length) continue;
    findings.push({
      severity: "warning",
      type: "ORPHAN_EVIDENCE_RISK",
      slideId: normalized.layoutSlideIdByBlockId.get(evidenceBlocks[0]!.id) ?? slide.id,
      evidence: {
        sourceSlideId: slide.id,
        evidenceBlockIds: evidenceBlocks.map((block) => block.id),
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "coherence.requireClaimForEvidence",
        operation: "enableRule",
      },
    });
  }
  return findings;
}

export function claimlessEvidenceFindings(model: ReviewModel | ReviewCoreInput): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const findings: ReviewFinding[] = [];
  for (const layoutSlide of normalized.layoutSlides) {
    const blocks = blocksForLayoutSlide(layoutSlide, normalized.blockById);
    const evidenceBlocks = blocks.filter(isEvidenceBlock);
    if (!evidenceBlocks.length) continue;
    const hasClaim = blocks.some(isClaimBlock);
    if (hasClaim) continue;
    const hasSupport = blocks.some((block) => !isEvidenceBlock(block) && isSupportTextBlock(block));
    if (!hasSupport) continue;
    findings.push({
      severity: "warning",
      type: "CLAIMLESS_EVIDENCE_SLIDE",
      slideId: layoutSlide.id,
      evidence: {
        sourceSlideId: layoutSlide.sourceSlideId,
        evidenceBlockIds: evidenceBlocks.map((block) => block.id),
        supportBlockIds: blocks.filter((block) => !isEvidenceBlock(block) && isSupportTextBlock(block)).map((block) => block.id),
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "layout.scoring.emphasisPenalty.claim",
        operation: "increaseWeight",
        value: 0.1,
      },
    });
  }
  return findings;
}

export function sectionRhythmFindings(model: ReviewModel | ReviewCoreInput, skippedSections = new Set<string>()): ReviewFinding[] {
  const normalized = isReviewModel(model) ? model : normalizeReviewModel(model);
  const grouped = new Map<string, LayoutSlideLike[]>();
  for (const layoutSlide of normalized.layoutSlides) {
    const section = normalized.slideById.get(layoutSlide.sourceSlideId)?.headingPath[0];
    if (!section || skippedSections.has(section)) continue;
    grouped.set(section, [...(grouped.get(section) ?? []), layoutSlide]);
  }

  const findings: ReviewFinding[] = [];
  for (const [section, slides] of grouped.entries()) {
    const presets = [...new Set(slides.map((slide) => slide.preset).filter(Boolean))];
    if (slides.length < 3 || presets.length < 3) continue;
    findings.push({
      severity: "warning",
      type: "SECTION_RHYTHM_DRIFT",
      slideId: slides[0]!.id,
      evidence: {
        section,
        layoutSlideIds: slides.map((slide) => slide.id),
        presetFamilies: presets,
      },
      suggestion: {
        kind: "mdpr-policy",
        target: "layout.scoring.sectionContinuity",
        operation: "increaseWeight",
        value: 0.1,
      },
    });
  }
  return findings;
}

export function reviewVisualPolicy(input: ReviewCoreInput): ReviewFinding[] {
  return [
    ...rawHexFindings(input),
    ...mixedRadiusFindings(input),
    ...mixedShadowFindings(input),
    ...effectBudgetFindings(input),
    ...accentOveruseFindings(input),
    ...nonEditableObjectFindings(input),
  ];
}

export function rawHexFindings(input: ReviewCoreInput): ReviewFinding[] {
  const rawHexPaths = collectRawHexPaths(input.designLock ?? {});
  if (!rawHexPaths.length) return [];
  return [{
    severity: "warning",
    type: "RAW_HEX_STYLE_VALUE",
    slideId: "deck",
    evidence: {
      pathCount: rawHexPaths.length,
      sampleLocations: rawHexPaths.slice(0, 4),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "theme.tokens",
      operation: "document",
    },
  }];
}

export function mixedRadiusFindings(input: ReviewCoreInput): ReviewFinding[] {
  const values = stringArrayAt(input.designLock, "cornerScale");
  if (new Set(values).size < 4) return [];
  return [{
    severity: "warning",
    type: "MIXED_RADIUS_SCALE",
    slideId: "deck",
    evidence: {
      scaleKind: "corner",
      distinctCount: new Set(values).size,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "theme.tokenScale.corner",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function mixedShadowFindings(input: ReviewCoreInput): ReviewFinding[] {
  const values = stringArrayAt(input.designLock, "depthScale");
  if (new Set(values).size < 3) return [];
  return [{
    severity: "warning",
    type: "MIXED_SHADOW_SCALE",
    slideId: "deck",
    evidence: {
      scaleKind: "depth",
      distinctCount: new Set(values).size,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "theme.tokenScale.depth",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function effectBudgetFindings(input: ReviewCoreInput): ReviewFinding[] {
  const treatments = stringArrayAt(input.designLock, "visualTreatments");
  if (new Set(treatments).size <= 4) return [];
  return [{
    severity: "warning",
    type: "EFFECT_BUDGET_EXCEEDED",
    slideId: "deck",
    evidence: {
      visualTreatmentCount: new Set(treatments).size,
      budget: 4,
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "visual.budget.depth",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function accentOveruseFindings(input: ReviewCoreInput): ReviewFinding[] {
  const usage = asRecord(input.manifest?.accentUsage);
  const accentedObjects = numberValue(usage?.accentedObjects) ?? 0;
  const totalObjects = numberValue(usage?.totalObjects) ?? 0;
  if (accentedObjects < 9 || totalObjects <= 0 || accentedObjects / totalObjects <= 0.6) return [];
  return [{
    severity: "warning",
    type: "ACCENT_OVERUSE_RISK",
    slideId: "deck",
    evidence: {
      accentedObjects,
      totalObjects,
      ratio: Number((accentedObjects / totalObjects).toFixed(2)),
    },
    suggestion: {
      kind: "mdpr-policy",
      target: "visual.hierarchy.accentBudget",
      operation: "decreaseWeight",
      value: 0.1,
    },
  }];
}

export function nonEditableObjectFindings(input: ReviewCoreInput): ReviewFinding[] {
  const objects = asArray(input.manifest?.pptxObjects).map((value) => asRecord(value) ?? {});
  const nonEditable = objects.filter((object) => {
    const kind = String(object.objectKind ?? "").toLowerCase();
    const role = String(object.role ?? "").toLowerCase();
    return /raster|bitmap|image/.test(kind) && ["title", "body", "table", "chart", "code"].includes(role);
  });
  return nonEditable.map((object) => ({
    severity: "error",
    type: "NON_EDITABLE_PRIMARY_OBJECT",
    slideId: stringValue(object.slideId) ?? "deck",
    evidence: {
      objectKind: stringValue(object.objectKind) ?? "unknown",
      role: stringValue(object.role) ?? "unknown",
      blockIds: asArray(object.blockIds).map((blockId) => String(blockId)),
    },
    suggestion: {
      kind: "mdpr-policy" as const,
      target: "renderer.nativeEditableObjects",
      operation: "enableRule" as const,
    },
  }));
}

export function screenshotEvidence(input: ScreenshotEvidenceInput): Record<string, unknown> {
  return {
    ...(input.screenshotPath ? { screenshotPath: input.screenshotPath } : {}),
    ...(input.selectionPath ? { selectionPath: input.selectionPath } : {}),
    ...(input.blockIds ? { blockIds: input.blockIds } : {}),
  };
}

type ReviewModel = {
  presentationSlides: PresentationSlideLike[];
  layoutSlides: LayoutSlideLike[];
  slideById: Map<string, PresentationSlideLike>;
  blockById: Map<string, BlockLike>;
  layoutSlideIdByBlockId: Map<string, string>;
};

function normalizeReviewModel(input: ReviewCoreInput): ReviewModel {
  const presentationSlides = normalizePresentationSlides(input.presentation);
  const layoutSlides = normalizeLayoutSlides(input.layout);
  const slideById = new Map(presentationSlides.map((slide) => [slide.id, slide]));
  const blockById = new Map<string, BlockLike>();
  for (const slide of presentationSlides) {
    for (const block of slide.blocks) blockById.set(block.id, block);
  }
  const layoutSlideIdByBlockId = new Map<string, string>();
  for (const layoutSlide of layoutSlides) {
    for (const region of layoutSlide.regions) {
      for (const blockId of region.blockIds) {
        layoutSlideIdByBlockId.set(blockId, layoutSlide.id);
      }
    }
  }
  return { presentationSlides, layoutSlides, slideById, blockById, layoutSlideIdByBlockId };
}

function normalizePresentationSlides(value: unknown): PresentationSlideLike[] {
  const slides = asArray(asRecord(value)?.slides);
  return slides.map((slideValue, index) => {
    const slide = asRecord(slideValue) ?? {};
    const id = stringValue(slide.id) ?? `slide-${index + 1}`;
    return {
      id,
      title: stringValue(slide.title),
      intent: stringValue(slide.intent),
      headingPath: asArray(slide.headingPath).map((item) => String(item)),
      blocks: asArray(slide.blocks).map((blockValue, blockIndex) => normalizeBlock(blockValue, `${id}:block-${blockIndex + 1}`)),
    };
  });
}

function normalizeBlock(value: unknown, fallbackId: string): BlockLike {
  const block = asRecord(value) ?? {};
  return {
    id: stringValue(block.id) ?? fallbackId,
    type: stringValue(block.type) ?? "unknown",
    text: stringValue(block.text),
    alt: stringValue(block.alt),
  };
}

function normalizeLayoutSlides(value: unknown): LayoutSlideLike[] {
  const slides = asArray(asRecord(value)?.slides);
  return slides.map((slideValue, index) => {
    const slide = asRecord(slideValue) ?? {};
    const id = stringValue(slide.id) ?? `layout-slide-${index + 1}`;
    const layout = asRecord(slide.layout) ?? {};
    return {
      id,
      sourceSlideId: stringValue(slide.sourceSlideId) ?? id,
      preset: stringValue(layout.preset) ?? "unknown",
      regions: asArray(slide.regions).map((regionValue, regionIndex) => {
        const region = asRecord(regionValue) ?? {};
        return {
          id: stringValue(region.id) ?? `${id}:region-${regionIndex + 1}`,
          role: stringValue(region.role),
          blockIds: asArray(region.blockIds).map((blockId) => String(blockId)),
        };
      }),
    };
  });
}

function isReviewModel(value: ReviewModel | ReviewCoreInput): value is ReviewModel {
  return "presentationSlides" in value && "layoutSlides" in value && "blockById" in value;
}

function blocksForLayoutSlide(layoutSlide: LayoutSlideLike, blockById: Map<string, BlockLike>): BlockLike[] {
  return layoutSlide.regions
    .flatMap((region) => region.blockIds)
    .map((blockId) => blockById.get(blockId))
    .filter((block): block is BlockLike => Boolean(block));
}

function isEvidenceBlock(block: BlockLike): boolean {
  return EVIDENCE_BLOCK_TYPES.has(block.type);
}

function isSupportTextBlock(block: BlockLike): boolean {
  return ["paragraph", "quote", "bulletList", "orderedList"].includes(block.type) && blockText(block).trim().length > 0;
}

function isCaptionBlock(block: BlockLike): boolean {
  if (!isSupportTextBlock(block)) return false;
  return /^(figure|fig\.|table|chart|source|note|caption)\b/i.test(blockText(block).trim());
}

function isClaimBlock(block: BlockLike): boolean {
  if (!isSupportTextBlock(block) || isCaptionBlock(block)) return false;
  const text = blockText(block).trim();
  return text.length >= 18;
}

function blockText(block: BlockLike): string {
  return block.text ?? block.alt ?? "";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArrayAt(record: Record<string, unknown> | undefined, key: string): string[] {
  return asArray(record?.[key]).map((value) => String(value)).filter(Boolean);
}

function collectRawHexPaths(value: unknown, path: string[] = []): string[] {
  if (typeof value === "string") {
    if (/^#[0-9a-f]{6}$/i.test(value) && !isTokenizedStylePath(path)) return [path.join(".")];
    return [];
  }
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRawHexPaths(item, [...path, String(index)]));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => collectRawHexPaths(child, [...path, key]));
}

function isTokenizedStylePath(path: string[]): boolean {
  const normalized = path.map((item) => item.toLowerCase());
  return normalized.includes("tokens")
    || normalized.includes("palette")
    || normalized.includes("themecolors")
    || normalized.includes("colortokens");
}
