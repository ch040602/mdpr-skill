import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildAgentHintManifest, hintFromSelectionContext, type SelectionContext } from "../../hints-core/src/index.js";
import { buildReviewReport, buildSourceSlideEvidenceLedger, renderReadmeTeaserSvg, reviewAccessibilityContent, reviewCitationProvenance, reviewCoherence, reviewDesignPolicy, reviewNarrativeSpine, reviewRenderedPreviewCritique, reviewSpeakerNotes, reviewTemplateLayoutIntent, reviewVisualPolicy, type CitationSource, type MdprEvidenceRef, type ReadmeTeaserSpec, type RenderedPreviewImage } from "../../review-core/src/index.js";
import { runMdprSkillEval } from "../../eval-core/src/index.js";
import { createChangeRequest, transitionChangeRequest, type ChangeRequest, type ChangeStage } from "../../change-core/src/index.js";
import { buildEditIntent, editIntentToOverrideCandidate, type EditIntentPreferences } from "../../edit-core/src/index.js";
import { analyzeHtmlDesign, buildThemeCandidateFromDesignMd } from "./commands/design.js";
import { runValidateSchemaSync } from "./commands/validateSchemaSync.js";

export type CliIo = {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
};

const defaultIo: CliIo = {
  stdout: (value) => process.stdout.write(`${value}\n`),
  stderr: (value) => process.stderr.write(`${value}\n`),
};

export function runCli(argv: string[], io: CliIo = defaultIo): number {
  try {
    const args = [...argv];
    const command = args.shift();
    if (!command || command === "--help" || command === "help") {
      io.stdout(helpText());
      return 0;
    }

    if (command === "validate-schema-sync" || command === "gate") {
      return runSchemaSyncCommand(args, io);
    }
    if (command === "hint") return runHintCommand(args, io);
    if (command === "review") return runReviewCommand(args, io);
    if (command === "narrative") return runNarrativeCommand(args, io);
    if (command === "layout-intent") return runLayoutIntentCommand(args, io);
    if (command === "speaker-notes") return runSpeakerNotesCommand(args, io);
    if (command === "citations") return runCitationsCommand(args, io);
    if (command === "rendered-preview") return runRenderedPreviewCommand(args, io);
    if (command === "accessibility") return runAccessibilityCommand(args, io);
    if (command === "evidence-ledger") return runEvidenceLedgerCommand(args, io);
    if (command === "eval") return runEvalCommand(args, io);
    if (command === "edit") return runEditCommand(args, io);
    if (command === "ppt") return runPptCommand(args, io);
    if (command === "design") return runDesignCommand(args, io);
    if (command === "teaser") return runTeaserCommand(args, io);
    if (command === "change") return runChangeCommand(args, io);
    if (command === "formats") return runFormatsCommand(args, io);

    io.stderr(`Unknown command: ${command}`);
    io.stderr(helpText());
    return 2;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function helpText(): string {
  return [
    "mdpr-skill",
    "",
    "Commands:",
    "  hint (--source-sha256 <64hex> | --selection-context <selection-context.json> [--markdown <deck.md>]) --out <agent-hint.json>",
    "  review --manifest <manifest.json> [--presentation <presentation-ir.json>] [--layout <layout-ir.json>] --out <review-report.json>",
    "  narrative --markdown <deck.md> [--manifest <manifest.json>] [--source-notes <notes.md>] --out <narrative-review.json>",
    "  layout-intent --layout-catalog <catalog.json> --out <layout-intent.json>",
    "  speaker-notes --markdown <deck.md> [--source-notes <notes.md>] --out <speaker-notes.json>",
    "  citations --markdown <deck.md> [--sources <sources.json>] [--as-of <YYYY-MM-DD>] --out <citation-review.json>",
    "  rendered-preview --images <images.json> --out <rendered-preview-review.json>",
    "  accessibility --markdown <deck.md> [--audience <audience>] --out <accessibility-review.json>",
    "  evidence-ledger --markdown <deck.md> [--sources <sources.json>] [--mdpr-evidence <evidence.json>] --out <evidence-ledger.json>",
    "  eval <deck.md> --out <dir> [--mdpr-path <MdPr>] [--hints <agent-hint.json>]",
    "  edit override-candidate --source-sha256 <64hex> --slide-ref <slide> --instruction <text> --split-by <h3|none> --out <override.json>",
    "  ppt propose --selection-context <selection-context.json> [--markdown <deck.md>] --out <change-request.json> [--hints-out <agent-hint.json>]",
    "  design import <DESIGN.md> --out <theme-candidate.json>",
    "  design analyze-html <file.html> --out <html-design-analysis.json>",
    "  teaser --spec <readme-teaser.json> --out <readme-teaser.svg>",
    "  formats [--compare figurelabs] [--format json|markdown|html] [--out <report>] | formats --validate <format-capabilities.json>",
    "  gate validate-schema-sync --mdpr-path <MdPr> [--shared-schema <name[,name]>]",
    "  change approve|reject <change-request.json> --out <change-request.json>",
  ].join("\n");
}

function runSchemaSyncCommand(args: string[], io: CliIo): number {
  const command = args[0] === "validate-schema-sync" ? args.shift() : "validate-schema-sync";
  if (command !== "validate-schema-sync") throw new Error("Only gate validate-schema-sync is supported");
  const options = parseOptions(args);
  const result = runValidateSchemaSync({
    mdprPath: options["mdpr-path"] ? resolveInvocationPath(options["mdpr-path"]) : undefined,
    localSchemaPath: options["local-schema"] ? resolveInvocationPath(options["local-schema"]) : undefined,
    sharedSchemaNames: options["shared-schema"] ? splitCsvOption(options["shared-schema"]) : undefined,
  });
  io.stdout(JSON.stringify(result, null, 2));
  return result.status === "pass" ? 0 : 1;
}

function runPptCommand(args: string[], io: CliIo): number {
  const subcommand = args.shift();
  if (subcommand !== "propose") throw new Error("ppt requires propose");
  const options = parseOptions(args);
  const selectionContextPath = requireOption(options, "selection-context");
  const context = readSelectionContext(selectionContextPath);
  if (options.markdown) assertSelectionContextMatchesMarkdown(context, options.markdown);
  const hint = hintFromSelectionContext(context);
  const hintManifest = buildAgentHintManifest(context.source.sourceSha256, [hint], {
    generatedAt: options["generated-at"],
    mdprVersion: options["mdpr-version"],
  });
  const instruction = options.instruction ?? context.userInstruction ?? "Use the selected PowerPoint object context to preserve related content while MDPR owns final layout.";
  const intent = buildEditIntent({
    id: options.id ? `${options.id}-intent` : `ppt-selection-${context.slideId}-intent`,
    sourceSha256: context.source.sourceSha256,
    instruction,
    target: {
      slideRef: context.slideId,
      blockHints: context.overlappedBlocks ?? [],
      regionHints: context.overlappedRegions ?? [],
    },
    preferences: {
      preserveContent: true,
      groupingRole: (context.overlappedBlocks?.length ?? 0) >= 2 ? "evidence-pack" : "summary",
    },
  });
  const changeRequest = createChangeRequest({
    id: options.id ?? `ppt-selection-${context.slideId}`,
    createdBy: "mdpr-skill",
    sourceSha256: context.source.sourceSha256,
    selectionRef: context.selectionPath ?? selectionContextPath,
    changes: [
      { kind: "agent-hint", hintManifest },
      { kind: "edit-intent", intent },
    ],
  });
  if (options["hints-out"]) writeJson(options["hints-out"], hintManifest);
  const outPath = requireOption(options, "out");
  writeJson(outPath, changeRequest);
  io.stdout(JSON.stringify({
    status: "pass",
    out: outPath,
    hintsOut: options["hints-out"],
    hints: hintManifest.hints.length,
    stage: changeRequest.stage,
    sourceVerified: Boolean(options.markdown),
    sourceSha256: context.source.sourceSha256,
  }, null, 2));
  return 0;
}

function validateSelectionContext(context: SelectionContext): void {
  if (context.schemaVersion !== "mdpr-selection-context-v1") {
    throw new Error("selection context must use schemaVersion mdpr-selection-context-v1");
  }
  if (!context.source || (context.source.kind !== "mdpr-ppt" && context.source.kind !== "mdpr-preview")) {
    throw new Error("selection context source.kind must be mdpr-ppt or mdpr-preview");
  }
  if (!/^[a-f0-9]{64}$/.test(context.source.sourceSha256)) {
    throw new Error("selection context source.sourceSha256 must be a 64-character lowercase hex digest");
  }
  if (!context.slideId?.trim()) throw new Error("selection context slideId is required");
}

function runEditCommand(args: string[], io: CliIo): number {
  const subcommand = args.shift();
  if (subcommand !== "override-candidate") throw new Error("edit requires override-candidate");
  const options = parseOptions(args);
  const splitPreference = readSplitPreference(options);
  const intent = buildEditIntent({
    id: options.id ?? "edit-intent",
    sourceSha256: requireOption(options, "source-sha256"),
    instruction: requireOption(options, "instruction"),
    target: { slideRef: requireOption(options, "slide-ref") },
    preferences: { splitPreference },
  });
  const candidate = editIntentToOverrideCandidate(intent);
  const outPath = requireOption(options, "out");
  writeJson(outPath, candidate);
  io.stdout(JSON.stringify({ status: "pass", out: outPath, operation: "setSplit" }, null, 2));
  return 0;
}

function readSplitPreference(options: Record<string, string>): NonNullable<EditIntentPreferences["splitPreference"]> {
  const splitPreference: NonNullable<EditIntentPreferences["splitPreference"]> = {};
  if (options["force-single-slide"] === "true") splitPreference.forceSingleSlide = true;
  if (options["split-by"]) {
    const splitBy = options["split-by"];
    if (splitBy !== "h2" && splitBy !== "h3" && splitBy !== "h4" && splitBy !== "block-group" && splitBy !== "list-chunk" && splitBy !== "none") {
      throw new Error(`Unsupported --split-by value: ${splitBy}`);
    }
    splitPreference.splitBy = splitBy;
  }
  if (options["max-density"]) splitPreference.maxDensity = Number(options["max-density"]);
  if (Object.keys(splitPreference).length === 0) throw new Error("edit override-candidate requires --split-by, --force-single-slide, or --max-density");
  return splitPreference;
}

function runHintCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const context = options["selection-context"]
    ? readSelectionContext(options["selection-context"])
    : undefined;
  if (context && options.markdown) assertSelectionContextMatchesMarkdown(context, options.markdown);
  const sourceSha256 = options["source-sha256"] ?? context?.source.sourceSha256;
  if (!sourceSha256) throw new Error("hint requires --source-sha256 or --selection-context");
  if (options["source-sha256"] && context && options["source-sha256"] !== context.source.sourceSha256) {
    throw new Error("hint --source-sha256 must match selection context source.sourceSha256");
  }
  const manifest = buildAgentHintManifest(sourceSha256, context ? [hintFromSelectionContext(context)] : [], {
    generatedAt: options["generated-at"],
    mdprVersion: options["mdpr-version"],
  });
  writeJson(requireOption(options, "out"), manifest);
  io.stdout(JSON.stringify({
    status: "pass",
    out: options.out,
    sourceVerified: Boolean(context && options.markdown),
    sourceSha256,
  }, null, 2));
  return 0;
}

function readSelectionContext(path: string): SelectionContext {
  const context = readJson(path) as SelectionContext;
  validateSelectionContext(context);
  return context;
}

function assertSelectionContextMatchesMarkdown(context: SelectionContext, markdownPath: string): void {
  const markdownSha256 = sha256Text(readText(markdownPath));
  if (context.source.sourceSha256 !== markdownSha256) {
    throw new Error("selection context source.sourceSha256 does not match markdown sha256");
  }
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function runReviewCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const manifest = readJson(requireOption(options, "manifest"));
  const presentation = options.presentation ? readJson(options.presentation) : undefined;
  const layout = options.layout ? readJson(options.layout) : undefined;
  const report = buildReviewReport([
    ...reviewCoherence({ manifest, presentation, layout }),
    ...reviewVisualPolicy({ manifest, presentation, layout }),
    ...reviewDesignPolicy({ manifest, presentation, layout }),
  ]);
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", findings: report.findings.length, out: options.out }, null, 2));
  return 0;
}

function runNarrativeCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const markdownPath = requireOption(options, "markdown");
  const suggestions = reviewNarrativeSpine({
    markdown: readText(markdownPath),
    manifest: options.manifest ? readJson(options.manifest) : undefined,
    sourceNotes: options["source-notes"] ? readText(options["source-notes"]) : undefined,
    sourcePath: markdownPath,
  });
  const report = {
    schemaVersion: "mdpr-narrative-review-v1",
    generatedBy: "mdpr-skill",
    suggestions,
  };
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", suggestions: suggestions.length, out: options.out }, null, 2));
  return 0;
}

function runLayoutIntentCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const catalogPath = requireOption(options, "layout-catalog");
  const hints = reviewTemplateLayoutIntent({
    layoutCatalog: readJson(catalogPath),
    sourcePath: catalogPath,
  });
  const report = {
    schemaVersion: "mdpr-layout-intent-review-v1",
    generatedBy: "mdpr-skill",
    hints,
  };
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", hints: hints.length, out: options.out }, null, 2));
  return 0;
}

function runSpeakerNotesCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const markdownPath = requireOption(options, "markdown");
  const suggestions = reviewSpeakerNotes({
    markdown: readText(markdownPath),
    sourceNotes: options["source-notes"] ? readText(options["source-notes"]) : undefined,
    sourcePath: markdownPath,
  });
  const report = {
    schemaVersion: "mdpr-speaker-notes-review-v1",
    generatedBy: "mdpr-skill",
    suggestions,
  };
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", suggestions: suggestions.length, out: options.out }, null, 2));
  return 0;
}

function runCitationsCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const markdownPath = requireOption(options, "markdown");
  const findings = reviewCitationProvenance({
    markdown: readText(markdownPath),
    sources: options.sources ? readSources(options.sources) : undefined,
    asOfDate: options["as-of"],
    sourcePath: markdownPath,
  });
  const report = {
    schemaVersion: "mdpr-citation-review-v1",
    generatedBy: "mdpr-skill",
    findings,
  };
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", findings: findings.length, out: options.out }, null, 2));
  return 0;
}

function runRenderedPreviewCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const notes = reviewRenderedPreviewCritique({
    renderedImages: readRenderedImages(requireOption(options, "images")),
  });
  const report = {
    schemaVersion: "mdpr-rendered-preview-review-v1",
    generatedBy: "mdpr-skill",
    notes,
  };
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", notes: notes.length, out: options.out }, null, 2));
  return 0;
}

function runAccessibilityCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const markdownPath = requireOption(options, "markdown");
  const suggestions = reviewAccessibilityContent({
    markdown: readText(markdownPath),
    audience: options.audience,
    sourcePath: markdownPath,
  });
  const report = {
    schemaVersion: "mdpr-accessibility-content-review-v1",
    generatedBy: "mdpr-skill",
    suggestions,
  };
  writeJson(requireOption(options, "out"), report);
  io.stdout(JSON.stringify({ status: "pass", suggestions: suggestions.length, out: options.out }, null, 2));
  return 0;
}

function runEvidenceLedgerCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const markdownPath = requireOption(options, "markdown");
  const ledger = buildSourceSlideEvidenceLedger({
    markdown: readText(markdownPath),
    sources: options.sources ? readSources(options.sources) : undefined,
    mdprEvidence: options["mdpr-evidence"] ? readMdprEvidence(options["mdpr-evidence"]) : undefined,
    sourcePath: markdownPath,
  });
  writeJson(requireOption(options, "out"), ledger);
  io.stdout(JSON.stringify({ status: "pass", entries: ledger.entries.length, out: options.out }, null, 2));
  return 0;
}

function runEvalCommand(args: string[], io: CliIo): number {
  const deckPath = args.shift();
  if (!deckPath || deckPath.startsWith("--")) throw new Error("eval requires <deck.md>");
  const options = parseOptions(args);
  const outDir = requireOption(options, "out");
  const report = runMdprSkillEval({
    deckPath: resolveInvocationPath(deckPath),
    outDir: resolveInvocationPath(outDir),
    mdprPath: options["mdpr-path"] ? resolveInvocationPath(options["mdpr-path"]) : undefined,
    hintsPath: options.hints ? resolveInvocationPath(options.hints) : undefined,
    visual: options.visual === "true",
    coherence: options.coherence === "true",
    strict: options.strict === "true",
    reportPath: options["report"],
  });
  io.stdout(JSON.stringify({
    status: report.summary.overallStatus,
    baselineManifestPath: report.summary.baselineManifestPath,
    guidedManifestPath: report.summary.guidedManifestPath,
  }, null, 2));
  return report.summary.overallStatus === "pass" ? 0 : 1;
}

function runDesignCommand(args: string[], io: CliIo): number {
  const subcommand = args.shift();
  const sourcePath = args.shift();
  if (!subcommand || !sourcePath || sourcePath.startsWith("--")) throw new Error("design requires a subcommand and source path");
  const options = parseOptions(args);
  const outPath = requireOption(options, "out");
  if (subcommand === "import") {
    const candidate = buildThemeCandidateFromDesignMd({
      path: sourcePath,
      content: readText(sourcePath),
    });
    writeJson(outPath, candidate);
    io.stdout(JSON.stringify({ status: "pass", out: outPath }, null, 2));
    return 0;
  }
  if (subcommand === "analyze-html") {
    const analysis = analyzeHtmlDesign({ html: readText(sourcePath) });
    writeJson(outPath, analysis);
    io.stdout(JSON.stringify({ status: "pass", out: outPath }, null, 2));
    return 0;
  }
  throw new Error(`Unknown design subcommand: ${subcommand}`);
}

function runTeaserCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const specPath = resolveInvocationPath(requireOption(options, "spec"));
  const outPath = resolveInvocationPath(requireOption(options, "out"));
  const spec = readJson(specPath) as ReadmeTeaserSpec;
  const svg = renderReadmeTeaserSvg(spec);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, svg, "utf-8");
  io.stdout(JSON.stringify({
    status: "pass",
    out: outPath,
    pipelineNodes: Array.isArray(spec.pipeline) ? spec.pipeline.length : 0,
    metrics: Array.isArray(spec.metrics) ? spec.metrics.length : 0,
  }, null, 2));
  return 0;
}

function runFormatsCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  if (options.validate) {
    if (options.format && options.format !== "json") {
      throw new Error("formats --validate only supports --format json");
    }
    const report = readJson(options.validate);
    const validation = validateFormatCapabilities(report, options.validate);
    if (options.out) writeJson(options.out, validation);
    io.stdout(JSON.stringify(validation, null, 2));
    return 0;
  }
  if (options.compare && options.compare !== "figurelabs") {
    throw new Error(`Unsupported --compare target: ${options.compare}`);
  }
  const report = buildFormatCapabilities();
  const outputFormat = normalizeFormatReportOutputFormat(options.format);
  const output = renderFormatCapabilities(report, outputFormat);
  if (options.out) {
    if (outputFormat === "json") {
      writeJson(options.out, report);
    } else {
      writeText(options.out, output);
    }
  }
  io.stdout(output);
  return 0;
}

type FormatReportOutputFormat = "json" | "markdown" | "html";

function normalizeFormatReportOutputFormat(value: string | undefined): FormatReportOutputFormat {
  const outputFormat = value ?? "json";
  if (outputFormat === "json" || outputFormat === "markdown" || outputFormat === "html") {
    return outputFormat;
  }
  throw new Error(`Unsupported formats --format value: ${outputFormat}`);
}

function renderFormatCapabilities(report: Record<string, unknown>, outputFormat: FormatReportOutputFormat): string {
  if (outputFormat === "json") return JSON.stringify(report, null, 2);
  if (outputFormat === "markdown") return renderFormatCapabilitiesMarkdown(report);
  return renderFormatCapabilitiesHtml(report);
}

function buildFormatCapabilities(): Record<string, unknown> {
  const sourceReviewedDate = "2026-06-30";
  const sourceReviewTimezone = "Asia/Seoul";
  const sourceReviewScope = "public FigureLabs pages accessible without authentication";
  const inputFormats = [
    "markdown",
    "selection-context-json",
    "agent-hint-json",
    "mdpr-manifest-json",
    "presentation-ir-json",
    "layout-ir-json",
    "rendered-preview-json",
    "source-metadata-json",
    "design-md",
    "html",
    "layout-catalog-json",
  ];
  const outputFormats = [
    "pptx",
    "html",
    "pdf",
    "svg",
    "json",
    "markdown",
  ];
  const comparisonReportFormats = [
    "json",
    "markdown",
    "html",
  ];
  const artifactContracts = [
    "agent-hint-json",
    "change-request-json",
    "review-report-json",
    "narrative-review-json",
    "layout-intent-json",
    "speaker-notes-json",
    "citation-review-json",
    "rendered-preview-review-json",
    "accessibility-review-json",
    "evidence-ledger-json",
    "theme-candidate-json",
    "html-design-analysis-json",
    "eval-report-json",
  ];
  const figureLabsReferenceInputs = [
    "text-prompt-or-abstract",
    "pdf-reference",
    "word-document-reference",
    "sketch-or-photo",
    "reference-image",
  ];
  const figureLabsWorkflowStages = [
    "generate",
    "edit",
    "vectorize",
    "export",
    "publication-authorization",
  ];
  const figureLabsFormats = ["pptx", "svg", "png", "jpg", "pdf"];
  const figureLabsAssuranceArtifacts = ["publication-authorization-pdf"];
  const figureLabsSourceRefs = [
    "https://www.figurelabs.ai/",
    "https://www.figurelabs.ai/help-center",
    "https://www.figurelabs.ai/pricing",
    "https://www.figurelabs.ai/about",
    "https://www.figurelabs.ai/flowchart",
  ];
  const figureLabsSourceEvidence = [
    {
      claimId: "input-text-pdf-reference",
      claim: "FigureLabs publicly positions text prompts, PDFs, and reference inputs as scientific figure generation sources.",
      sourceRefs: [
        "https://www.figurelabs.ai/",
        "https://www.figurelabs.ai/help-center",
      ],
    },
    {
      claimId: "input-sketch-photo-reference",
      claim: "FigureLabs publicly describes sketch, photo, and reference-image driven figure generation.",
      sourceRefs: [
        "https://www.figurelabs.ai/",
        "https://www.figurelabs.ai/help-center",
      ],
    },
    {
      claimId: "output-format-exports",
      claim: "FigureLabs publicly documents editable PPTX/SVG and PNG/JPG/PDF export formats.",
      sourceRefs: [
        "https://www.figurelabs.ai/",
        "https://www.figurelabs.ai/help-center",
        "https://www.figurelabs.ai/pricing",
      ],
    },
    {
      claimId: "workflow-generate-edit-vectorize-export",
      claim: "FigureLabs publicly emphasizes generate, edit, vectorize, and export workflow stages.",
      sourceRefs: [
        "https://www.figurelabs.ai/",
        "https://www.figurelabs.ai/help-center",
        "https://www.figurelabs.ai/pricing",
      ],
    },
    {
      claimId: "flowchart-svg",
      claim: "FigureLabs publicly lists flowchart support and SVG-oriented vector export.",
      sourceRefs: [
        "https://www.figurelabs.ai/pricing",
        "https://www.figurelabs.ai/flowchart",
      ],
    },
    {
      claimId: "publication-authorization",
      claim: "FigureLabs publicly lists publication authorization as an available assurance artifact.",
      sourceRefs: [
        "https://www.figurelabs.ai/pricing",
      ],
    },
  ];
  const mdprWorkflowStages = [
    "source-grounded-hinting",
    "markdown-bound-selection-verification",
    "semantic-review",
    "approval-bound-change-control",
    "deterministic-mdpr-rendering",
    "rendered-preview-critique",
    "source-to-slide-evidence-ledger",
    "schema-sync-validation",
    "release-preflight",
    "consumer-install-smoke",
  ];
  const mdprAssuranceArtifacts = [
    "source-sha256-evidence",
    "schema-sync-report",
    "review-report-json",
    "change-request-approval-state",
    "mdpr-manifest-evidence",
    "eval-regression-report",
    "source-to-slide-evidence-ledger",
    "release-preflight-log",
    "npm-install-smoke-result",
    "npm-audit-result",
  ];
  const mdprCompletenessSignals = [
    "source-sha256-guard",
    "schema-valid-agent-hints",
    "forbidden-final-field-gate",
    "markdown-bound-selection-verification",
    "approval-bound-change-requests",
    "mdpr-guided-build-manifest",
    "rendered-preview-critique",
    "source-to-slide-evidence-ledger",
    "release-preflight",
    "npm-install-smoke",
  ];
  const mdprSkillFormatFamilies = new Set([
    ...inputFormats,
    ...outputFormats,
    ...artifactContracts,
  ]);

  return {
    $schema: "https://mdpresent.dev/schemas/mdpr-format-capabilities.schema.json",
    schemaVersion: "mdpr-skill-format-capabilities-v1",
    generatedBy: "mdpr-skill",
    comparisonTarget: {
      name: "FigureLabs",
      focus: "AI scientific illustration generation and editing",
      sourceReviewedDate,
      sourceReviewTimezone,
      sourceReviewScope,
      publicInputModes: [
        "text-to-figure",
        "reference-to-figure",
        "sketch-or-image-to-figure",
        "pdf-or-reference-upload",
        "research-flowchart-generation",
      ],
      publicReferenceInputs: figureLabsReferenceInputs,
      publicWorkflowStages: figureLabsWorkflowStages,
      publicOutputFormats: figureLabsFormats,
      publicAssuranceArtifacts: figureLabsAssuranceArtifacts,
      sourceRefs: figureLabsSourceRefs,
      sourceEvidence: figureLabsSourceEvidence,
    },
    mdprSkill: {
      focus: "MDPR companion for deterministic presentation generation, review, validation, and proposal artifacts",
      inputFormats,
      outputFormats,
      comparisonReportFormats,
      artifactContracts,
      editableOutputs: ["pptx"],
      deterministicRuntime: "MDPR",
      workflowStages: mdprWorkflowStages,
      assuranceArtifacts: mdprAssuranceArtifacts,
      figureLabsGapClosures: [
        "generated-image-request-candidates-for-large-or-ambiguous-icon-slots",
        "markdown-source-hash-checks-before-hint-or-proposal-generation",
        "approval-bound-change-requests-before-runtime-application",
        "machine-readable-review-and-evidence-artifacts",
        "release-preflight-and-consumer-install-gates",
      ],
      completenessSignals: mdprCompletenessSignals,
      boundaries: [
        "MDPR owns final parsing, layout, theme, assets, renderer objects, and PPTX output.",
        "mdpr-skill emits weak semantic hints, review findings, and approval-bound proposals.",
      ],
    },
    coverage: {
      figureLabs: {
        publicFormatFamilies: new Set(figureLabsFormats).size,
        publiclyDocumentedOutputFormats: figureLabsFormats.length,
        publicWorkflowStages: figureLabsWorkflowStages.length,
        publicAssuranceArtifacts: figureLabsAssuranceArtifacts.length,
        publicEvidenceClaims: figureLabsSourceEvidence.length,
      },
      mdprSkill: {
        formatFamilies: mdprSkillFormatFamilies.size,
        inputFormatFamilies: inputFormats.length,
        outputFormatFamilies: outputFormats.length,
        comparisonReportFormats: comparisonReportFormats.length,
        artifactContracts: artifactContracts.length,
        workflowCompletenessSignals: mdprCompletenessSignals.length,
        assuranceArtifacts: mdprAssuranceArtifacts.length,
      },
    },
    advantageClaim: "mdpr-skill+MDPR covers more repository-verifiable presentation workflow inputs, outputs, and machine-readable contracts; FigureLabs remains specialized for direct scientific illustration generation.",
  };
}

function validateFormatCapabilities(report: Record<string, unknown>, artifactPath: string): Record<string, unknown> {
  const issues: string[] = [];
  const schemaUrl = "https://mdpresent.dev/schemas/mdpr-format-capabilities.schema.json";
  expectExact(report, "$schema", schemaUrl, issues);
  expectExact(report, "schemaVersion", "mdpr-skill-format-capabilities-v1", issues);
  expectExact(report, "generatedBy", "mdpr-skill", issues);

  const comparisonTarget = requireRecordField(report, "comparisonTarget", issues);
  expectExact(comparisonTarget, "name", "FigureLabs", issues);
  expectExact(comparisonTarget, "sourceReviewedDate", "2026-06-30", issues, "comparisonTarget.sourceReviewedDate");
  expectExact(comparisonTarget, "sourceReviewTimezone", "Asia/Seoul", issues, "comparisonTarget.sourceReviewTimezone");
  const sourceReviewScope = comparisonTarget.sourceReviewScope;
  if (typeof sourceReviewScope !== "string" || !sourceReviewScope.includes("public FigureLabs pages")) {
    issues.push("comparisonTarget.sourceReviewScope must describe public FigureLabs pages");
  }
  const publicInputModes = requireStringArrayField(comparisonTarget, "publicInputModes", issues);
  const publicReferenceInputs = requireStringArrayField(comparisonTarget, "publicReferenceInputs", issues);
  const publicWorkflowStages = requireStringArrayField(comparisonTarget, "publicWorkflowStages", issues);
  const publicOutputFormats = requireStringArrayField(comparisonTarget, "publicOutputFormats", issues);
  const publicAssuranceArtifacts = requireStringArrayField(comparisonTarget, "publicAssuranceArtifacts", issues);
  const sourceRefs = requireStringArrayField(comparisonTarget, "sourceRefs", issues);
  const sourceEvidence = requireSourceEvidenceField(comparisonTarget, sourceRefs, issues);
  if (sourceRefs.some((ref) => !ref.startsWith("https://"))) {
    issues.push("comparisonTarget.sourceRefs must contain https URLs");
  }

  const mdprSkill = requireRecordField(report, "mdprSkill", issues);
  const inputFormats = requireStringArrayField(mdprSkill, "inputFormats", issues);
  const outputFormats = requireStringArrayField(mdprSkill, "outputFormats", issues);
  const comparisonReportFormats = requireStringArrayField(mdprSkill, "comparisonReportFormats", issues);
  const artifactContracts = requireStringArrayField(mdprSkill, "artifactContracts", issues);
  requireStringArrayField(mdprSkill, "editableOutputs", issues);
  expectExact(mdprSkill, "deterministicRuntime", "MDPR", issues);
  requireStringArrayField(mdprSkill, "workflowStages", issues);
  const assuranceArtifacts = requireStringArrayField(mdprSkill, "assuranceArtifacts", issues);
  requireStringArrayField(mdprSkill, "figureLabsGapClosures", issues);
  const completenessSignals = requireStringArrayField(mdprSkill, "completenessSignals", issues);
  requireStringArrayField(mdprSkill, "boundaries", issues);

  const coverage = requireRecordField(report, "coverage", issues);
  const figureLabsCoverage = requireRecordField(coverage, "figureLabs", issues);
  const mdprCoverage = requireRecordField(coverage, "mdprSkill", issues);
  expectNumber(figureLabsCoverage, "publicFormatFamilies", new Set(publicOutputFormats).size, issues, "coverage.figureLabs.publicFormatFamilies");
  expectNumber(figureLabsCoverage, "publiclyDocumentedOutputFormats", publicOutputFormats.length, issues, "coverage.figureLabs.publiclyDocumentedOutputFormats");
  expectNumber(figureLabsCoverage, "publicWorkflowStages", publicWorkflowStages.length, issues, "coverage.figureLabs.publicWorkflowStages");
  expectNumber(figureLabsCoverage, "publicAssuranceArtifacts", publicAssuranceArtifacts.length, issues, "coverage.figureLabs.publicAssuranceArtifacts");
  expectNumber(figureLabsCoverage, "publicEvidenceClaims", sourceEvidence.length, issues, "coverage.figureLabs.publicEvidenceClaims");

  const formatFamilies = new Set([
    ...inputFormats,
    ...outputFormats,
    ...artifactContracts,
  ]);
  expectNumber(mdprCoverage, "formatFamilies", formatFamilies.size, issues, "coverage.mdprSkill.formatFamilies");
  expectNumber(mdprCoverage, "inputFormatFamilies", inputFormats.length, issues, "coverage.mdprSkill.inputFormatFamilies");
  expectNumber(mdprCoverage, "outputFormatFamilies", outputFormats.length, issues, "coverage.mdprSkill.outputFormatFamilies");
  expectNumber(mdprCoverage, "comparisonReportFormats", comparisonReportFormats.length, issues, "coverage.mdprSkill.comparisonReportFormats");
  expectNumber(mdprCoverage, "artifactContracts", artifactContracts.length, issues, "coverage.mdprSkill.artifactContracts");
  expectNumber(mdprCoverage, "workflowCompletenessSignals", completenessSignals.length, issues, "coverage.mdprSkill.workflowCompletenessSignals");
  expectNumber(mdprCoverage, "assuranceArtifacts", assuranceArtifacts.length, issues, "coverage.mdprSkill.assuranceArtifacts");

  const mdprFormatFamilies = readNumber(mdprCoverage, "formatFamilies");
  const figureLabsFormatFamilies = readNumber(figureLabsCoverage, "publicFormatFamilies");
  const mdprWorkflowSignals = readNumber(mdprCoverage, "workflowCompletenessSignals");
  const figureLabsWorkflowStages = readNumber(figureLabsCoverage, "publicWorkflowStages");
  const mdprAssuranceArtifacts = readNumber(mdprCoverage, "assuranceArtifacts");
  const figureLabsAssuranceArtifacts = readNumber(figureLabsCoverage, "publicAssuranceArtifacts");
  if (mdprFormatFamilies <= figureLabsFormatFamilies) {
    issues.push("coverage.mdprSkill.formatFamilies must exceed coverage.figureLabs.publicFormatFamilies");
  }
  if (mdprWorkflowSignals <= figureLabsWorkflowStages) {
    issues.push("coverage.mdprSkill.workflowCompletenessSignals must exceed coverage.figureLabs.publicWorkflowStages");
  }
  if (mdprAssuranceArtifacts <= figureLabsAssuranceArtifacts) {
    issues.push("coverage.mdprSkill.assuranceArtifacts must exceed coverage.figureLabs.publicAssuranceArtifacts");
  }
  const advantageClaim = report.advantageClaim;
  if (typeof advantageClaim !== "string" || !advantageClaim.includes("FigureLabs")) {
    issues.push("advantageClaim must be a string that names FigureLabs");
  }

  if (issues.length > 0) {
    throw new Error(`format capabilities validation failed: ${issues.join("; ")}`);
  }
  return {
    status: "pass",
    artifact: artifactPath,
    schema: schemaUrl,
    checks: [
      "schema-identity",
      "required-sections",
      "https-source-refs",
      "source-review-metadata",
      "source-evidence",
      "coverage-counts",
      "mdpr-skill-superiority",
    ],
    coverage: report.coverage,
  };
}

function renderFormatCapabilitiesMarkdown(report: Record<string, unknown>): string {
  const comparisonTarget = recordValue(report, "comparisonTarget");
  const mdprSkill = recordValue(report, "mdprSkill");
  const coverage = recordValue(report, "coverage");
  const figureLabsCoverage = recordValue(coverage, "figureLabs");
  const mdprCoverage = recordValue(coverage, "mdprSkill");
  const sourceRefs = stringArrayValue(comparisonTarget, "sourceRefs");
  const checks = [
    "schema-identity",
    "required-sections",
    "https-source-refs",
    "source-review-metadata",
    "source-evidence",
    "coverage-counts",
    "mdpr-skill-superiority",
  ];

  return [
    "# FigureLabs Format Capability Comparison",
    "",
    "Generated by `mdpr-skill` from public FigureLabs references.",
    `Source reviewed: ${stringValue(comparisonTarget, "sourceReviewedDate")} (${stringValue(comparisonTarget, "sourceReviewTimezone")}); scope: ${stringValue(comparisonTarget, "sourceReviewScope")}.`,
    "",
    "## Coverage",
    "",
    "| Metric | FigureLabs public workflow | mdpr-skill + MDPR |",
    "| --- | ---: | ---: |",
    `| Output/format families | ${numberValue(figureLabsCoverage, "publicFormatFamilies")} | ${numberValue(mdprCoverage, "outputFormatFamilies")} |`,
    `| Workflow/completeness signals | ${numberValue(figureLabsCoverage, "publicWorkflowStages")} | ${numberValue(mdprCoverage, "workflowCompletenessSignals")} |`,
    `| Assurance artifacts | ${numberValue(figureLabsCoverage, "publicAssuranceArtifacts")} | ${numberValue(mdprCoverage, "assuranceArtifacts")} |`,
    `| Machine-readable contracts | 0 | ${numberValue(mdprCoverage, "artifactContracts")} |`,
    `| Comparison report formats | 0 | ${numberValue(mdprCoverage, "comparisonReportFormats")} |`,
    "",
    "## Capability Matrix",
    "",
    "| Area | FigureLabs public workflow | mdpr-skill + MDPR |",
    "| --- | --- | --- |",
    `| Input modes | ${formatCapabilityList(stringArrayValue(comparisonTarget, "publicInputModes"))} | ${formatCapabilityList(stringArrayValue(mdprSkill, "inputFormats"))} |`,
    `| Output formats | ${formatCapabilityList(stringArrayValue(comparisonTarget, "publicOutputFormats"))} | ${formatCapabilityList(stringArrayValue(mdprSkill, "outputFormats"))} |`,
    `| Comparison report formats | Public comparison report exports not visible | ${formatCapabilityList(stringArrayValue(mdprSkill, "comparisonReportFormats"))} |`,
    `| Workflow | ${formatCapabilityList(stringArrayValue(comparisonTarget, "publicWorkflowStages"))} | ${formatCapabilityList(stringArrayValue(mdprSkill, "workflowStages"))} |`,
    `| Assurance | ${formatCapabilityList(stringArrayValue(comparisonTarget, "publicAssuranceArtifacts"))} | ${formatCapabilityList(stringArrayValue(mdprSkill, "assuranceArtifacts"))} |`,
    `| Contracts | Public repo-local schemas not visible | ${formatCapabilityList(stringArrayValue(mdprSkill, "artifactContracts"))} |`,
    "",
    "## Validation",
    "",
    `Schema: \`${stringValue(report, "$schema")}\``,
    `Checks: ${checks.join(", ")}`,
    "",
    "## Source References",
    "",
    ...sourceRefs.map((ref) => `- ${ref}`),
    "",
    "## Source Evidence",
    "",
    "| Claim ID | Public claim | Sources |",
    "| --- | --- | --- |",
    ...sourceEvidenceArrayValue(comparisonTarget).map((item) => `| ${item.claimId} | ${item.claim} | ${item.sourceRefs.join(", ")} |`),
    "",
    `Advantage claim: ${stringValue(report, "advantageClaim")}`,
  ].join("\n");
}

function renderFormatCapabilitiesHtml(report: Record<string, unknown>): string {
  const comparisonTarget = recordValue(report, "comparisonTarget");
  const mdprSkill = recordValue(report, "mdprSkill");
  const coverage = recordValue(report, "coverage");
  const figureLabsCoverage = recordValue(coverage, "figureLabs");
  const mdprCoverage = recordValue(coverage, "mdprSkill");
  const checks = [
    "schema-identity",
    "required-sections",
    "https-source-refs",
    "source-review-metadata",
    "source-evidence",
    "coverage-counts",
    "mdpr-skill-superiority",
  ];
  const rows = [
    ["Input modes", formatCapabilityList(stringArrayValue(comparisonTarget, "publicInputModes")), formatCapabilityList(stringArrayValue(mdprSkill, "inputFormats"))],
    ["Output formats", formatCapabilityList(stringArrayValue(comparisonTarget, "publicOutputFormats")), formatCapabilityList(stringArrayValue(mdprSkill, "outputFormats"))],
    ["Comparison report formats", "Public comparison report exports not visible", formatCapabilityList(stringArrayValue(mdprSkill, "comparisonReportFormats"))],
    ["Workflow", formatCapabilityList(stringArrayValue(comparisonTarget, "publicWorkflowStages")), formatCapabilityList(stringArrayValue(mdprSkill, "workflowStages"))],
    ["Assurance", formatCapabilityList(stringArrayValue(comparisonTarget, "publicAssuranceArtifacts")), formatCapabilityList(stringArrayValue(mdprSkill, "assuranceArtifacts"))],
    ["Contracts", "Public repo-local schemas not visible", formatCapabilityList(stringArrayValue(mdprSkill, "artifactContracts"))],
  ];
  const coverageRows = [
    ["Output/format families", String(numberValue(figureLabsCoverage, "publicFormatFamilies")), String(numberValue(mdprCoverage, "outputFormatFamilies"))],
    ["Workflow/completeness signals", String(numberValue(figureLabsCoverage, "publicWorkflowStages")), String(numberValue(mdprCoverage, "workflowCompletenessSignals"))],
    ["Assurance artifacts", String(numberValue(figureLabsCoverage, "publicAssuranceArtifacts")), String(numberValue(mdprCoverage, "assuranceArtifacts"))],
    ["Machine-readable contracts", "0", String(numberValue(mdprCoverage, "artifactContracts"))],
    ["Comparison report formats", "0", String(numberValue(mdprCoverage, "comparisonReportFormats"))],
  ];
  const evidenceRows = sourceEvidenceArrayValue(comparisonTarget).map((item) => [
    item.claimId,
    item.claim,
    item.sourceRefs.join(", "),
  ]);
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>FigureLabs Format Capability Comparison</title>",
    "<style>body{font-family:Arial,sans-serif;line-height:1.5;margin:32px;max-width:1100px}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #d0d7de;padding:8px;text-align:left;vertical-align:top}th{background:#f6f8fa}code{background:#f6f8fa;padding:2px 4px}</style>",
    "</head>",
    "<body>",
    "<h1>FigureLabs Format Capability Comparison</h1>",
    "<p>Generated by <code>mdpr-skill</code> from public FigureLabs references.</p>",
    `<p>Source reviewed: ${escapeHtml(stringValue(comparisonTarget, "sourceReviewedDate"))} (${escapeHtml(stringValue(comparisonTarget, "sourceReviewTimezone"))}); scope: ${escapeHtml(stringValue(comparisonTarget, "sourceReviewScope"))}.</p>`,
    "<h2>Coverage</h2>",
    renderHtmlTable(["Metric", "FigureLabs public workflow", "mdpr-skill + MDPR"], coverageRows),
    "<h2>Capability Matrix</h2>",
    renderHtmlTable(["Area", "FigureLabs public workflow", "mdpr-skill + MDPR"], rows),
    "<h2>Validation</h2>",
    `<p>Schema: <code>${escapeHtml(stringValue(report, "$schema"))}</code></p>`,
    `<p>Checks: ${escapeHtml(checks.join(", "))}</p>`,
    "<h2>Source References</h2>",
    `<ul>${stringArrayValue(comparisonTarget, "sourceRefs").map((ref) => `<li><a href="${escapeHtml(ref)}">${escapeHtml(ref)}</a></li>`).join("")}</ul>`,
    "<h2>Source Evidence</h2>",
    renderHtmlTable(["Claim ID", "Public claim", "Sources"], evidenceRows),
    `<p>${escapeHtml(stringValue(report, "advantageClaim"))}</p>`,
    "</body>",
    "</html>",
  ].join("\n");
}

function renderHtmlTable(headers: string[], rows: string[][]): string {
  return [
    "<table>",
    `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`,
    `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table>",
  ].join("\n");
}

function recordValue(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const field = value[key];
  return field && typeof field === "object" && !Array.isArray(field) ? field as Record<string, unknown> : {};
}

function stringArrayValue(value: Record<string, unknown>, key: string): string[] {
  const field = value[key];
  return Array.isArray(field) ? field.filter((item): item is string => typeof item === "string") : [];
}

function sourceEvidenceArrayValue(value: Record<string, unknown>): Array<{ claimId: string; claim: string; sourceRefs: string[] }> {
  const field = value.sourceEvidence;
  if (!Array.isArray(field)) return [];
  return field.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const claimId = typeof record.claimId === "string" ? record.claimId : "";
    const claim = typeof record.claim === "string" ? record.claim : "";
    const sourceRefs = Array.isArray(record.sourceRefs) ? record.sourceRefs.filter((ref): ref is string => typeof ref === "string") : [];
    return claimId && claim && sourceRefs.length > 0 ? [{ claimId, claim, sourceRefs }] : [];
  });
}

function stringValue(value: Record<string, unknown>, key: string): string {
  const field = value[key];
  return typeof field === "string" ? field : "";
}

function numberValue(value: Record<string, unknown>, key: string): number {
  const field = value[key];
  return typeof field === "number" ? field : 0;
}

function formatCapabilityList(values: string[]): string {
  return values.map(formatCapabilityName).join(", ");
}

function formatCapabilityName(value: string): string {
  const knownNames: Record<string, string> = {
    html: "HTML",
    jpg: "JPG",
    json: "JSON",
    markdown: "Markdown",
    pdf: "PDF",
    png: "PNG",
    pptx: "PPTX",
    svg: "SVG",
  };
  if (knownNames[value]) return knownNames[value];
  return value.split("-").map(formatCapabilityPart).join(" ");
}

function formatCapabilityPart(value: string): string {
  const knownParts: Record<string, string> = {
    html: "HTML",
    ir: "IR",
    jpg: "JPG",
    json: "JSON",
    md: "MD",
    mdpr: "MDPR",
    npm: "npm",
    pdf: "PDF",
    png: "PNG",
    pptx: "PPTX",
    sha256: "SHA-256",
    svg: "SVG",
  };
  if (knownParts[value]) return knownParts[value];
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function requireRecordField(value: Record<string, unknown>, key: string, issues: string[]): Record<string, unknown> {
  const field = value[key];
  if (!field || typeof field !== "object" || Array.isArray(field)) {
    issues.push(`${key} must be an object`);
    return {};
  }
  return field as Record<string, unknown>;
}

function requireStringArrayField(value: Record<string, unknown>, key: string, issues: string[]): string[] {
  const field = value[key];
  if (!Array.isArray(field) || field.length === 0 || !field.every((item) => typeof item === "string" && item.length > 0)) {
    issues.push(`${key} must be a non-empty string array`);
    return [];
  }
  return field as string[];
}

function requireSourceEvidenceField(value: Record<string, unknown>, allowedSourceRefs: string[], issues: string[]): Array<{ claimId: string; claim: string; sourceRefs: string[] }> {
  const field = value.sourceEvidence;
  if (!Array.isArray(field) || field.length === 0) {
    issues.push("comparisonTarget.sourceEvidence must be a non-empty array");
    return [];
  }
  const allowed = new Set(allowedSourceRefs);
  const evidence: Array<{ claimId: string; claim: string; sourceRefs: string[] }> = [];
  for (const [index, item] of field.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      issues.push(`comparisonTarget.sourceEvidence[${index}] must be an object`);
      continue;
    }
    const record = item as Record<string, unknown>;
    const claimId = record.claimId;
    const claim = record.claim;
    const sourceRefs = record.sourceRefs;
    if (typeof claimId !== "string" || claimId.length === 0) {
      issues.push(`comparisonTarget.sourceEvidence[${index}].claimId must be a non-empty string`);
    }
    if (typeof claim !== "string" || claim.length === 0) {
      issues.push(`comparisonTarget.sourceEvidence[${index}].claim must be a non-empty string`);
    }
    if (!Array.isArray(sourceRefs) || sourceRefs.length === 0 || !sourceRefs.every((ref) => typeof ref === "string" && ref.startsWith("https://") && allowed.has(ref))) {
      issues.push(`comparisonTarget.sourceEvidence[${index}].sourceRefs must contain https URLs from comparisonTarget.sourceRefs`);
      continue;
    }
    if (typeof claimId === "string" && typeof claim === "string") {
      evidence.push({ claimId, claim, sourceRefs: sourceRefs as string[] });
    }
  }
  return evidence;
}

function expectExact(value: Record<string, unknown>, key: string, expected: string, issues: string[], label = key): void {
  if (value[key] !== expected) issues.push(`${label} must be ${expected}`);
}

function expectNumber(value: Record<string, unknown>, key: string, expected: number, issues: string[], label: string): void {
  if (value[key] !== expected) issues.push(`${label} must equal ${expected}`);
}

function readNumber(value: Record<string, unknown>, key: string): number {
  return typeof value[key] === "number" ? value[key] : Number.NaN;
}

function resolveInvocationPath(path: string): string {
  if (isAbsolute(path)) return path;
  return resolve(process.env.MDPR_SKILL_INVOKE_CWD ?? process.cwd(), path);
}

function runChangeCommand(args: string[], io: CliIo): number {
  const subcommand = args.shift();
  const sourcePath = args.shift();
  if (!subcommand || !sourcePath || sourcePath.startsWith("--")) throw new Error("change requires approve|reject and a change request path");
  const options = parseOptions(args);
  const request = readJson(sourcePath) as ChangeRequest;
  const nextStage: ChangeStage = subcommand === "approve" ? "approved" : subcommand === "reject" ? "rejected" : undefined as never;
  if (!nextStage) throw new Error(`Unknown change subcommand: ${subcommand}`);
  const updated = transitionChangeRequest(request, nextStage, {
    approvedBy: options["approved-by"] ?? "user",
    approvedAt: options["approved-at"] ?? new Date().toISOString(),
  });
  const outPath = options.out ?? sourcePath;
  writeJson(outPath, updated);
  io.stdout(JSON.stringify({ status: "pass", stage: updated.stage, out: outPath }, null, 2));
  return 0;
}

function parseOptions(args: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return options;
}

function splitCsvOption(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function requireOption(options: Record<string, string>, key: string): string {
  const value = options[key];
  if (!value) throw new Error(`Missing required option --${key}`);
  return value;
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readText(path)) as Record<string, unknown>;
}

function readText(path: string): string {
  return readFileSync(resolveInvocationPath(path), "utf-8");
}

function readSources(path: string): CitationSource[] {
  const value = readJson(path);
  const sources = Array.isArray(value.sources) ? value.sources : Array.isArray(value) ? value : [];
  return sources.map((source) => source && typeof source === "object" ? source as CitationSource : {});
}

function readRenderedImages(path: string): RenderedPreviewImage[] {
  const value = readJson(path);
  const images = Array.isArray(value.images) ? value.images : Array.isArray(value) ? value : [];
  return images.map((image) => image && typeof image === "object" ? image as RenderedPreviewImage : { imagePath: "" });
}

function readMdprEvidence(path: string): MdprEvidenceRef[] {
  const value = readJson(path);
  const evidence = Array.isArray(value.evidence) ? value.evidence : Array.isArray(value) ? value : [];
  return evidence.map((item) => item && typeof item === "object" ? item as MdprEvidenceRef : { evidenceId: "" });
}

function writeJson(path: string, value: unknown): void {
  const targetPath = resolveInvocationPath(path);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

function writeText(path: string, value: string): void {
  const targetPath = resolveInvocationPath(path);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${value}\n`, "utf-8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
