export type ReviewFinding = {
  severity: "info" | "warning" | "error";
  type: string;
  slideId?: string;
  evidence?: Record<string, unknown>;
  suggestion?: {
    kind: "mdpr-policy" | "mdpr-rulebook" | "mdpr-config";
    target: string;
    operation: "increaseWeight" | "decreaseWeight" | "enableRule" | "disableRule" | "document";
    value?: string | number | boolean;
  };
};

export type ReviewReport = {
  version: "1.0";
  source: "mdpr-manifest";
  findings: ReviewFinding[];
};

export function buildReviewReport(findings: ReviewFinding[]): ReviewReport {
  return { version: "1.0", source: "mdpr-manifest", findings };
}

export function reviewFindingHasFinalDecisionField(finding: ReviewFinding): boolean {
  return JSON.stringify(finding).match(/\b(x|y|w|h|color|fontSize|zOrder|recipeId|variantId|iconPath)\b/) !== null;
}
