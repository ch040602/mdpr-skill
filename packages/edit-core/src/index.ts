import { createChangeRequest, type ChangeRequest } from "../../change-core/src/index.js";
import { assertNoForbiddenFields } from "../../hints-core/src/index.js";

export type EditIntentTarget = {
  slideRef: string;
  blockHints?: string[];
  regionHints?: string[];
};

export type EditIntentPreferences = {
  emphasis?: "increase" | "decrease" | "preserve";
  layoutFamily?: "chart-table" | "timeline" | "numbered-rail" | "matrix" | "proof" | "comparison" | "summary";
  decorationFamily?: "numbered-rail" | "callout" | "proof-point" | "minimal" | "glass" | "data" | "icon-aside";
  groupingRole?: "claim" | "evidence-pack" | "workflow" | "summary" | "comparison";
  iconKeywordCandidates?: string[];
  preserveContent?: boolean;
  splitPreference?: {
    forceSingleSlide?: boolean;
    splitBy?: "h2" | "h3" | "h4" | "block-group" | "list-chunk" | "none";
    maxDensity?: number;
  };
};

export type EditIntent = {
  schemaVersion: "mdpr-edit-intent-v1";
  id: string;
  sourceSha256: string;
  instruction: string;
  target: EditIntentTarget;
  preferences?: EditIntentPreferences;
  boundary: {
    finalDesignDecision: "forbidden";
    mdprOwnsRendering: true;
  };
};

export type BuildEditIntentInput = {
  id: string;
  sourceSha256: string;
  instruction: string;
  target: EditIntentTarget;
  preferences?: EditIntentPreferences;
};

export type EditIntentChangeRequestInput = {
  id: string;
  sourceSha256: string;
  intent: EditIntent;
};

export function buildEditIntent(input: BuildEditIntentInput): EditIntent {
  validateSourceSha256(input.sourceSha256);
  if (!input.instruction.trim()) throw new Error("instruction is required");
  if (!input.target.slideRef.trim()) throw new Error("target.slideRef is required");
  const intent: EditIntent = {
    schemaVersion: "mdpr-edit-intent-v1",
    id: input.id,
    sourceSha256: input.sourceSha256,
    instruction: input.instruction,
    target: {
      slideRef: input.target.slideRef,
      ...(input.target.blockHints?.length ? { blockHints: uniqueNonEmpty(input.target.blockHints) } : {}),
      ...(input.target.regionHints?.length ? { regionHints: uniqueNonEmpty(input.target.regionHints) } : {}),
    },
    ...(input.preferences ? { preferences: input.preferences } : {}),
    boundary: {
      finalDesignDecision: "forbidden",
      mdprOwnsRendering: true,
    },
  };
  assertNoForbiddenFields(intent);
  return intent;
}

export function editIntentToChangeRequest(input: EditIntentChangeRequestInput): ChangeRequest {
  if (input.intent.sourceSha256 !== input.sourceSha256) {
    throw new Error("edit intent sourceSha256 must match change request sourceSha256");
  }
  return createChangeRequest({
    id: input.id,
    createdBy: "mdpr-skill",
    sourceSha256: input.sourceSha256,
    changes: [{ kind: "edit-intent", intent: input.intent }],
  });
}

export type MdprOverrideCandidate = {
  version: "1.0";
  operations: Array<{
    op: "setSplit";
    target: { slideId?: string; title?: string };
    value: NonNullable<EditIntentPreferences["splitPreference"]>;
    reason?: string;
  }>;
};

export function editIntentToOverrideCandidate(intent: EditIntent): MdprOverrideCandidate {
  const splitPreference = intent.preferences?.splitPreference;
  if (!splitPreference) throw new Error("splitPreference is required to create a setSplit override candidate");
  return {
    version: "1.0",
    operations: [{
      op: "setSplit",
      target: targetFromSlideRef(intent.target.slideRef),
      value: splitPreference,
      reason: intent.instruction,
    }],
  };
}

function validateSourceSha256(value: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error("sourceSha256 must be a 64-character lowercase hex string");
  }
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function targetFromSlideRef(slideRef: string): { slideId?: string; title?: string } {
  const trimmed = slideRef.trim();
  return trimmed.startsWith("slide-") ? { slideId: trimmed } : { title: trimmed };
}
