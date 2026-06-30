export type CodexPptCompatFeature = {
  id: string;
  codexPptFeature: string;
  codexPptRefs: string[];
  mdprRail:
    | "mdpr-runtime"
    | "mdpr-skill-proposal"
    | "mdpr-skill-review"
    | "mdpr-skill-orchestration"
    | "mdpr-bridge"
    | "mdpr-generated-asset-rail"
    | "unmapped";
  mdprAlternative: string;
  implementationStatus: "supported" | "proposal-ready" | "mdpr-runtime-required";
  requiredMdprSurfaces: string[];
  acceptanceGate: string;
};

export type CodexPptCompatMap = {
  schemaVersion: "mdpr-codex-ppt-compat-v1";
  generatedBy: "mdpr-skill";
  source: {
    repository: "https://github.com/ningzimu/codex-ppt-skill";
    sourceRef: string;
    reviewedDocs: string[];
  };
  boundary: {
    codexPptOutputModel: "full-slide-image-pptx";
    mdprOutputModel: "editable-native-pptx-html-pdf";
    policy: "map-features-to-mdpr-rails-without-agent-final-rendering";
  };
  workflowStages: Array<{
    gate: string;
    codexPptPhase: string;
    mdprImplementationSurface: string;
  }>;
  features: CodexPptCompatFeature[];
  implementationTodos: CodexPptImplementationTodo[];
  coverage: {
    codexPptFeatureCount: number;
    mappedFeatureCount: number;
    unmappedFeatureCount: number;
    supportedCount: number;
    proposalReadyCount: number;
    mdprRuntimeRequiredCount: number;
  };
};

export type CodexPptImplementationTodo = {
  id: string;
  owner: "mdpr" | "mdpr-skill";
  title: string;
  featureIds: string[];
  dependsOn: string[];
  acceptance: string[];
  validation: string[];
  docs: string[];
};

const reviewedDocs = [
  "skills/codex-ppt/SKILL.md",
  "skills/codex-ppt/docs/workflow-gates-and-progress.md",
  "skills/codex-ppt/docs/outline-style-and-sample.md",
  "skills/codex-ppt/docs/backend-selection.md",
  "skills/codex-ppt/docs/user-supplied-assets.md",
  "skills/codex-ppt/docs/slide-generation-and-subagents.md",
  "skills/codex-ppt/docs/project-assembly-and-reporting.md",
  "skills/codex-ppt/docs/style-library.md",
  "README_en.md",
];

const workflowStages: CodexPptCompatMap["workflowStages"] = [
  {
    gate: "source-intake",
    codexPptPhase: "source reading and asset extraction",
    mdprImplementationSurface: "MDPR parser, asset manifest, source-to-slide evidence ledger",
  },
  {
    gate: "outline-approval",
    codexPptPhase: "outline confirmation",
    mdprImplementationSurface: "Markdown outline draft, slide role hints, split override proposal",
  },
  {
    gate: "style-approval",
    codexPptPhase: "visual style confirmation",
    mdprImplementationSurface: "theme candidate, profile candidate, rulebook proposal",
  },
  {
    gate: "sample-or-preview-approval",
    codexPptPhase: "one sample slide approval",
    mdprImplementationSurface: "MDPR preview build, rendered-preview review, optional generated visual asset proof",
  },
  {
    gate: "job-state-preparation",
    codexPptPhase: "prepare slide jobs and run state",
    mdprImplementationSurface: "MDPR build manifest, mdpr-skill eval report, bridge change request state",
  },
  {
    gate: "parallel-generation-or-render",
    codexPptPhase: "subagent slide generation",
    mdprImplementationSurface: "MDPR deterministic render plus bounded review or repair proposals",
  },
  {
    gate: "qa-repair-notes-assembly",
    codexPptPhase: "QA, repair, speaker notes, PPT assembly",
    mdprImplementationSurface: "MDPR validation, review reports, speaker notes, editable PPTX export",
  },
  {
    gate: "style-library-save",
    codexPptPhase: "save reusable styles",
    mdprImplementationSurface: "approval-bound theme/profile/rulebook registration targets",
  },
];

const features: CodexPptCompatFeature[] = [
  feature("multi-agent-portability", "Works across Codex, Claude Code, OpenClaw, Hermes Agent, and SKILL.md agents.", ["README_en.md#features"], "mdpr-skill-orchestration", "skill instructions plus dependency-light CLI commands", "supported", ["skills/mdpr-skill/SKILL.md", "bin/mdpr-skill.js"], "source-intake"),
  feature("source-intake", "Uses articles, reports, papers, notes, Markdown, PDFs, and Word documents as source material.", ["README_en.md#features", "SKILL.md#Default Workflow"], "mdpr-runtime", "MDPR Markdown/Pandoc pipeline plus companion source review rails", "supported", ["MDPR parser", "mdpr-skill narrative/citation/accessibility reviews"], "source-intake"),
  feature("staged-approval-gates", "Requires outline, style, backend, sample, generation, QA, and assembly gates.", ["workflow-gates-and-progress.md"], "mdpr-skill-orchestration", "proposal stages and MDPR validation gates instead of one-shot generation", "proposal-ready", ["change request stages", "eval-core", "review reports"], "outline-approval"),
  feature("outline-planning", "Drafts slide roles, key points, visual ideas, and required source image mapping.", ["outline-style-and-sample.md#Plan The Deck Outline"], "mdpr-skill-proposal", "Markdown outline cleanup plus slide role and split proposals", "supported", ["narrative review", "edit-intent split candidate", "source evidence ledger"], "outline-approval"),
  feature("unified-style-selection", "Keeps one visual identity while varying layouts by page role.", ["outline-style-and-sample.md#Confirm A Unified Visual Style"], "mdpr-runtime", "profile and rulebook selection with repeated-layout lint", "supported", ["design_components/rule-engine", "coherence lint", "theme candidate"], "style-approval"),
  feature("built-in-style-references", "Ships reusable style references such as clean professional, dashboard, scientific defense, and magazine styles.", ["README_en.md#Style Examples", "references/*.md"], "mdpr-runtime", "theme packs, profiles, recipe catalogs, and style gallery examples", "supported", ["mdpresent pack list", "mdpresent pack validate", "theme gallery", "profile catalog"], "style-approval"),
  feature("custom-style-replication", "Analyzes a favorite image, PDF, PPT, or PPTX style before generating a new deck.", ["README_en.md#Usage Tips", "style-library.md"], "mdpr-skill-proposal", "DESIGN.md/theme candidate extraction from visible rendered references", "proposal-ready", ["design import", "html design analysis", "rendered preview review"], "style-approval"),
  feature("reusable-style-library", "Saves a finished or supplied visual system for later use.", ["style-library.md"], "mdpr-skill-proposal", "approval-bound theme/profile/rulebook/deck-local style pack registration", "proposal-ready", ["mdpr-theme-candidate-v1", "registration.targets"], "style-library-save"),
  feature("backend-selection", "Confirms built-in image backend versus CLI/API fallback before sample generation.", ["backend-selection.md", "cli-api-fallback.md"], "mdpr-generated-asset-rail", "generated visual asset rail for large/ambiguous visuals while MDPR owns final deck render", "proposal-ready", ["visualAssetCandidates", "generated-image candidate", "asset provenance"], "sample-or-preview-approval"),
  feature("image-provider-fallback", "Supports OpenAI-compatible providers, AtlasCloud, base URL, and custom model names.", ["image-model-configuration.md", "README_en.md#features"], "mdpr-generated-asset-rail", "pluggable generated-asset provider metadata outside the core renderer", "supported", ["mdpr-generated-assets-v1", "codex-ppt generated-assets validate", "mdpresent generated-assets validate"], "sample-or-preview-approval"),
  feature("sample-slide-approval", "Generates one sample slide before full production.", ["outline-style-and-sample.md#Generate One Sample Slide For Approval"], "mdpr-skill-review", "MDPR preview build and rendered-preview approval before final export", "proposal-ready", ["rendered-preview review", "eval-core baseline/guided comparison"], "sample-or-preview-approval"),
  feature("project-directory-state", "Creates project folders with outline, prompts, run state, images, speech, and PPTX.", ["project-assembly-and-reporting.md#Project Directory"], "mdpr-runtime", "MDPR output directory with manifest, design lock, review reports, and build artifacts", "supported", ["mdpresent-manifest.json", "mdpresent-design-lock.json", "review-report.json"], "job-state-preparation"),
  feature("required-asset-insertion", "Maps paper figures, charts, screenshots, logos, and diagrams to target slides.", ["user-supplied-assets.md"], "mdpr-runtime", "asset manifest and source-to-slide evidence ledger with strict fidelity notes", "proposal-ready", ["asset manifest", "evidence ledger", "renderer asset slots"], "source-intake"),
  feature("per-slide-job-packets", "Writes self-contained per-slide prompt jobs with local context and input images.", ["slide-generation-and-subagents.md#Final Slide Image Generation"], "mdpr-skill-orchestration", "per-slide review/eval packets derived from MDPR presentation and manifest data", "supported", ["codex-ppt slide-tasks", "mdpr-slide-task-packet-v1", "manifest slice export"], "job-state-preparation"),
  feature("parallel-subagent-generation", "Dispatches one slide job per subagent after sample approval.", ["slide-generation-and-subagents.md#Parallel Slide Generation With Subagents", "prompts/slide-worker.md"], "mdpr-skill-orchestration", "parallel critical review or repair proposal workers around deterministic MDPR builds", "supported", ["codex-ppt slide-tasks", "codex-ppt job-state", "mdpr-job-state-v1"], "parallel-generation-or-render"),
  feature("full-slide-image-generation", "Generates every final page as one full-slide image.", ["SKILL.md#Overview", "README_en.md#Output Example"], "mdpr-runtime", "editable-native-pptx-plus-generated-visual-assets", "supported", ["MDPR editable PPTX renderer", "generated visual asset candidate rail"], "parallel-generation-or-render"),
  feature("single-slide-revision", "Refines one specific slide rather than regenerating the whole deck.", ["README_en.md#Usage Tips", "cli-api-fallback.md#Editing Slides"], "mdpr-bridge", "edit intent, approved override candidate, and MDPR rebuild for the affected slide or section", "supported", ["edit-intent", "user override candidate", "change request"], "qa-repair-notes-assembly"),
  feature("qa-repair-loop", "Checks text, outline match, truncation, style, page numbers, overlaps, and required assets before assembly.", ["project-assembly-and-reporting.md#Quality Check And Repair"], "mdpr-skill-review", "review reports backed by MDPR validation and rendered preview evidence", "supported", ["review", "rendered-preview", "coherence lint", "eval-core"], "qa-repair-notes-assembly"),
  feature("speaker-notes", "Creates speaker notes and writes them into the PPT.", ["project-assembly-and-reporting.md#Speaker Notes", "README_en.md#features"], "mdpr-skill-proposal", "speaker-note review artifact plus MDPR PPTX notes support", "proposal-ready", ["speaker-notes command", "MDPR notes import"], "qa-repair-notes-assembly"),
  feature("pptx-assembly-export", "Assembles final slide pages into a PPTX.", ["project-assembly-and-reporting.md#Assembly"], "mdpr-runtime", "editable PPTX/HTML/PDF export through MDPR, with image-slide mode only as explicit compatibility mode", "supported", ["MDPR PPTX renderer", "HTML/PDF exporters"], "qa-repair-notes-assembly"),
  feature("high-resolution-and-transparency", "Handles higher-resolution image output and transparency workarounds.", ["cli-api-fallback.md#Capabilities And Sizes", "cli-api-fallback.md#Transparent Backgrounds"], "mdpr-generated-asset-rail", "asset-level generation/editing policy for visual elements, not full-deck renderer replacement", "supported", ["mdpr-generated-assets-v1 request policy", "quality/background/transparency validation warnings"], "sample-or-preview-approval"),
];

const implementationTodos: CodexPptImplementationTodo[] = [];

export function buildCodexPptCompatMap(sourceRef = "ningzimu/codex-ppt-skill@unknown"): CodexPptCompatMap {
  const mappedFeatureCount = features.filter((item) => item.mdprRail !== "unmapped").length;
  return {
    schemaVersion: "mdpr-codex-ppt-compat-v1",
    generatedBy: "mdpr-skill",
    source: {
      repository: "https://github.com/ningzimu/codex-ppt-skill",
      sourceRef,
      reviewedDocs,
    },
    boundary: {
      codexPptOutputModel: "full-slide-image-pptx",
      mdprOutputModel: "editable-native-pptx-html-pdf",
      policy: "map-features-to-mdpr-rails-without-agent-final-rendering",
    },
    workflowStages,
    features,
    implementationTodos,
    coverage: {
      codexPptFeatureCount: features.length,
      mappedFeatureCount,
      unmappedFeatureCount: features.length - mappedFeatureCount,
      supportedCount: features.filter((item) => item.implementationStatus === "supported").length,
      proposalReadyCount: features.filter((item) => item.implementationStatus === "proposal-ready").length,
      mdprRuntimeRequiredCount: features.filter((item) => item.implementationStatus === "mdpr-runtime-required").length,
    },
  };
}

function feature(
  id: string,
  codexPptFeature: string,
  codexPptRefs: string[],
  mdprRail: CodexPptCompatFeature["mdprRail"],
  mdprAlternative: string,
  implementationStatus: CodexPptCompatFeature["implementationStatus"],
  requiredMdprSurfaces: string[],
  acceptanceGate: string,
): CodexPptCompatFeature {
  return {
    id,
    codexPptFeature,
    codexPptRefs,
    mdprRail,
    mdprAlternative,
    implementationStatus,
    requiredMdprSurfaces,
    acceptanceGate,
  };
}
