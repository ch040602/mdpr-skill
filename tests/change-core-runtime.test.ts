import assert from "node:assert/strict";
import test from "node:test";
import {
  approvalGate,
  assertApprovedForRuntime,
  createChangeRequest,
  transitionChangeRequest,
} from "../packages/change-core/src/index";

const sourceSha256 = "d".repeat(64);

test("change requests require reviewed approval before runtime application", () => {
  const proposed = createChangeRequest({
    id: "chg-1",
    createdBy: "mdpr-skill",
    sourceSha256,
    changes: [{ kind: "agent-hint", path: ".mdpresent/proposals/deck.hints.json" }],
  });

  assert.equal(proposed.stage, "proposed");
  assert.throws(() => transitionChangeRequest(proposed, "applied"), /Invalid change request transition/);
  const reviewed = transitionChangeRequest(proposed, "reviewed");
  assert.equal(reviewed.stage, "reviewed");
  const approved = transitionChangeRequest(reviewed, "approved", {
    approvedBy: "user",
    approvedAt: "2026-06-24T00:00:00Z",
  });
  assert.equal(approved.stage, "approved");
  assert.equal(approvalGate(approved).status, "pass");
  assert.doesNotThrow(() => assertApprovedForRuntime(approved));
  const applied = transitionChangeRequest(approved, "applied");
  assert.equal(applied.stage, "applied");
});

test("pack and override candidates fail approval gate until explicitly approved", () => {
  const request = createChangeRequest({
    id: "chg-pack",
    createdBy: "mdpr-ppt",
    sourceSha256,
    selectionRef: ".mdpresent/ppt/selection.json",
    changes: [
      { kind: "pack-candidate", path: ".mdpresent/proposals/style-pack.json" },
      { kind: "user-override-candidate", path: ".mdpresent/proposals/override.json" },
    ],
  });

  const gate = approvalGate(request);
  assert.equal(gate.status, "fail");
  assert.match(gate.findings.join("\n"), /requires approved stage/);
  assert.throws(() => assertApprovedForRuntime(request), /not approved for runtime/);
});
