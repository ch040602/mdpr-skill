import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type MdprManifestRef = {
  path: string;
  sourceSha256?: string;
  presentationPath?: string;
  layoutPath?: string;
};

export type MdprAdapterFailureKind = "command-failed" | "artifact-missing" | "artifact-invalid";

export class MdprAdapterError extends Error {
  constructor(
    public readonly kind: MdprAdapterFailureKind,
    message: string,
    public readonly context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "MdprAdapterError";
  }
}

export type MdprContext = {
  sourceSha256: string;
  manifest: Record<string, unknown>;
  presentation?: Record<string, unknown>;
  layout?: Record<string, unknown>;
};

export type MdprRunInput = {
  deckPath: string;
  mdprPath?: string;
  mdprBinary?: string;
  outDir?: string;
  hintsPath?: string;
  packPath?: string;
  visual?: boolean;
  coherence?: boolean;
  strict?: boolean;
  formats?: Array<"pptx" | "html" | "pdf">;
};

export type MdprRunResult = {
  command: string[];
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  outDir?: string;
  manifestPath?: string;
};

export function loadMdprContext(ref: MdprManifestRef): MdprContext {
  const manifest = readJsonArtifact(ref.path, "manifest");
  const source = manifest.source && typeof manifest.source === "object" ? manifest.source as Record<string, unknown> : {};
  const sourceSha256 = ref.sourceSha256 ?? String(manifest.sourceSha256 ?? source.sha256 ?? "");
  return {
    sourceSha256,
    manifest,
    presentation: ref.presentationPath ? readJsonArtifact(ref.presentationPath, "presentation") : undefined,
    layout: ref.layoutPath ? readJsonArtifact(ref.layoutPath, "layout") : undefined,
  };
}

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function resolveMdprBinary(input: { mdprPath?: string; mdprBinary?: string } = {}): string {
  if (input.mdprBinary) return input.mdprBinary;
  if (input.mdprPath) return join(input.mdprPath, "packages", "cli", "dist", "index.js");
  return "mdpresent";
}

export function runMdpr(args: string[], input: { mdprPath?: string; mdprBinary?: string; cwd?: string } = {}): MdprRunResult {
  const binary = resolveMdprBinary(input);
  const cwd = input.cwd ?? input.mdprPath ?? process.cwd();
  const isNodeEntrypoint = binary.endsWith(".js");
  const command = isNodeEntrypoint ? [process.execPath, binary, ...args] : [binary, ...args];
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf-8",
    shell: process.platform === "win32" && !isNodeEntrypoint,
  });
  return {
    command,
    cwd,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function assertMdprRunSucceeded(result: MdprRunResult): void {
  if (result.exitCode === 0) return;
  throw new MdprAdapterError(
    "command-failed",
    `MDPR command failed with exit code ${result.exitCode}: ${result.command.join(" ")} (cwd: ${result.cwd})`,
    {
      command: result.command,
      cwd: result.cwd,
      exitCode: result.exitCode,
      stderr: result.stderr,
      stdout: result.stdout,
    },
  );
}

export function runMdprInspect(input: MdprRunInput): MdprRunResult {
  const args = ["inspect", input.deckPath, "--json"];
  return runMdpr(args, { mdprPath: input.mdprPath, mdprBinary: input.mdprBinary });
}

export function runMdprValidate(input: MdprRunInput): MdprRunResult {
  const args = ["validate", input.deckPath];
  if (input.hintsPath) args.push("--hints", input.hintsPath);
  if (input.packPath) args.push("--pack", input.packPath);
  if (input.visual) args.push("--visual");
  if (input.coherence) args.push("--coherence");
  if (input.strict) args.push("--strict");
  return runMdpr(args, { mdprPath: input.mdprPath, mdprBinary: input.mdprBinary });
}

export function runMdprBuild(input: MdprRunInput): MdprRunResult {
  const outDir = resolve(input.outDir ?? ".mdpresent/baseline");
  const args = [
    "build",
    input.deckPath,
    "--to",
    (input.formats ?? ["pptx", "html"]).join(","),
    "--out",
    outDir,
  ];
  if (input.hintsPath) args.push("--hints", input.hintsPath);
  if (input.packPath) args.push("--pack", input.packPath);
  if (input.visual) args.push("--visual");
  if (input.coherence) args.push("--coherence");
  if (input.strict) args.push("--strict");
  const result = runMdpr(args, { mdprPath: input.mdprPath, mdprBinary: input.mdprBinary });
  return {
    ...result,
    outDir,
    manifestPath: join(outDir, "mdpresent-manifest.json"),
  };
}

export function loadMdprArtifacts(outDir: string): MdprContext {
  return loadMdprContext({
    path: join(outDir, "mdpresent-manifest.json"),
    presentationPath: existsSync(join(outDir, "presentation-ir.json")) ? join(outDir, "presentation-ir.json") : undefined,
    layoutPath: existsSync(join(outDir, "layout-ir.json")) ? join(outDir, "layout-ir.json") : undefined,
  });
}

export function collectMdprMetrics(manifest: Record<string, unknown>): {
  overflowCount: number;
  coherenceWarnings: number;
  visualErrors: number;
  slideCount?: number;
} {
  const normalized = readRecord(manifest.metrics);
  if (normalized) {
    return {
      overflowCount: readNumber(normalized.overflowCount),
      coherenceWarnings: readNumber(normalized.coherenceWarningCount ?? normalized.coherenceWarnings),
      visualErrors: readNumber(normalized.visualErrorCount ?? normalized.visualErrors),
      slideCount: readOptionalNumber(normalized.slideCount ?? manifest.slideCount),
    };
  }

  const validation = readRecord(manifest.validation);
  if (validation) {
    return {
      overflowCount: countLayoutOverflow(readArray(validation.layoutOverflow)),
      coherenceWarnings: countCoherenceWarnings(readRecord(validation.coherence)),
      visualErrors: countVisualErrors(readRecord(validation.visual)),
      slideCount: readOptionalNumber(manifest.slideCount),
    };
  }

  const diagnostics = Array.isArray(manifest.diagnostics) ? manifest.diagnostics as Array<Record<string, unknown>> : [];
  const visual = manifest.visualValidation && typeof manifest.visualValidation === "object"
    ? manifest.visualValidation as Record<string, unknown>
    : {};
  return {
    overflowCount: diagnostics.filter((item) => String(item.code ?? "").toLowerCase().includes("overflow")).length,
    coherenceWarnings: diagnostics.filter((item) => String(item.code ?? "").toLowerCase().includes("coherence")).length,
    visualErrors: Number(visual.errors ?? 0),
    slideCount: typeof manifest.slideCount === "number" ? manifest.slideCount : undefined,
  };
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function readArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(readRecord(item)))
    : [];
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function countLayoutOverflow(diagnostics: Array<Record<string, unknown>>): number {
  return diagnostics.filter((item) => {
    const level = String(item.level ?? item.severity ?? "").toLowerCase();
    const code = String(item.code ?? "").toUpperCase();
    return level === "error" || code === "TEXT_OVERFLOW";
  }).length;
}

function countCoherenceWarnings(coherence: Record<string, unknown> | undefined): number {
  if (!coherence) return 0;
  const summaryKeys = [
    "captionDetached",
    "claimlessSlides",
    "orphanEvidenceBlocks",
    "sectionMotifDrift",
    "coherenceWarnings",
    "warningCount",
  ];
  const summaryTotal = summaryKeys.reduce((total, key) => total + readNumber(coherence[key]), 0);
  if (summaryTotal > 0) return summaryTotal;

  return readArray(coherence.diagnostics).filter((item) => {
    const level = String(item.level ?? item.severity ?? "warning").toLowerCase();
    return level !== "error";
  }).length;
}

function countVisualErrors(visual: Record<string, unknown> | undefined): number {
  if (!visual) return 0;
  const explicit = readNumber(visual.errors ?? visual.errorCount ?? visual.visualErrors);
  if (explicit > 0) return explicit;

  return readArray(visual.diagnostics).filter((item) => {
    const level = String(item.level ?? item.severity ?? "").toLowerCase();
    return level === "error";
  }).length;
}

function readJsonArtifact(path: string, label: string): Record<string, unknown> {
  if (!existsSync(path)) {
    throw new MdprAdapterError("artifact-missing", `Missing MDPR ${label} artifact: ${path}`, { path, label });
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  } catch (error) {
    throw new MdprAdapterError(
      "artifact-invalid",
      `Invalid MDPR ${label} artifact JSON: ${path}`,
      { path, label, cause: error instanceof Error ? error.message : String(error) },
    );
  }
}
