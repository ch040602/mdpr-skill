import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildAgentHintManifest } from "../../hints-core/src/index";
import { buildReviewReport, reviewCoherence, reviewDesignPolicy, reviewVisualPolicy } from "../../review-core/src/index";
import { runMdprSkillEval } from "../../eval-core/src/index";
import { transitionChangeRequest, type ChangeRequest, type ChangeStage } from "../../change-core/src/index";
import { buildEditIntent, editIntentToOverrideCandidate, type EditIntentPreferences } from "../../edit-core/src/index";
import { analyzeHtmlDesign, buildThemeCandidateFromDesignMd } from "./commands/design";
import { runValidateSchemaSync } from "./commands/validateSchemaSync";

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
    if (command === "eval") return runEvalCommand(args, io);
    if (command === "edit") return runEditCommand(args, io);
    if (command === "design") return runDesignCommand(args, io);
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
    "  hint --source-sha256 <64hex> --out <agent-hint.json>",
    "  review --manifest <manifest.json> [--presentation <presentation-ir.json>] [--layout <layout-ir.json>] --out <review-report.json>",
    "  eval <deck.md> --out <dir> [--mdpr-path <MdPr>] [--hints <agent-hint.json>]",
    "  edit override-candidate --source-sha256 <64hex> --slide-ref <slide> --instruction <text> --split-by <h3|none> --out <override.json>",
    "  design import <DESIGN.md> --out <theme-candidate.json>",
    "  design analyze-html <file.html> --out <html-design-analysis.json>",
    "  gate validate-schema-sync --mdpr-path <MdPr> [--shared-schema <name[,name]>]",
    "  change approve|reject <change-request.json> --out <change-request.json>",
  ].join("\n");
}

function runSchemaSyncCommand(args: string[], io: CliIo): number {
  const command = args[0] === "validate-schema-sync" ? args.shift() : "validate-schema-sync";
  if (command !== "validate-schema-sync") throw new Error("Only gate validate-schema-sync is supported");
  const options = parseOptions(args);
  const result = runValidateSchemaSync({
    mdprPath: options["mdpr-path"],
    localSchemaPath: options["local-schema"],
    sharedSchemaNames: options["shared-schema"] ? splitCsvOption(options["shared-schema"]) : undefined,
  });
  io.stdout(JSON.stringify(result, null, 2));
  return result.status === "pass" ? 0 : 1;
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
  const sourceSha256 = requireOption(options, "source-sha256");
  const manifest = buildAgentHintManifest(sourceSha256, [], {
    generatedAt: options["generated-at"],
    mdprVersion: options["mdpr-version"],
  });
  writeJson(requireOption(options, "out"), manifest);
  io.stdout(JSON.stringify({ status: "pass", out: options.out }, null, 2));
  return 0;
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

function runEvalCommand(args: string[], io: CliIo): number {
  const deckPath = args.shift();
  if (!deckPath || deckPath.startsWith("--")) throw new Error("eval requires <deck.md>");
  const options = parseOptions(args);
  const outDir = requireOption(options, "out");
  const report = runMdprSkillEval({
    deckPath,
    outDir,
    mdprPath: options["mdpr-path"],
    hintsPath: options.hints,
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
      content: readFileSync(sourcePath, "utf-8"),
    });
    writeJson(outPath, candidate);
    io.stdout(JSON.stringify({ status: "pass", out: outPath }, null, 2));
    return 0;
  }
  if (subcommand === "analyze-html") {
    const analysis = analyzeHtmlDesign({ html: readFileSync(sourcePath, "utf-8") });
    writeJson(outPath, analysis);
    io.stdout(JSON.stringify({ status: "pass", out: outPath }, null, 2));
    return 0;
  }
  throw new Error(`Unknown design subcommand: ${subcommand}`);
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
  return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
