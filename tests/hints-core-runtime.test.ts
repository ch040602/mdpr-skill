import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAgentHintManifest,
  hintFromSelectionContext,
  validateAgentHintPreflight,
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

test("hintFromSelectionContext suggests generated assets only for explicit image requests", () => {
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
      trigger: "explicit-generated-asset-request",
      requestRef: "instruction:generated-asset-request",
      semanticPrompt: "large metaphor ambiguous generate image",
      confidence: 0.72,
    },
  ]);
  assert.deepEqual(hint.iconKeywordCandidates, ["large", "metaphor", "ambiguous", "generate"]);
  assert.equal(JSON.stringify(hint).includes("iconName"), false);
  assert.equal(JSON.stringify(hint).includes("iconPath"), false);

  assert.doesNotThrow(() => buildAgentHintManifest(sourceSha256, [hint], {
    generatedAt: "2026-06-24T00:00:00Z",
  }));
});

test("hintFromSelectionContext supports Korean explicit generated image instructions", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-ko",
    userInstruction: "아이콘이 너무 크거나 의미가 애매하다면 이미지 생성으로 처리해줘.",
  });

  assert.equal(hint.visualAssetCandidates?.[0]?.kind, "generated-image");
  assert.equal(hint.visualAssetCandidates?.[0]?.trigger, "explicit-generated-asset-request");
  assert.match(hint.visualAssetCandidates?.[0]?.semanticPrompt ?? "", /이미지/);
});

test("hintFromSelectionContext does not generate images for large icon ambiguity without explicit generation", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-image",
    userInstruction: "The icon is too large and the metaphor is ambiguous.",
  });

  assert.equal(hint.visualAssetCandidates, undefined);
  assert.equal(hint.mediaPolicyCandidate?.imageUse, "no-image");
  assert.equal(hint.mediaPolicyCandidate?.imageSearch, "disabled");
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

test("hintFromSelectionContext emits template-fill policies without new icons or images", () => {
  const hint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-template",
    overlappedBlocks: ["claim-1", "proof-1", "detail-1"],
    userInstruction: "핵심 메시지를 강조하고 가독성 있게 줄임. 내용이 많으면 분리해줘. 아이콘은 추가하지 마.",
  }, {
    workflowIntent: "template-fill",
    templateSourceRef: "hcs-template",
    preserveMasterSlides: true,
    imagePolicy: "no-image",
    imageSearchPolicy: "disabled",
    iconPolicy: "no-new-icons",
  });

  assert.equal(hint.workflowIntentCandidate?.intent, "template-fill");
  assert.equal(hint.templateUseCandidate?.masterSlidePolicy, "preserve-existing-master-slides");
  assert.equal(hint.mediaPolicyCandidate?.imageUse, "no-image");
  assert.equal(hint.mediaPolicyCandidate?.imageSearch, "disabled");
  assert.equal(hint.mediaPolicyCandidate?.iconUse, "no-new-icons");
  assert.equal(hint.iconKeywordCandidates, undefined);
  assert.equal(hint.visualAssetCandidates, undefined);
  assert.equal(hint.keyMessageCandidates?.[0]?.messageRole, "main-takeaway");
  assert.deepEqual(hint.keyMessageCandidates?.[0]?.evidenceRefs, ["element:claim-1", "element:proof-1", "element:detail-1"]);
  assert.equal(hint.contentSplitCandidates?.[0]?.preferredSplitBy, "list-chunk");
  assert.equal(hint.readabilityCandidates?.[0]?.action, "shorten-copy");
  assert.equal(JSON.stringify(hint).includes('"fontSize"'), false);
  assert.equal(JSON.stringify(hint).includes('"coordinates"'), false);
});

test("validateAgentHintPreflight flags overbroad and contradictory template-fill hints", () => {
  const manifest = buildAgentHintManifest(sourceSha256, [{
    slideId: "slide-preflight",
    confidence: 0.78,
    workflowIntentCandidate: { intent: "template-fill", confidence: 0.86, evidenceRefs: ["template:hcs"] },
    keyMessageCandidates: [
      { messageRole: "main-takeaway", emphasisLevel: "primary", elementIds: ["b1"], reason: "Primary claim.", confidence: 0.8 },
      { messageRole: "decision-needed", emphasisLevel: "primary", elementIds: ["b2"], reason: "Also primary.", confidence: 0.8 },
    ],
    readabilityCandidates: [
      { action: "shorten-copy", elementIds: ["b1", "b2", "b3", "b4"], reason: "Restates all content.", confidence: 0.7 },
    ],
    iconKeywordCandidates: ["spark"],
    visualAssetCandidates: [
      { kind: "generated-image", trigger: "explicit-generated-asset-request", requestRef: "request:1", semanticPrompt: "spark visual", confidence: 0.7 },
    ],
  }], { generatedAt: "2026-06-24T00:00:00Z" });

  const findings = validateAgentHintPreflight(manifest, {
    sourceElementIdsBySlide: { "slide-preflight": ["b1", "b2", "b3", "b4"] },
  });
  const types = findings.map((finding) => finding.type);

  assert.equal(types.includes("MULTIPLE_PRIMARY_KEY_MESSAGES"), true);
  assert.equal(types.includes("KEY_MESSAGE_EVIDENCE_MISSING"), true);
  assert.equal(types.includes("HINT_RESTATES_SOURCE_ELEMENTS"), true);
  assert.equal(types.includes("TEMPLATE_FILL_HINT_POLICY_CONFLICT"), true);
  assert.equal(findings.every((finding) => finding.slideId === "slide-preflight"), true);
  assert.equal(JSON.stringify(findings).includes('"coordinates"'), false);
  assert.equal(JSON.stringify(findings).includes('"fontSize"'), false);
});

test("validateAgentHintPreflight gates style-transform on explicit evidence", () => {
  const unsafe = validateAgentHintPreflight([{
    slideId: "slide-style",
    confidence: 0.72,
    workflowIntentCandidate: { intent: "style-transform", confidence: 0.72, evidenceRefs: [] },
  }]);
  const safeHint = hintFromSelectionContext({
    schemaVersion: "mdpr-selection-context-v1",
    source: { kind: "mdpr-preview", sourceSha256 },
    slideId: "slide-style",
    userInstruction: "Use a new visual system and redesign the style.",
    workflowIntent: "style-transform",
  });
  const safe = validateAgentHintPreflight([safeHint]);

  assert.equal(unsafe.some((finding) => finding.type === "STYLE_TRANSFORM_EVIDENCE_MISSING"), true);
  assert.deepEqual(safeHint.workflowIntentCandidate?.evidenceRefs, ["instruction:style-transform-request"]);
  assert.equal(safe.some((finding) => finding.type === "STYLE_TRANSFORM_EVIDENCE_MISSING"), false);
  assert.equal(JSON.stringify(unsafe).includes('"coordinates"'), false);
});
