import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildEditIntent,
  editIntentToChangeRequest,
} from "../packages/edit-core/src/index";

const sourceSha256 = "f".repeat(64);

test("edit intent captures page and decoration preferences without final design fields", () => {
  const intent = buildEditIntent({
    id: "edit-1",
    sourceSha256,
    instruction: "Make slide 3 feel more data focused and switch the list to a numbered rail.",
    target: { slideRef: "slide-3", blockHints: ["table", "list"] },
    preferences: {
      emphasis: "increase",
      layoutFamily: "chart-table",
      decorationFamily: "numbered-rail",
      preserveContent: true,
    },
  });

  assert.equal(intent.schemaVersion, "mdpr-edit-intent-v1");
  assert.equal(intent.target.slideRef, "slide-3");
  assert.equal(intent.preferences?.decorationFamily, "numbered-rail");

  const request = editIntentToChangeRequest({
    id: "chg-edit-1",
    sourceSha256,
    intent,
  });
  assert.equal(request.stage, "proposed");
  assert.equal(request.changes[0].kind, "edit-intent");
  assert.equal(request.requiresApproval, true);
});

test("edit intent rejects coordinates, raw colors, and exact recipe choices", () => {
  assert.throws(() => buildEditIntent({
    id: "edit-bad",
    sourceSha256,
    instruction: "Move this to x 10 and use this color.",
    target: { slideRef: "slide-2" },
    preferences: {
      emphasis: "increase",
      x: 10,
      color: "#ffffff",
      recipeId: "exact-card-recipe",
    } as never,
  }), /forbidden final-decision field/);
});

test("edit intent schema declares the deterministic boundary contract", () => {
  const schema = JSON.parse(readFileSync("schemas/mdpr-edit-intent.schema.json", "utf-8"));
  assert.equal(schema.properties.schemaVersion.const, "mdpr-edit-intent-v1");
  assert.equal(schema.properties.boundary.properties.finalDesignDecision.const, "forbidden");
  assert.equal(schema.properties.boundary.properties.mdprOwnsRendering.const, true);
});
