import assert from "node:assert/strict";
import test from "node:test";
import {
  approvalGate,
  createChangeRequest,
  transitionChangeRequest,
} from "../packages/cli/src/commands/change";

test("CLI change command boundary exposes approval lifecycle helpers", () => {
  const request = createChangeRequest({
    id: "chg-cli",
    createdBy: "mdpr-skill",
    sourceSha256: "e".repeat(64),
    changes: [{ kind: "mdpr-policy-suggestion", target: "coherence.keepTogether.caption" }],
  });
  const reviewed = transitionChangeRequest(request, "reviewed");
  const approved = transitionChangeRequest(reviewed, "approved", {
    approvedBy: "user",
    approvedAt: "2026-06-24T00:00:00Z",
  });

  assert.equal(approvalGate(approved).status, "pass");
});
