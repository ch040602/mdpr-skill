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
  const manifest = JSON.parse(readFileSync(ref.path, "utf-8")) as Record<string, unknown>;
  const source = manifest.source && typeof manifest.source === "object" ? manifest.source as Record<string, unknown> : {};
  const sourceSha256 = ref.sourceSha256 ?? String(manifest.sourceSha256 ?? source.sha256 ?? "");
  return {
    sourceSha256,
    manifest,
    presentation: ref.presentationPath ? JSON.parse(readFileSync(ref.presentationPath, "utf-8")) : undefined,
    layout: ref.layoutPath ? JSON.parse(readFileSync(ref.layoutPath, "utf-8")) : undefined,
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

export function runMdprInspect(input: MdprRunInput): MdprRunResult {
  const args = ["inspect", input.deckPath, "--json"];
  return runMdpr(args, { mdprPath: input.mdprPath, mdprBinary: input.mdprBinary });
}

export function runMdprValidate(input: MdprRunInput): MdprRunResult {
  const args = ["validate", input.deckPath];
  if (input.hintsPath) args.push("--hints", input.hintsPath);
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
