export type AgentDocTopic =
  | "bootstrap"
  | "boundaries"
  | "commands"
  | "template-fill"
  | "media"
  | "review"
  | "design-import"
  | "astryx-comparison";

export type AgentDocTopicSummary = {
  topic: AgentDocTopic;
  title: string;
  description: string;
};

type AgentDocTopicSpec = AgentDocTopicSummary & {
  dense: string[];
  full: string[];
};

const topics: AgentDocTopicSpec[] = [
  {
    topic: "bootstrap",
    title: "Agent Bootstrap",
    description: "First commands and reading order for an agent using mdpr-skill.",
    dense: [
      "Run `mdpr-skill docs --list` before choosing a workflow.",
      "Use `mdpr-skill docs commands --dense` for the shortest command map.",
      "Use `mdpr-skill docs boundaries --dense` before emitting hints or reviews.",
      "Prefer markdown-bound commands so summaries can report `sourceVerified: true`.",
      "Keep MDPR runnable with all agent hints disabled.",
    ],
    full: [
      "Start with local CLI docs because they reflect the checkout currently being edited.",
      "Then choose the narrow workflow: hint, review, narrative, rendered-preview, design import, eval, or codex-ppt bridge.",
      "For PowerPoint/template work, run the template-fill and media topics before proposing images, icons, or style changes.",
      "If MDPR runtime compatibility is part of the task, run schema sync against the target MDPR checkout.",
      "Treat this command as orientation only; it never authorizes final coordinates, theme colors, assets, or renderer object choices.",
    ],
  },
  {
    topic: "boundaries",
    title: "Runtime Boundary",
    description: "What mdpr-skill may say and what MDPR must decide.",
    dense: [
      "mdpr-skill emits semantic hints, review notes, evidence ledgers, and approval-bound proposals.",
      "MDPR owns parsing, splitting, layout, coordinates, typography, colors, z-order, theme binding, assets, and PPTX objects.",
      "Forbidden fields include x/y/w/h, coordinates, raw colors, font choices, exact icons, image paths, crops, layout/master IDs, and renderer objects.",
      "Hints must stay optional and schema-valid.",
      "Review findings need source, manifest, rendered preview, or MDPR validation evidence.",
    ],
    full: [
      "A valid mdpr-skill artifact explains source meaning, risk, provenance, or approval intent.",
      "It must not encode final renderer decisions even when a user asks for visual polish.",
      "Use change requests or theme candidates when the user wants a controllable proposal rail.",
      "Use MDPR diagnostics, manifest summaries, or rendered image paths as release evidence.",
      "When uncertain, downgrade to a review note or TODO rather than inventing final rendering fields.",
    ],
  },
  {
    topic: "commands",
    title: "Command Map",
    description: "High-signal CLI commands grouped by workflow.",
    dense: [
      "`mdpr-skill hint --selection-context context.json --markdown deck.md --out agent-hint.json`",
      "`mdpr-skill review --manifest mdpresent-manifest.json --out review-report.json`",
      "`mdpr-skill rendered-preview --images rendered-images.json --out rendered-preview-review.json`",
      "`mdpr-skill design import DESIGN.md --out theme-candidate.json`",
      "`mdpr-skill eval deck.md --out eval --mdpr-path <MdPr> --hints agent-hint.json`",
      "`mdpr-skill gate validate-schema-sync --mdpr-path <MdPr>`",
    ],
    full: [
      "Use `hint` for weak semantic metadata, especially from MDPR preview or PPT selection context.",
      "Use `review`, `rendered-preview`, `narrative`, `speaker-notes`, `citations`, `accessibility`, and `evidence-ledger` for evidence-bound review artifacts.",
      "Use `design import` for approval-bound theme candidates, not direct renderer instructions.",
      "Use `codex-ppt slide-tasks` and `codex-ppt job-state` for long-running per-slide work around deterministic MDPR builds.",
      "Use `change approve|reject` to keep proposed changes outside MDPR runtime until explicit user approval.",
    ],
  },
  {
    topic: "template-fill",
    title: "Template Fill",
    description: "Existing PPTX/POTX/theme workflows that should preserve the supplied frame.",
    dense: [
      "Default to template-fill when the user supplies or references an existing PPT theme.",
      "Preserve masters, layouts, theme colors, and placeholders as MDPR-owned runtime evidence.",
      "Do not add new cards, decorative systems, icons, images, or style transformations unless explicitly requested.",
      "Use `--preserve-master-slides true`, `--image-policy no-image`, and `--icon-policy no-new-icons` when the user asks to keep the existing template.",
    ],
    full: [
      "Template-fill means the existing PPTX/POTX/theme is the visual frame.",
      "mdpr-skill may identify semantic layout intent or preservation gaps, but it must not copy exact placeholder coordinates or layout IDs into hints.",
      "If a visual transformation is requested, require explicit user/request evidence before using `style-transform`.",
      "Source-neutral DESIGN.md imports can describe tone, density, and usage without literal colors or fonts.",
    ],
  },
  {
    topic: "media",
    title: "Media And Icons",
    description: "Image search, generated assets, and semantic icon guidance.",
    dense: [
      "Default image search to disabled.",
      "Generated-image candidates require explicit request evidence and generated-asset workflow intent.",
      "Source images stay source-bound; mdpr-skill does not choose final placement or crop.",
      "Icon candidates are semantic keywords only and require policy permission.",
      "No exact icon names, icon paths, image paths, crops, captions, or renderer object IDs in hints.",
    ],
    full: [
      "Use source-provided visuals when the Markdown or manifest already names them.",
      "Use explicit-request-only generated asset guidance when the user asks for image generation or search.",
      "In template-fill mode, prefer no-new-icons unless the user explicitly permits icon changes.",
      "Rendered-preview review may cite PNG/contact-sheet paths and MDPR finding IDs, but not final repairs.",
    ],
  },
  {
    topic: "review",
    title: "Review Artifacts",
    description: "Evidence-bound review notes and validation loops.",
    dense: [
      "Lead with MDPR validation and manifest evidence.",
      "Use rendered-preview notes for visual concern triage only.",
      "Use narrative/speaker/citation/accessibility helpers for content-level improvement.",
      "Run `validateRenderedPreviewCritiqueBoundary` or review artifact validation when artifacts may contain runtime fields.",
      "Turn repeated issues into deterministic MDPR rule/config TODOs.",
    ],
    full: [
      "Review artifacts are not release gates by themselves.",
      "They explain, triage, and propose changes that MDPR validation or user approval can later accept.",
      "For complex loops, record source refs, command evidence, and accepted/deferred TODOs.",
      "Do not treat LLM review as an override for MDPR polish, overflow, coherence, or editability checks.",
    ],
  },
  {
    topic: "design-import",
    title: "Design Import",
    description: "Approval-bound DESIGN.md and HTML design analysis rail.",
    dense: [
      "`design import` writes `mdpr-theme-candidate-v1`.",
      "Theme candidates require approval before MDPR import.",
      "`sourceNeutral: true` rejects literal colors, exact fonts, coordinates, copied master/layout IDs, exact icons, image paths, and crops.",
      "HTML analysis maps CSS effects to PPT feasibility without becoming a renderer.",
    ],
    full: [
      "Ordinary DESIGN.md imports may carry token proposals, style system hints, visual language, image policy, and registration targets.",
      "Source-neutral imports are stricter and should preserve an existing template or theme while describing semantic tone and density.",
      "MDPR owns final profile IDs, theme binding, design-lock updates, and PPTX validation.",
      "Use rulebook/profile docs when converting repeated design evidence into deterministic runtime behavior.",
    ],
  },
  {
    topic: "astryx-comparison",
    title: "Astryx Comparison",
    description: "What mdpr-skill borrows from Astryx without copying UI-system internals.",
    dense: [
      "Borrow: local branch CLI docs, dense agent bootstrap, documented conventions, token/theme ownership, measured improvement mindset.",
      "Do not borrow: React component APIs, StyleX internals, swizzle source ejection, or frontend-specific layout rules as PPT renderer decisions.",
      "MDPR equivalent of Astryx theme custom properties is approval-bound theme/profile evidence plus MDPR-owned theme binding.",
      "MDPR equivalent of Astryx vibe tests is eval-core plus rendered preview and manifest-based regression gates.",
    ],
    full: [
      "Astryx treats CLI, docs, and conventions as one system for people and AI agents. mdpr-skill should do the same for presentation workflows.",
      "Astryx's swizzle idea maps only to ownership transfer: mdpr-skill can propose artifacts the user approves, but MDPR still owns runtime output.",
      "Astryx's measurement principle maps to eval-core, schema sync, rendered-preview evidence, and no-agent MDPR builds.",
      "Use this comparison as process discipline, not as a license to convert web UI component choices into PowerPoint geometry.",
    ],
  },
];

export function listAgentDocTopics(): AgentDocTopicSummary[] {
  return topics.map(({ topic, title, description }) => ({ topic, title, description }));
}

export function renderAgentDocs(topic: AgentDocTopic, options: { dense?: boolean } = {}): string {
  const spec = topics.find((candidate) => candidate.topic === topic);
  if (!spec) {
    throw new Error(`Unknown docs topic: ${topic}`);
  }
  const lines = options.dense ? spec.dense : [...spec.dense, "", ...spec.full];
  return [`# ${spec.title}`, "", ...lines.map((line) => line ? `- ${line}` : "")].join("\n");
}

export function renderAgentDocList(): string {
  return [
    "# mdpr-skill docs",
    "",
    ...listAgentDocTopics().map((topic) => `- ${topic.topic}: ${topic.description}`),
  ].join("\n");
}
