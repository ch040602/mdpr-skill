export type GeneratedAssetValidation = {
  schemaVersion: "mdpr-generated-assets-validation-v1";
  valid: boolean;
  assetCount: number;
  errors: string[];
  warnings: string[];
};

const hashPattern = /^[a-f0-9]{64}$/;
const sizePattern = /^[1-9][0-9]{1,4}x[1-9][0-9]{1,4}$/;
const qualityValues = ["low", "medium", "standard", "high", "hd"] as const;
const backgroundValues = ["auto", "opaque", "transparent"] as const;
const transparencyValues = ["not-needed", "preferred", "required", "forbidden"] as const;
const secretKeyPattern = /(api[-_]?key|secret|token|authorization|password|credential)/i;

export function validateGeneratedAssetsManifest(manifest: Record<string, unknown>): GeneratedAssetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (manifest.schemaVersion !== "mdpr-generated-assets-v1") errors.push("schemaVersion must be mdpr-generated-assets-v1");
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  if (assets.length === 0) errors.push("assets must contain at least one generated asset");
  assets.forEach((asset, index) => validateAsset(asset, index, errors, warnings));
  return {
    schemaVersion: "mdpr-generated-assets-validation-v1",
    valid: errors.length === 0,
    assetCount: assets.length,
    errors,
    warnings,
  };
}

function validateAsset(asset: unknown, index: number, errors: string[], warnings: string[]): void {
  const label = `assets[${index}]`;
  if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const record = asset as Record<string, unknown>;
  const assetId = stringValue(record.assetId);
  if (!assetId) errors.push(`${label}.assetId is required`);
  if (record.kind !== "generated-image") errors.push(`${assetId || label}.kind must be generated-image`);
  if (record.purpose === "full-slide-render") errors.push(`${assetId || label} cannot use purpose full-slide-render`);
  const provider = objectValue(record.provider);
  const request = objectValue(record.request);
  const boundary = objectValue(record.boundary);
  if (!provider) errors.push(`${assetId || label}.provider is required`);
  if (provider && containsSecretLikeField(provider)) errors.push(`${assetId || label} contains secret-like provider metadata`);
  if (!request) errors.push(`${assetId || label}.request is required`);
  if (!boundary) errors.push(`${assetId || label}.boundary is required`);

  const promptHash = stringValue(provider?.promptHash);
  if (!promptHash || !hashPattern.test(promptHash)) errors.push(`${assetId || label}.provider.promptHash must be a 64-character hex hash`);
  const sourceHashes = Array.isArray(provider?.sourceInputHashes) ? provider?.sourceInputHashes : [];
  for (const sourceHash of sourceHashes) {
    if (typeof sourceHash !== "string" || !hashPattern.test(sourceHash)) errors.push(`${assetId || label}.provider.sourceInputHashes entries must be 64-character hex hashes`);
  }

  const size = stringValue(request?.size);
  if (!size || !sizePattern.test(size)) errors.push(`${assetId || label}.request.size must be WIDTHxHEIGHT`);
  const quality = stringValue(request?.quality);
  if (!quality || !qualityValues.includes(quality as never)) errors.push(`${assetId || label}.request.quality is invalid`);
  const background = stringValue(request?.background);
  if (!background || !backgroundValues.includes(background as never)) errors.push(`${assetId || label}.request.background is invalid`);
  const transparency = stringValue(request?.transparency);
  if (!transparency || !transparencyValues.includes(transparency as never)) errors.push(`${assetId || label}.request.transparency is invalid`);
  if (request?.fullSlide === true) errors.push(`${assetId || label} cannot request full-slide rendering`);
  if (boundary?.mdprOwnsPlacement !== true) errors.push(`${assetId || label}.boundary.mdprOwnsPlacement must be true`);
  if (boundary?.notFullSlideRenderer !== true) errors.push(`${assetId || label}.boundary.notFullSlideRenderer must be true`);
  if (boundary?.noSecrets !== true) errors.push(`${assetId || label}.boundary.noSecrets must be true`);

  const supportedQualities = Array.isArray(provider?.supportedQualities)
    ? provider.supportedQualities.filter((item): item is string => typeof item === "string")
    : [];
  if (quality && supportedQualities.length > 0 && !supportedQualities.includes(quality)) {
    warnings.push(`${assetId || label} requests quality ${quality}, but provider metadata does not list it as supported`);
  }
  if ((transparency === "required" || background === "transparent") && provider?.supportsTransparency === false) {
    warnings.push(`${assetId || label} requests transparency, but provider metadata says transparency is unsupported`);
  }
}

function containsSecretLikeField(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSecretLikeField);
  return Object.entries(value as Record<string, unknown>).some(([key, item]) => secretKeyPattern.test(key) || containsSecretLikeField(item));
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
