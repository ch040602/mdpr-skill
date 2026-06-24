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
