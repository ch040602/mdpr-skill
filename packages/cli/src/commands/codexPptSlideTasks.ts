export type CodexPptSlideTaskPacketSet = {
  schemaVersion: "mdpr-slide-task-packet-set-v1";
  generatedBy: "mdpr-skill";
  source: {
    manifestPath?: string;
    markdownPath?: string;
    renderedImagesPath?: string;
  };
  packetCount: number;
  packets: Array<{
    slideNumber: number;
    slideId: string;
    path: string;
    roles: string[];
    objectKinds: string[];
  }>;
  boundary: SlideTaskBoundary;
};

export type CodexPptSlideTaskPacket = {
  schemaVersion: "mdpr-slide-task-packet-v1";
  generatedBy: "mdpr-skill";
  slide: {
    slideNumber: number;
    slideId: string;
    roles: string[];
    objectKinds: string[];
    editableObjectCount: number;
  };
  localContext: {
    sourceHeading?: string;
    markdownExcerpt: string;
  };
  renderedPreview?: {
    imagePath: string;
    evidenceId?: string;
  };
  validationExpectations: string[];
  handoff: {
    workerScope: "single-slide-review-or-repair-proposal";
    requiredInputs: string[];
    outputContract: string[];
  };
  boundary: SlideTaskBoundary;
};

type SlideTaskBoundary = {
  mdprOwnsFinalLayout: true;
  mdprOwnsFinalThemeBinding: true;
  noRendererInternals: true;
  forbiddenFieldCategories: string[];
};

type SlideSummary = {
  slideNumber: number;
  slideId: string;
  roles: Set<string>;
  objectKinds: Set<string>;
  editableObjectCount: number;
};

type MarkdownSection = {
  heading: string;
  slug: string;
  text: string;
};

const boundary: SlideTaskBoundary = {
  mdprOwnsFinalLayout: true,
  mdprOwnsFinalThemeBinding: true,
  noRendererInternals: true,
  forbiddenFieldCategories: ["geometry", "renderer-object-identity", "z-order", "exact-color", "recipe-selection"],
};

export function buildCodexPptSlideTaskPackets(input: {
  manifest: Record<string, unknown>;
  manifestPath?: string;
  markdown?: string;
  markdownPath?: string;
  renderedImages?: Record<string, unknown>;
  renderedImagesPath?: string;
}): { index: CodexPptSlideTaskPacketSet; packetFiles: Array<{ fileName: string; packet: CodexPptSlideTaskPacket }> } {
  const slides = summarizeSlides(input.manifest);
  const sections = parseMarkdownSections(input.markdown ?? "");
  const renderedImages = readRenderedImages(input.renderedImages);
  const packetFiles = slides.map((slide) => {
    const section = findSectionForSlide(slide, sections);
    const renderedPreview = renderedImages.get(slide.slideId) ?? renderedImages.get(String(slide.slideNumber));
    const packet: CodexPptSlideTaskPacket = {
      schemaVersion: "mdpr-slide-task-packet-v1",
      generatedBy: "mdpr-skill",
      slide: {
        slideNumber: slide.slideNumber,
        slideId: slide.slideId,
        roles: [...slide.roles].sort(),
        objectKinds: [...slide.objectKinds].sort(),
        editableObjectCount: slide.editableObjectCount,
      },
      localContext: {
        sourceHeading: section?.heading,
        markdownExcerpt: compactExcerpt(section?.text ?? "", 640),
      },
      renderedPreview,
      validationExpectations: [
        "Review semantic coherence, claim clarity, readability, and source fidelity for this slide only.",
        "Use rendered preview evidence when present; do not infer pass/fail without MDPR validation artifacts.",
        "Return review findings or repair proposals only. Do not emit coordinates, exact colors, z-order, renderer object ids, or final layout choices.",
      ],
      handoff: {
        workerScope: "single-slide-review-or-repair-proposal",
        requiredInputs: [
          "this task packet",
          "referenced rendered preview image when available",
          "source excerpt embedded in localContext",
        ],
        outputContract: [
          "status: pass|needs-repair|blocked",
          "qaNote: concise evidence-grounded note",
          "repairProposal: optional semantic Markdown/rulebook/config suggestion",
        ],
      },
      boundary,
    };
    return { fileName: `slide_${String(slide.slideNumber).padStart(2, "0")}.task.json`, packet };
  });

  const index: CodexPptSlideTaskPacketSet = {
    schemaVersion: "mdpr-slide-task-packet-set-v1",
    generatedBy: "mdpr-skill",
    source: {
      manifestPath: input.manifestPath,
      markdownPath: input.markdownPath,
      renderedImagesPath: input.renderedImagesPath,
    },
    packetCount: packetFiles.length,
    packets: packetFiles.map(({ fileName, packet }) => ({
      slideNumber: packet.slide.slideNumber,
      slideId: packet.slide.slideId,
      path: fileName,
      roles: packet.slide.roles,
      objectKinds: packet.slide.objectKinds,
    })),
    boundary,
  };
  return { index, packetFiles };
}

function summarizeSlides(manifest: Record<string, unknown>): SlideSummary[] {
  const bySlide = new Map<string, SlideSummary>();
  const objects = Array.isArray(manifest.pptxObjects) ? manifest.pptxObjects : [];
  for (const object of objects) {
    if (!object || typeof object !== "object") continue;
    const record = object as Record<string, unknown>;
    const slideId = typeof record.slideId === "string" && record.slideId.trim() ? record.slideId : undefined;
    if (!slideId) continue;
    let summary = bySlide.get(slideId);
    if (!summary) {
      summary = {
        slideNumber: bySlide.size + 1,
        slideId,
        roles: new Set<string>(),
        objectKinds: new Set<string>(),
        editableObjectCount: 0,
      };
      bySlide.set(slideId, summary);
    }
    if (typeof record.role === "string" && record.role.trim()) summary.roles.add(record.role);
    if (typeof record.objectKind === "string" && record.objectKind.trim()) summary.objectKinds.add(record.objectKind);
    if (record.editable === true) summary.editableObjectCount += 1;
  }

  if (bySlide.size === 0) {
    const slideCount = typeof manifest.slideCount === "number" && Number.isFinite(manifest.slideCount) ? Math.max(0, Math.floor(manifest.slideCount)) : 0;
    for (let index = 1; index <= slideCount; index += 1) {
      const slideId = `slide-${String(index).padStart(2, "0")}`;
      bySlide.set(slideId, { slideNumber: index, slideId, roles: new Set<string>(), objectKinds: new Set<string>(), editableObjectCount: 0 });
    }
  }
  return [...bySlide.values()];
}

function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | undefined;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = parseHeadingText(line);
    if (heading) {
      current = { heading: cleanInline(heading), slug: slugify(heading), text: "" };
      sections.push(current);
      continue;
    }
    if (current) current.text += `${line}\n`;
  }
  return sections;
}

function parseHeadingText(line: string): string | undefined {
  let level = 0;
  while (level < line.length && line[level] === "#") level += 1;
  if (level < 1 || level > 3) return undefined;
  const separator = line[level];
  if (separator !== " " && separator !== "\t") return undefined;
  const heading = line.slice(level + 1).trim();
  return heading || undefined;
}

function findSectionForSlide(slide: SlideSummary, sections: MarkdownSection[]): MarkdownSection | undefined {
  return sections.find((section) => section.slug === slide.slideId)
    ?? sections.find((section) => slide.slideId.includes(section.slug) || section.slug.includes(slide.slideId))
    ?? sections[slide.slideNumber - 1];
}

function readRenderedImages(value: Record<string, unknown> | undefined): Map<string, { imagePath: string; evidenceId?: string }> {
  const map = new Map<string, { imagePath: string; evidenceId?: string }>();
  const images = value ? (Array.isArray(value.images) ? value.images : Array.isArray(value) ? value : []) : [];
  images.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const imagePath = typeof record.imagePath === "string" ? record.imagePath : typeof record.path === "string" ? record.path : undefined;
    if (!imagePath) return;
    const evidenceId = typeof record.evidenceId === "string" ? record.evidenceId : undefined;
    const preview = { imagePath, evidenceId };
    if (typeof record.slideId === "string") map.set(record.slideId, preview);
    if (typeof record.slideRef === "string") map.set(record.slideRef, preview);
    map.set(String(index + 1), preview);
  });
  return map;
}

function compactExcerpt(value: string, maxLength: number): string {
  return cleanInline(value).slice(0, maxLength);
}

function cleanInline(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return cleanInline(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
