import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAgentHintManifest,
  hintFromSelectionContext,
} from "../packages/hints-core/src/index";

const sourceSha256 = "b".repeat(64);

test("hintFromSelectionContext converts selected blocks into semantic grouping only", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-4",
    overlappedBlocks: ["table-1", "caption-1"],
    overlappedRegions: ["main"],
    screenshotPath: ".mdpresent/review/slide-4.png",
    selectionPath: ".mdpresent/review/selection-4.json",
    userInstruction: "The table and explanation look detached.",
    x: 10,
    y: 20,
  } as never);

  assert.deepEqual(hint.groupCandidates, [
    { elementIds: ["table-1", "caption-1"], role: "evidence-pack", confidence: 0.78 },
  ]);
  assert.equal(hint.slideId, "slide-4");
  assert.equal(JSON.stringify(hint).includes('"x"'), false);
  assert.equal(JSON.stringify(hint).includes('"screenshotPath"'), false);

  assert.doesNotThrow(() => buildAgentHintManifest(sourceSha256, [hint], {
    generatedAt: "2026-06-24T00:00:00Z",
  }));
});

test("hintFromSelectionContext suggests image generation when icon intent is large or ambiguous", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-hero",
    overlappedBlocks: ["headline-1"],
    userInstruction: "The icon would need to be too large and the metaphor is ambiguous; generate an image instead.",
  });

  assert.deepEqual(hint.visualAssetCandidates, [
    {
      kind: "generated-image",
      trigger: "large-or-ambiguous-icon",
      semanticPrompt: "large metaphor ambiguous generate image",
      confidence: 0.72,
    },
  ]);
  assert.equal(hint.iconKeywordCandidates, undefined);
  assert.equal(JSON.stringify(hint).includes("iconName"), false);
  assert.equal(JSON.stringify(hint).includes("iconPath"), false);

  assert.doesNotThrow(() => buildAgentHintManifest(sourceSha256, [hint], {
    generatedAt: "2026-06-24T00:00:00Z",
  }));
});

test("hintFromSelectionContext supports Korean large or ambiguous icon instructions", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-ko",
    userInstruction: "아이콘이 너무 크거나 의미가 애매하다면 이미지 생성으로 처리해줘.",
  });

  assert.equal(hint.visualAssetCandidates?.[0]?.kind, "generated-image");
  assert.equal(hint.visualAssetCandidates?.[0]?.trigger, "large-or-ambiguous-icon");
  assert.match(hint.visualAssetCandidates?.[0]?.semanticPrompt ?? "", /이미지/);
});

test("hintFromSelectionContext does not treat generic image generation as an icon fallback", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-image",
    userInstruction: "Generate an image for the source photo section.",
  });

  assert.equal(hint.visualAssetCandidates, undefined);
});

test("hintFromSelectionContext keeps generated-image semantic prompts within schema limits", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-long",
    userInstruction: [
      "icon",
      "large",
      "hypercontextualizationhypercontextualization",
      "interoperabilityinteroperability",
      "observabilityobservability",
      "governancegovernance",
      "traceabilitytraceability",
      "explainabilityexplainability",
      "trustworthinessworthiness",
      "generated image",
    ].join(" "),
  });

  assert.equal((hint.visualAssetCandidates?.[0]?.semanticPrompt.length ?? 0) <= 160, true);
});
