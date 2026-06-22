import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

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
