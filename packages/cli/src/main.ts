import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildAgentHintManifest, hintFromSelectionContext, type HintBuildOptions, type SelectionContext } from "../../hints-core/src/index.js";
import { buildReviewReport, buildSourceSlideEvidenceLedger, renderReadmeTeaserSvg, reviewAccessibilityContent, reviewCitationProvenance, reviewCoherence, reviewDesignPolicy, reviewNarrativeSpine, reviewRenderedPreviewCritique, reviewSpeakerNotes, reviewTemplateLayoutIntent, reviewVisualPolicy, type CitationSource, type MdprEvidenceRef, type ReadmeTeaserSpec, type RenderedPreviewImage } from "../../review-core/src/index.js";
import { runMdprSkillEval } from "../../eval-core/src/index.js";
import { createChangeRequest, transitionChangeRequest, type ChangeRequest, type ChangeStage } from "../../change-core/src/index.js";
import { buildEditIntent, editIntentToOverrideCandidate, type EditIntentPreferences } from "../../edit-core/src/index.js";
import { buildCodexPptCompatMap } from "./commands/codexPptCompat.js";
import { validateGeneratedAssetsManifest } from "./commands/codexPptGeneratedAssets.js";
import { createMdprJobState, summarizeMdprJobState, updateMdprJobState, validateMdprJobState, type MdprJobState } from "./commands/codexPptJobState.js";
import { buildCodexPptSlideTaskPackets } from "./commands/codexPptSlideTasks.js";
import { analyzeHtmlDesign, buildThemeCandidateFromDesignMd } from "./commands/design.js";
import { listAgentDocTopics, renderAgentDocList, renderAgentDocs, type AgentDocTopic } from "./commands/agentDocs.js";
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
    if (command === "docs") return runDocsCommand(args, io);
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
    if (command === "codex-ppt") return runCodexPptCommand(args, io);
    if (command === "teaser") return runTeaserCommand(args, io);
    if (command === "change") return runChangeCommand(args, io);

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
    "  docs --list | docs <bootstrap|boundaries|commands|template-fill|media|preflight|review|design-import|astryx-comparison> [--dense] [--json]",
    "  hint (--source-sha256 <64hex> | --selection-context <selection-context.json> [--markdown <deck.md>]) --out <agent-hint.json> [--workflow-intent template-fill] [--template-source <ref>] [--preserve-master-slides true] [--image-policy no-image] [--image-search-policy disabled] [--icon-policy no-new-icons]",
    "  review --manifest <manifest.json> [--presentation <presentation-ir.json>] [--layout <layout-ir.json>] [--template-summary <template-summary.json>] --out <review-report.json>",
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
    "  design import <DESIGN.md> --out <theme-candidate.json>  # tokens plus layout/decoration style-pack proposal",
    "  design analyze-html <file.html> --out <html-design-analysis.json>",
    "  codex-ppt compat --out <compat-map.json> [--source-ref <repo@sha>]",
    "  codex-ppt slide-tasks --manifest <mdpresent-manifest.json> [--markdown <deck.md>] [--rendered-images <images.json>] --out <dir>",
    "  codex-ppt job-state init|update|status|validate --state <mdpr-job-state.json> [--tasks <slide-task-packets.json>] [--out <mdpr-job-state.json>]",
    "  codex-ppt generated-assets validate --manifest <mdpr-generated-assets.json>",
    "  teaser --spec <readme-teaser.json> --out <readme-teaser.svg>",
    "  gate validate-schema-sync --mdpr-path <MdPr> [--shared-schema <name[,name]>]",
    "  change approve|reject <change-request.json> --out <change-request.json>",
  ].join("\n");
}

function runDocsCommand(args: string[], io: CliIo): number {
  const topicArg = args[0] && !args[0].startsWith("--") ? args.shift() : undefined;
  const options = parseOptions(args);
  if (options.list === "true" || !topicArg) {
    if (options.json === "true") {
      io.stdout(JSON.stringify({
        schemaVersion: "mdpr-skill-agent-docs-v1",
        generatedBy: "mdpr-skill",
        topics: listAgentDocTopics(),
      }, null, 2));
    } else {
      io.stdout(renderAgentDocList());
    }
    return 0;
  }

  const topic = parseAgentDocTopic(topicArg);
  if (options.json === "true") {
    io.stdout(JSON.stringify({
      schemaVersion: "mdpr-skill-agent-docs-v1",
      generatedBy: "mdpr-skill",
      topic,
      dense: options.dense === "true",
      markdown: renderAgentDocs(topic, { dense: options.dense === "true" }),
    }, null, 2));
  } else {
    io.stdout(renderAgentDocs(topic, { dense: options.dense === "true" }));
  }
  return 0;
}

function parseAgentDocTopic(value: string): AgentDocTopic {
  const allowed: AgentDocTopic[] = [
    "bootstrap",
    "boundaries",
    "commands",
    "template-fill",
    "media",
    "preflight",
    "review",
    "design-import",
    "astryx-comparison",
  ];
  if (allowed.includes(value as AgentDocTopic)) return value as AgentDocTopic;
  throw new Error(`Unknown docs topic: ${value}`);
}

function runCodexPptCommand(args: string[], io: CliIo): number {
  const subcommand = args.shift();
  if (subcommand === "slide-tasks") return runCodexPptSlideTasksCommand(args, io);
  if (subcommand === "job-state") return runCodexPptJobStateCommand(args, io);
  if (subcommand === "generated-assets") return runCodexPptGeneratedAssetsCommand(args, io);
  if (subcommand !== "compat") throw new Error("codex-ppt requires compat, slide-tasks, job-state, or generated-assets");
  const options = parseOptions(args);
  const outPath = requireOption(options, "out");
  const report = buildCodexPptCompatMap(options["source-ref"]);
  writeJson(outPath, report);
  io.stdout(JSON.stringify({
    status: report.coverage.unmappedFeatureCount === 0 ? "pass" : "fail",
    out: outPath,
    codexPptFeatureCount: report.coverage.codexPptFeatureCount,
    mappedFeatureCount: report.coverage.mappedFeatureCount,
    mdprRuntimeRequiredCount: report.coverage.mdprRuntimeRequiredCount,
  }, null, 2));
  return report.coverage.unmappedFeatureCount === 0 ? 0 : 1;
}

function runCodexPptGeneratedAssetsCommand(args: string[], io: CliIo): number {
  const action = args.shift();
  if (action !== "validate") throw new Error("codex-ppt generated-assets requires validate");
  const options = parseOptions(args);
  const validation = validateGeneratedAssetsManifest(readJson(requireOption(options, "manifest")));
  const output = JSON.stringify(validation, null, 2);
  if (validation.valid) io.stdout(output);
  else io.stderr(output);
  return validation.valid ? 0 : 1;
}

function runCodexPptJobStateCommand(args: string[], io: CliIo): number {
  const action = args.shift();
  if (!action) throw new Error("codex-ppt job-state requires init, update, status, or validate");
  const options = parseOptions(args);
  if (action === "init") {
    const tasksPath = requireOption(options, "tasks");
    const outPath = requireOption(options, "out");
    const state = createMdprJobState({
      taskPacketSet: readJson(tasksPath),
      taskPacketSetPath: tasksPath,
      manifestPath: options.manifest,
    });
    writeJson(outPath, state);
    io.stdout(JSON.stringify({
      status: "pass",
      out: outPath,
      taskCount: state.tasks.length,
    }, null, 2));
    return 0;
  }

  const statePath = requireOption(options, "state");
  const state = readJson(statePath) as MdprJobState;
  if (action === "update") {
    const next = updateMdprJobState({
      state,
      slideId: requireOption(options, "slide"),
      status: requireOption(options, "status"),
      workerId: options["worker-id"],
      evidencePath: options.evidence,
      blockerReason: options["blocker-reason"],
    });
    const outPath = options.out ?? statePath;
    writeJson(outPath, next);
    const event = next.events[next.events.length - 1];
    const task = next.tasks.find((item) => item.slideId === event?.slideId);
    io.stdout(JSON.stringify({
      status: "pass",
      out: outPath,
      slideId: task?.slideId,
      taskStatus: task?.status,
    }, null, 2));
    return 0;
  }
  if (action === "status") {
    io.stdout(JSON.stringify(summarizeMdprJobState(state), null, 2));
    return 0;
  }
  if (action === "validate") {
    const validation = validateMdprJobState(state);
    io.stdout(JSON.stringify(validation, null, 2));
    return validation.valid ? 0 : 1;
  }
  throw new Error(`Unknown codex-ppt job-state action: ${action}`);
}

function runCodexPptSlideTasksCommand(args: string[], io: CliIo): number {
  const options = parseOptions(args);
  const manifestPath = requireOption(options, "manifest");
  const outDir = resolveInvocationPath(requireOption(options, "out"));
  const markdownPath = options.markdown;
  const renderedImagesPath = options["rendered-images"];
  const result = buildCodexPptSlideTaskPackets({
    manifest: readJson(manifestPath),
    manifestPath,
    markdown: markdownPath ? readText(markdownPath) : undefined,
    markdownPath,
    renderedImages: renderedImagesPath ? readJson(renderedImagesPath) : undefined,
    renderedImagesPath,
  });
  mkdirSync(outDir, { recursive: true });
  for (const file of result.packetFiles) {
    writeJson(`${outDir}/${file.fileName}`, file.packet);
  }
  writeJson(`${outDir}/slide-task-packets.json`, result.index);
  io.stdout(JSON.stringify({
    status: "pass",
    out: outDir,
    packetCount: result.index.packetCount,
  }, null, 2));
  return 0;
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
  const hint = hintFromSelectionContext(context, hintBuildOptions(options));
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
  const manifest = buildAgentHintManifest(sourceSha256, context ? [hintFromSelectionContext(context, hintBuildOptions(options))] : [], {
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
  const templateSummary = options["template-summary"] ? readJson(options["template-summary"]) : undefined;
  const report = buildReviewReport([
    ...reviewCoherence({ manifest, presentation, layout, templateSummary }),
    ...reviewVisualPolicy({ manifest, presentation, layout, templateSummary }),
    ...reviewDesignPolicy({ manifest, presentation, layout, templateSummary }),
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
  const catalogPath = options["layout-catalog"] ?? requireOption(options, "template-summary");
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

function hintBuildOptions(options: Record<string, string>): HintBuildOptions {
  return {
    ...(options["workflow-intent"] ? { workflowIntent: parseWorkflowIntent(options["workflow-intent"]) } : {}),
    ...(options["template-source"] ? { templateSourceRef: options["template-source"] } : {}),
    ...(options["preserve-master-slides"] === "true" ? { preserveMasterSlides: true } : {}),
    ...(options["source-image-ref"] ? { sourceImageRefs: splitCsvOption(options["source-image-ref"]) } : {}),
    ...(options["explicit-generated-asset-request-ref"] ? { explicitGeneratedAssetRequestRef: options["explicit-generated-asset-request-ref"] } : {}),
    ...(options["image-policy"] ? { imagePolicy: parseImagePolicy(options["image-policy"]) } : {}),
    ...(options["image-search-policy"] ? { imageSearchPolicy: parseImageSearchPolicy(options["image-search-policy"]) } : {}),
    ...(options["icon-policy"] ? { iconPolicy: parseIconPolicy(options["icon-policy"]) } : {}),
  };
}

function parseWorkflowIntent(value: string): NonNullable<HintBuildOptions["workflowIntent"]> {
  if (value === "template-fill" || value === "style-transform" || value === "theme-import" || value === "generated-asset-request") return value;
  throw new Error(`Unsupported --workflow-intent value: ${value}`);
}

function parseImagePolicy(value: string): NonNullable<HintBuildOptions["imagePolicy"]> {
  if (value === "no-image" || value === "source-image-only" || value === "generated-asset-approved") return value;
  throw new Error(`Unsupported --image-policy value: ${value}`);
}

function parseImageSearchPolicy(value: string): NonNullable<HintBuildOptions["imageSearchPolicy"]> {
  if (value === "disabled" || value === "source-evidence-only" || value === "explicit-request-only") return value;
  throw new Error(`Unsupported --image-search-policy value: ${value}`);
}

function parseIconPolicy(value: string): NonNullable<HintBuildOptions["iconPolicy"]> {
  if (value === "no-new-icons" || value === "semantic-keywords-only") return value;
  throw new Error(`Unsupported --icon-policy value: ${value}`);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
