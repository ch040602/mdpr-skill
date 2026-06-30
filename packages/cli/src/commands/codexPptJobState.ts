export type MdprJobTaskStatus = "pending" | "dispatched" | "recorded" | "blocked" | "accepted";

export type MdprJobStateTask = {
  slideNumber: number;
  slideId: string;
  packetPath?: string;
  status: MdprJobTaskStatus;
  workerId?: string;
  evidencePath?: string;
  blockerReason?: string;
  updatedAt: string;
};

export type MdprJobStateEvent = {
  slideId: string;
  from?: MdprJobTaskStatus;
  to: MdprJobTaskStatus;
  workerId?: string;
  evidencePath?: string;
  blockerReason?: string;
  recordedAt: string;
};

export type MdprJobState = {
  schemaVersion: "mdpr-job-state-v1";
  generatedBy: "mdpr-skill";
  source: {
    taskPacketSetPath?: string;
    manifestPath?: string;
  };
  completionEvidencePolicy: "artifact-path-or-report-id-required";
  tasks: MdprJobStateTask[];
  events: MdprJobStateEvent[];
  boundary: {
    mdprOwnsFinalLayout: true;
    mdprOwnsFinalThemeBinding: true;
    noRendererInternals: true;
    noChatMessageCompletion: true;
  };
};

export type MdprJobStateSummary = {
  schemaVersion: "mdpr-job-state-summary-v1";
  total: number;
  byStatus: Record<MdprJobTaskStatus, number>;
  complete: boolean;
  blocked: number;
  completionEvidencePolicy: MdprJobState["completionEvidencePolicy"];
};

export type MdprJobStateValidation = {
  schemaVersion: "mdpr-job-state-validation-v1";
  valid: boolean;
  findings: string[];
};

const allowedStatuses: MdprJobTaskStatus[] = ["pending", "dispatched", "recorded", "blocked", "accepted"];

const boundary = {
  mdprOwnsFinalLayout: true,
  mdprOwnsFinalThemeBinding: true,
  noRendererInternals: true,
  noChatMessageCompletion: true,
} as const;

export function createMdprJobState(input: {
  taskPacketSet: Record<string, unknown>;
  taskPacketSetPath?: string;
  manifestPath?: string;
  now?: string;
}): MdprJobState {
  const now = input.now ?? new Date().toISOString();
  const packets = Array.isArray(input.taskPacketSet.packets) ? input.taskPacketSet.packets : [];
  const tasks = packets.map((packet, index): MdprJobStateTask => {
    const record = packet && typeof packet === "object" ? packet as Record<string, unknown> : {};
    const slideNumber = typeof record.slideNumber === "number" && Number.isFinite(record.slideNumber)
      ? Math.max(1, Math.floor(record.slideNumber))
      : index + 1;
    const slideId = typeof record.slideId === "string" && record.slideId.trim()
      ? record.slideId
      : `slide-${String(slideNumber).padStart(2, "0")}`;
    return {
      slideNumber,
      slideId,
      packetPath: typeof record.path === "string" ? record.path : undefined,
      status: "pending",
      updatedAt: now,
    };
  });

  return {
    schemaVersion: "mdpr-job-state-v1",
    generatedBy: "mdpr-skill",
    source: {
      taskPacketSetPath: input.taskPacketSetPath,
      manifestPath: input.manifestPath,
    },
    completionEvidencePolicy: "artifact-path-or-report-id-required",
    tasks,
    events: [],
    boundary,
  };
}

export function updateMdprJobState(input: {
  state: MdprJobState;
  slideId: string;
  status: string;
  workerId?: string;
  evidencePath?: string;
  blockerReason?: string;
  now?: string;
}): MdprJobState {
  const status = parseStatus(input.status);
  assertStatusEvidence(status, input.evidencePath, input.blockerReason);
  const next = structuredClone(input.state) as MdprJobState;
  const task = next.tasks.find((item) => matchesSlideRef(item, input.slideId));
  if (!task) throw new Error(`Unknown job-state slide: ${input.slideId}`);
  const previous = task.status;
  const now = input.now ?? new Date().toISOString();
  task.status = status;
  task.updatedAt = now;
  if (input.workerId) task.workerId = input.workerId;
  if (input.evidencePath) task.evidencePath = input.evidencePath;
  if (input.blockerReason) task.blockerReason = input.blockerReason;
  next.events.push({
    slideId: task.slideId,
    from: previous,
    to: status,
    workerId: input.workerId,
    evidencePath: input.evidencePath,
    blockerReason: input.blockerReason,
    recordedAt: now,
  });
  return next;
}

function matchesSlideRef(task: MdprJobStateTask, slideRef: string): boolean {
  return task.slideId === slideRef
    || String(task.slideNumber) === slideRef
    || `slide-${String(task.slideNumber).padStart(2, "0")}` === slideRef
    || `slide_${String(task.slideNumber).padStart(2, "0")}` === slideRef;
}

export function summarizeMdprJobState(state: MdprJobState): MdprJobStateSummary {
  const byStatus: Record<MdprJobTaskStatus, number> = {
    pending: 0,
    dispatched: 0,
    recorded: 0,
    blocked: 0,
    accepted: 0,
  };
  for (const task of state.tasks) byStatus[parseStatus(task.status)] += 1;
  return {
    schemaVersion: "mdpr-job-state-summary-v1",
    total: state.tasks.length,
    byStatus,
    complete: state.tasks.length > 0 && state.tasks.every((task) => task.status === "accepted"),
    blocked: byStatus.blocked,
    completionEvidencePolicy: state.completionEvidencePolicy,
  };
}

export function validateMdprJobState(state: MdprJobState): MdprJobStateValidation {
  const findings: string[] = [];
  if (state.schemaVersion !== "mdpr-job-state-v1") findings.push("schemaVersion must be mdpr-job-state-v1");
  if (state.completionEvidencePolicy !== "artifact-path-or-report-id-required") {
    findings.push("completionEvidencePolicy must require artifact path or report id evidence");
  }
  if (state.boundary?.noChatMessageCompletion !== true) findings.push("boundary.noChatMessageCompletion must be true");
  if (!Array.isArray(state.tasks) || state.tasks.length === 0) findings.push("tasks must contain at least one slide task");
  const seen = new Set<string>();
  for (const task of Array.isArray(state.tasks) ? state.tasks : []) {
    if (!task.slideId) findings.push("task.slideId is required");
    if (seen.has(task.slideId)) findings.push(`duplicate task slideId: ${task.slideId}`);
    seen.add(task.slideId);
    if (!allowedStatuses.includes(task.status)) findings.push(`invalid task status for ${task.slideId}: ${task.status}`);
    if ((task.status === "recorded" || task.status === "accepted") && !task.evidencePath) {
      findings.push(`${task.slideId} ${task.status} status requires evidencePath`);
    }
    if (task.status === "blocked" && !task.blockerReason) findings.push(`${task.slideId} blocked status requires blockerReason`);
  }
  return {
    schemaVersion: "mdpr-job-state-validation-v1",
    valid: findings.length === 0,
    findings,
  };
}

function parseStatus(value: string): MdprJobTaskStatus {
  if (allowedStatuses.includes(value as MdprJobTaskStatus)) return value as MdprJobTaskStatus;
  throw new Error(`Invalid job-state status: ${value}. Allowed statuses: ${allowedStatuses.join(", ")}`);
}

function assertStatusEvidence(status: MdprJobTaskStatus, evidencePath: string | undefined, blockerReason: string | undefined): void {
  if ((status === "recorded" || status === "accepted") && !evidencePath) {
    throw new Error(`job-state ${status} update requires --evidence`);
  }
  if (status === "blocked" && !blockerReason) {
    throw new Error("job-state blocked update requires --blocker-reason");
  }
}
