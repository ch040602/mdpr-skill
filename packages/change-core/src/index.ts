export type ChangeStage = "proposed" | "reviewed" | "approved" | "applied" | "rejected";

export type ChangeKind =
  | "agent-hint"
  | "edit-intent"
  | "mdpr-policy-suggestion"
  | "user-override-candidate"
  | "pack-candidate";

export type ChangeRequest = {
  schemaVersion: "mdpr-change-request-v1";
  id: string;
  stage: ChangeStage;
  createdBy: "mdpr-skill" | "mdpr-ppt" | "user";
  source: {
    sourceSha256: string;
    selectionRef?: string;
  };
  changes: Array<{ kind: ChangeKind; [key: string]: unknown }>;
  requiresApproval: boolean;
  approval: null | {
    approvedBy: string;
    approvedAt: string;
  };
};

export type ApprovalGateResult = {
  status: "pass" | "fail";
  findings: string[];
};

export type CreateChangeRequestInput = {
  id: string;
  createdBy: ChangeRequest["createdBy"];
  sourceSha256: string;
  selectionRef?: string;
  changes: ChangeRequest["changes"];
  requiresApproval?: boolean;
};

export type ApprovalInput = {
  approvedBy?: string;
  approvedAt?: string;
};

const allowedTransitions: Record<ChangeStage, ChangeStage[]> = {
  proposed: ["reviewed", "rejected"],
  reviewed: ["approved", "rejected"],
  approved: ["applied", "rejected"],
  applied: [],
  rejected: [],
};

export function createChangeRequest(input: CreateChangeRequestInput): ChangeRequest {
  validateSourceSha256(input.sourceSha256);
  if (!input.changes.length) {
    throw new Error("changes must contain at least one entry");
  }
  return {
    schemaVersion: "mdpr-change-request-v1",
    id: input.id,
    stage: "proposed",
    createdBy: input.createdBy,
    source: {
      sourceSha256: input.sourceSha256,
      ...(input.selectionRef ? { selectionRef: input.selectionRef } : {}),
    },
    changes: input.changes,
    requiresApproval: input.requiresApproval ?? true,
    approval: null,
  };
}

export function transitionChangeRequest(
  request: ChangeRequest,
  nextStage: ChangeStage,
  approval: ApprovalInput = {},
): ChangeRequest {
  if (!allowedTransitions[request.stage].includes(nextStage)) {
    throw new Error(`Invalid change request transition: ${request.stage} -> ${nextStage}`);
  }
  if (nextStage === "approved") {
    if (!approval.approvedBy || !approval.approvedAt) {
      throw new Error("Approval requires approvedBy and approvedAt");
    }
    validateApprovalTimestamp(approval.approvedAt);
    return {
      ...request,
      stage: nextStage,
      approval: {
        approvedBy: approval.approvedBy,
        approvedAt: approval.approvedAt,
      },
    };
  }
  return {
    ...request,
    stage: nextStage,
  };
}

export function approvalGate(request: ChangeRequest): ApprovalGateResult {
  const findings: string[] = [];
  const hasRuntimeCandidate = request.changes.some((change) =>
    change.kind === "pack-candidate" || change.kind === "user-override-candidate"
  );
  if (request.requiresApproval && !["approved", "applied"].includes(request.stage)) {
    findings.push("change request requires approved stage before runtime use");
  }
  if (hasRuntimeCandidate && !request.approval) {
    findings.push("pack and override candidates require explicit user approval");
  }
  if (["approved", "applied"].includes(request.stage) && !request.approval) {
    findings.push("approved or applied change request is missing approval metadata");
  }
  return {
    status: findings.length === 0 ? "pass" : "fail",
    findings,
  };
}

export function assertApprovedForRuntime(request: ChangeRequest): void {
  const gate = approvalGate(request);
  if (gate.status === "fail") {
    throw new Error(`Change request ${request.id} is not approved for runtime: ${gate.findings.join("; ")}`);
  }
}

function validateSourceSha256(value: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error("sourceSha256 must be a 64-character lowercase hex string");
  }
}

function validateApprovalTimestamp(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    throw new Error("approvedAt must start with an ISO timestamp date");
  }
}
