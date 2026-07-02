import { createHash } from "node:crypto";

export type DesignMdParseResult = {
  frontmatter: Record<string, any>;
  sections: Record<string, string>;
};

export type MdprThemeCandidate = {
  schemaVersion: "mdpr-theme-candidate-v1";
  source: {
    kind: "design-md";
    path: string;
    sourceSha256: string;
    generatedBy: "mdpr-skill";
    generatedAt: string;
  };
  tokens: {
    colors: Record<string, string>;
    typography: Record<string, Record<string, string | number>>;
    spacing: Record<string, number>;
    shape: Record<string, number>;
  };
  styleSystem: {
    bestFor: string[];
    layoutIntents: string[];
    layoutBlueprints: Array<{
      name: string;
      intent: string;
      description: string;
      regions: string[];
    }>;
    decorationFamilies: string[];
  };
  registration: {
    targets: MdprThemeRegistrationTarget[];
    workflow: "proposal-review-approve-mdpr-import";
  };
  constraints: {
    mdprOwnsFinalLayout: true;
    mdprOwnsFinalThemeBinding: true;
    noRawUseInAgentHints: true;
    requiresDesignLockUpdate: true;
  };
  rationale: {
    overview?: string;
    layout?: string;
    dosDonts: string[];
  };
  requiresApproval: true;
};

export type MdprThemeRegistrationTarget =
  | "mdpr-theme-pack"
  | "mdpr-profile"
  | "mdpr-rulebook"
  | "deck-local-style-pack";

export type BuildThemeCandidateInput = {
  path: string;
  content: string;
  generatedAt?: string;
};

export type ThemeCandidateGateResult = {
  status: "pass" | "fail";
  findings: string[];
  metrics: {
    colorTokenCount: number;
    typographyRoleCount: number;
    spacingTokenCount: number;
    shapeTokenCount: number;
    layoutBlueprintCount: number;
    decorationFamilyCount: number;
  };
};

export type PptEffectFeasibility =
  | "native-editable"
  | "native-approximation"
  | "token-approximation"
  | "raster-risk"
  | "unsupported";

export type CssToPptEffectMapping = {
  cssPath: string;
  cssValue: string;
  pptEffect: string;
  feasibility: PptEffectFeasibility;
  editabilityRisk: "low" | "medium" | "high";
  mdprTokenPath?: string;
  approximationNote?: string;
};

export type MdprHtmlDesignAnalysis = {
  schemaVersion: "mdpr-html-design-analysis-v1";
  source: {
    kind: "html" | "url";
    path?: string;
    url?: string;
    capturedAt: string;
  };
  tokens: {
    colors: string[];
    typography: Array<{ property: string; value: string }>;
    spacing: number[];
    radius: number[];
    elevation: string[];
  };
  motifs: Array<{ kind: string; confidence: number; evidence: string }>;
  pptEffectMapping: CssToPptEffectMapping[];
  warnings: string[];
};

export type AnalyzeHtmlDesignInput = {
  html: string;
  source?: {
    kind: "html" | "url";
    path?: string;
    url?: string;
  };
  capturedAt?: string;
};

const FORBIDDEN_DESIGN_IMPORT_FIELDS = new Set([
  "x",
  "y",
  "w",
  "h",
  "box",
  "zOrder",
  "z-order",
  "recipeId",
  "variantId",
  "arrow",
  "coordinates",
  "geometry",
  "rendererObjectId",
  "iconPath",
  "iconName",
]);

export function parseDesignMd(content: string): DesignMdParseResult {
  const { frontmatterText, body } = splitFrontmatter(content);
  const frontmatter = parseSimpleYaml(frontmatterText);
  assertNoDesignImportForbiddenFields(frontmatter);
  return {
    frontmatter,
    sections: parseMarkdownSections(body),
  };
}

export function buildThemeCandidateFromDesignMd(input: BuildThemeCandidateInput): MdprThemeCandidate {
  const parsed = parseDesignMd(input.content);
  const sourceSha256 = createHash("sha256").update(input.content).digest("hex");
  const layoutBlueprints = parseLayoutBlueprints(parsed.sections["Layout Blueprints"] ?? "");
  return {
    schemaVersion: "mdpr-theme-candidate-v1",
    source: {
      kind: "design-md",
      path: input.path,
      sourceSha256,
      generatedBy: "mdpr-skill",
      generatedAt: input.generatedAt ?? new Date().toISOString(),
    },
    tokens: {
      colors: stringRecord(parsed.frontmatter.colors),
      typography: typographyRecord(parsed.frontmatter.typography),
      spacing: numberRecord(parsed.frontmatter.spacing),
      shape: numberRecord(parsed.frontmatter.shape ?? parsed.frontmatter.rounded),
    },
    styleSystem: {
      bestFor: bulletLines(parsed.sections["Best For"] ?? ""),
      layoutIntents: unique(layoutBlueprints.map((blueprint) => blueprint.intent)),
      layoutBlueprints,
      decorationFamilies: decorationFamiliesFromLines(bulletLines(parsed.sections["Decoration Grammar"] ?? "")),
    },
    registration: {
      targets: registrationTargetsFromLines(bulletLines(parsed.sections["Registration Targets"] ?? "")),
      workflow: "proposal-review-approve-mdpr-import",
    },
    constraints: {
      mdprOwnsFinalLayout: true,
      mdprOwnsFinalThemeBinding: true,
      noRawUseInAgentHints: true,
      requiresDesignLockUpdate: true,
    },
    rationale: {
      ...(parsed.sections.Overview ? { overview: parsed.sections.Overview } : {}),
      ...(parsed.sections.Layout ? { layout: parsed.sections.Layout } : {}),
      dosDonts: bulletLines(parsed.sections["Do's and Don'ts"] ?? parsed.sections["Dos and Donts"] ?? ""),
    },
    requiresApproval: true,
  };
}

export function themeCandidateGate(candidate: unknown): ThemeCandidateGateResult {
  const findings: string[] = [];
  const root = asRecord(candidate);
  if (!root) {
    return emptyGateResult(["candidate must be an object"]);
  }

  if (root.schemaVersion !== "mdpr-theme-candidate-v1") {
    findings.push("schemaVersion must be mdpr-theme-candidate-v1");
  }

  const source = asRecord(root.source);
  if (!source) {
    findings.push("source must be an object");
  } else {
    if (source.kind !== "design-md") findings.push("source.kind must be design-md");
    if (source.generatedBy !== "mdpr-skill") findings.push("source.generatedBy must be mdpr-skill");
    if (typeof source.path !== "string" || !source.path) findings.push("source.path must be a non-empty string");
    if (typeof source.sourceSha256 !== "string" || !/^[a-f0-9]{64}$/i.test(source.sourceSha256)) {
      findings.push("source.sourceSha256 must be a 64-character sha256 hex string");
    }
    if (typeof source.generatedAt !== "string" || Number.isNaN(Date.parse(source.generatedAt))) {
      findings.push("source.generatedAt must be an ISO-compatible date string");
    }
  }

  if (root.requiresApproval !== true) findings.push("requiresApproval must be true");

  const tokens = asRecord(root.tokens);
  if (!tokens) findings.push("tokens must be an object");
  const colors = asRecord(tokens?.colors);
  const typography = asRecord(tokens?.typography);
  const spacing = asRecord(tokens?.spacing);
  const shape = asRecord(tokens?.shape);
  validateStringMap(colors, "tokens.colors", findings);
  validateTypographyMap(typography, findings);
  validateNumberMap(spacing, "tokens.spacing", findings);
  validateNumberMap(shape, "tokens.shape", findings);
  const styleSystem = asRecord(root.styleSystem);
  validateStyleSystem(styleSystem, findings);
  const registration = asRecord(root.registration);
  validateRegistration(registration, findings);
  const constraints = asRecord(root.constraints);
  validateThemeCandidateConstraints(constraints, findings);

  findings.push(...collectDesignImportForbiddenFields(root).map((path) => `${path} is a forbidden final-decision field for mdpr-skill design import`));

  return {
    status: findings.length ? "fail" : "pass",
    findings,
    metrics: {
      colorTokenCount: colors ? Object.keys(colors).length : 0,
      typographyRoleCount: typography ? Object.keys(typography).length : 0,
      spacingTokenCount: spacing ? Object.keys(spacing).length : 0,
      shapeTokenCount: shape ? Object.keys(shape).length : 0,
      layoutBlueprintCount: Array.isArray(styleSystem?.layoutBlueprints) ? styleSystem.layoutBlueprints.length : 0,
      decorationFamilyCount: Array.isArray(styleSystem?.decorationFamilies) ? styleSystem.decorationFamilies.length : 0,
    },
  };
}

export function analyzeHtmlDesign(input: AnalyzeHtmlDesignInput): MdprHtmlDesignAnalysis {
  const declarations = collectCssDeclarations(input.html);
  const mappings = declarations.map((declaration) => mapCssDeclarationToPptEffect(declaration.property, declaration.value));
  const lowerHtml = input.html.toLowerCase();
  return {
    schemaVersion: "mdpr-html-design-analysis-v1",
    source: {
      kind: input.source?.kind ?? "html",
      ...(input.source?.path ? { path: input.source.path } : {}),
      ...(input.source?.url ? { url: input.source.url } : {}),
      capturedAt: input.capturedAt ?? new Date().toISOString(),
    },
    tokens: {
      colors: unique(declarations.flatMap(({ value }) => extractHexColors(value))),
      typography: declarations
        .filter(({ property }) => property === "font-family" || property === "font-size" || property === "font-weight")
        .map(({ property, value }) => ({ property, value })),
      spacing: uniqueNumbers(declarations.filter(({ property }) => ["gap", "padding", "margin"].includes(property)).flatMap(({ value }) => extractPixelNumbers(value))),
      radius: uniqueNumbers(declarations.filter(({ property }) => property === "border-radius").flatMap(({ value }) => extractPixelNumbers(value))),
      elevation: declarations.filter(({ property }) => property === "box-shadow").map(({ value }) => value),
    },
    motifs: detectHtmlMotifs(lowerHtml, declarations),
    pptEffectMapping: mappings,
    warnings: mappings
      .filter((mapping) => mapping.feasibility === "unsupported" || mapping.feasibility === "raster-risk")
      .map((mapping) => `${mapping.cssPath} maps to ${mapping.feasibility}`),
  };
}

export function mapCssDeclarationToPptEffect(property: string, value: string): CssToPptEffectMapping {
  const cssPath = property.trim().toLowerCase();
  const cssValue = value.trim();
  if (cssPath === "background-color" || cssPath === "color") {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: cssPath === "color" ? "theme.tokens.text" : "theme.tokens.surface",
      pptEffect: cssPath === "color" ? "text color token" : "shape fill color token",
      feasibility: "native-editable",
      editabilityRisk: "low",
    };
  }
  if (cssPath === "border" || cssPath === "border-color" || cssPath === "border-width") {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: "theme.tokens.rule",
      pptEffect: "shape line token",
      feasibility: "native-editable",
      editabilityRisk: "low",
    };
  }
  if (cssPath === "border-radius") {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: "theme.tokens.radius",
      pptEffect: "shape radius token",
      feasibility: "native-editable",
      editabilityRisk: "low",
    };
  }
  if (cssPath === "box-shadow") {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: "theme.tokens.elevation",
      pptEffect: "PowerPoint shadow effect approximation",
      feasibility: "native-approximation",
      editabilityRisk: "medium",
      approximationNote: "Blur spread and multiple shadows are normalized to a tokenized PPT shadow.",
    };
  }
  if ((cssPath === "background" || cssPath === "background-image") && /linear-gradient|radial-gradient/i.test(cssValue)) {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: "theme.tokens.gradient",
      pptEffect: "PowerPoint gradient fill approximation",
      feasibility: "native-approximation",
      editabilityRisk: "medium",
    };
  }
  if (cssPath === "backdrop-filter" || (cssPath === "filter" && /blur\(/i.test(cssValue))) {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: "theme.tokens.glass",
      pptEffect: "semi-transparent fill plus line fallback",
      feasibility: "raster-risk",
      editabilityRisk: "high",
      approximationNote: "Live backdrop blur is not a stable editable PowerPoint primitive.",
    };
  }
  if (cssPath === "font-family" || cssPath === "font-size" || cssPath === "font-weight" || cssPath === "letter-spacing") {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: "theme.tokens.typography",
      pptEffect: "PowerPoint text run typography",
      feasibility: "native-editable",
      editabilityRisk: "low",
    };
  }
  if (["display", "gap", "padding", "margin"].includes(cssPath)) {
    return {
      cssPath,
      cssValue,
      mdprTokenPath: cssPath === "display" ? "layout.motif" : "theme.tokens.spacing",
      pptEffect: cssPath === "display" ? "layout motif token" : "spacing token",
      feasibility: "token-approximation",
      editabilityRisk: "low",
    };
  }
  if (cssPath === "clip-path" || cssPath === "animation" || cssPath === "transition") {
    return {
      cssPath,
      cssValue,
      pptEffect: cssPath === "clip-path" ? "freeform/SVG fallback risk" : "static-state only",
      feasibility: "unsupported",
      editabilityRisk: "high",
    };
  }
  return {
    cssPath,
    cssValue,
    pptEffect: "unsupported CSS declaration",
    feasibility: "unsupported",
    editabilityRisk: "medium",
  };
}

function splitFrontmatter(content: string): { frontmatterText: string; body: string } {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { frontmatterText: "", body: normalized };
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatterText: "", body: normalized };
  return {
    frontmatterText: normalized.slice(4, end),
    body: normalized.slice(end + 5),
  };
}

function parseSimpleYaml(text: string): Record<string, any> {
  const root: Record<string, any> = {};
  const stack: Array<{ indent: number; value: Record<string, any> }> = [{ indent: -1, value: root }];
  for (const rawLine of text.split("\n")) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;
    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    const line = rawLine.trim();
    const match = line.match(/^([^:]+):(.*)$/);
    if (!match) continue;
    const key = match[1]!.trim();
    const rawValue = match[2]!.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) stack.pop();
    const parent = stack[stack.length - 1]!.value;
    if (!rawValue) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }
  return root;
}

function parseScalar(value: string): string | number | boolean {
  const unquoted = value.replace(/^["']|["']$/g, "");
  if (/^(true|false)$/i.test(unquoted)) return unquoted.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(unquoted)) return Number(unquoted);
  return unquoted;
}

function parseMarkdownSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let current: string | undefined;
  const lines: string[] = [];
  const flush = () => {
    if (current) sections[current] = lines.join("\n").trim();
    lines.length = 0;
  };
  for (const rawLine of body.replace(/\r\n/g, "\n").split("\n")) {
    const heading = rawLine.match(/^##\s+(.+)$/);
    if (heading) {
      flush();
      current = heading[1]!.trim();
    } else if (current) {
      lines.push(rawLine);
    }
  }
  flush();
  return sections;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => typeof child === "string")
      .map(([key, child]) => [key, child as string]),
  );
}

function numberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => typeof child === "number" && Number.isFinite(child))
      .map(([key, child]) => [key, child as number]),
  );
}

function typographyRecord(value: unknown): Record<string, Record<string, string | number>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, Record<string, string | number>> = {};
  for (const [role, rawSpec] of Object.entries(value as Record<string, unknown>)) {
    if (!rawSpec || typeof rawSpec !== "object" || Array.isArray(rawSpec)) continue;
    const spec = rawSpec as Record<string, unknown>;
    result[role] = Object.fromEntries(
      Object.entries(spec).filter(([, child]) => typeof child === "string" || typeof child === "number"),
    ) as Record<string, string | number>;
  }
  return result;
}

function bulletLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseLayoutBlueprints(value: string): MdprThemeCandidate["styleSystem"]["layoutBlueprints"] {
  return bulletLines(value).map((line) => {
    const [labelText, restText = ""] = splitOnce(line, ":");
    const [descriptionText, regionsText = ""] = splitOnce(restText, "; regions:");
    const name = labelText.trim();
    return {
      name,
      intent: slugify(name),
      description: descriptionText.trim(),
      regions: regionsText.split(",").map((region) => region.trim()).filter(Boolean),
    };
  }).filter((blueprint) => blueprint.name && blueprint.description);
}

function splitOnce(value: string, separator: string): [string, string?] {
  const index = value.indexOf(separator);
  if (index === -1) return [value];
  return [value.slice(0, index), value.slice(index + separator.length)];
}

function decorationFamiliesFromLines(lines: string[]): string[] {
  const families: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/\bnumbered?\b|\bordered\b/.test(lower)) families.push("numbered-rail");
    if (/\brule\b|\bline\b/.test(lower)) families.push("rule-lines");
    if (/\bchips?\b|\bbadges?\b|\bpills?\b/.test(lower)) families.push("accent-chips");
    if (/\bcard\b/.test(lower)) families.push("cards");
    if (/\bcallout\b/.test(lower)) families.push("callout");
    if (/\bglass\b|\bblur\b/.test(lower)) families.push("glass");
    if (/\bgrid\b/.test(lower)) families.push("grid");
    if (/\bphoto\b|\bimage\b/.test(lower)) families.push("image-frame");
    if (/\btexture\b|\bnoise\b/.test(lower)) families.push("texture");
  }
  return unique(families);
}

function registrationTargetsFromLines(lines: string[]): MdprThemeRegistrationTarget[] {
  const allowed = new Set<MdprThemeRegistrationTarget>([
    "mdpr-theme-pack",
    "mdpr-profile",
    "mdpr-rulebook",
    "deck-local-style-pack",
  ]);
  const targets = lines.filter((line): line is MdprThemeRegistrationTarget => allowed.has(line as MdprThemeRegistrationTarget));
  return targets.length ? unique(targets) : ["deck-local-style-pack"];
}

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "custom-layout";
}

function assertNoDesignImportForbiddenFields(value: unknown, path = "$"): void {
  const [first] = collectDesignImportForbiddenFields(value, path);
  if (first) {
    throw new Error(`${first} is a forbidden final-decision field for mdpr-skill design import`);
  }
}

function collectDesignImportForbiddenFields(value: unknown, path = "$"): string[] {
  const findings: string[] = [];
  if (!value || typeof value !== "object") return findings;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...collectDesignImportForbiddenFields(item, `${path}[${index}]`)));
    return findings;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_DESIGN_IMPORT_FIELDS.has(key)) {
      findings.push(`${path}.${key}`);
    }
    findings.push(...collectDesignImportForbiddenFields(child, `${path}.${key}`));
  }
  return findings;
}

function validateStringMap(value: Record<string, unknown> | undefined, path: string, findings: string[]): void {
  if (!value) {
    findings.push(`${path} must be an object`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child !== "string") findings.push(`${path}.${key} must be a string`);
  }
}

function validateNumberMap(value: Record<string, unknown> | undefined, path: string, findings: string[]): void {
  if (!value) {
    findings.push(`${path} must be an object`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child !== "number" || !Number.isFinite(child)) findings.push(`${path}.${key} must be a finite number`);
  }
}

function validateStyleSystem(value: Record<string, unknown> | undefined, findings: string[]): void {
  if (!value) {
    findings.push("styleSystem must be an object");
    return;
  }
  validateStringArray(value.bestFor, "styleSystem.bestFor", findings);
  validateStringArray(value.layoutIntents, "styleSystem.layoutIntents", findings);
  validateStringArray(value.decorationFamilies, "styleSystem.decorationFamilies", findings);
  if (!Array.isArray(value.layoutBlueprints)) {
    findings.push("styleSystem.layoutBlueprints must be an array");
    return;
  }
  value.layoutBlueprints.forEach((rawBlueprint, index) => {
    const blueprint = asRecord(rawBlueprint);
    if (!blueprint) {
      findings.push(`styleSystem.layoutBlueprints[${index}] must be an object`);
      return;
    }
    for (const key of ["name", "intent", "description"]) {
      if (typeof blueprint[key] !== "string" || !blueprint[key]) {
        findings.push(`styleSystem.layoutBlueprints[${index}].${key} must be a non-empty string`);
      }
    }
    validateStringArray(blueprint.regions, `styleSystem.layoutBlueprints[${index}].regions`, findings);
  });
}

function validateRegistration(value: Record<string, unknown> | undefined, findings: string[]): void {
  if (!value) {
    findings.push("registration must be an object");
    return;
  }
  const allowed = new Set(["mdpr-theme-pack", "mdpr-profile", "mdpr-rulebook", "deck-local-style-pack"]);
  if (!Array.isArray(value.targets)) {
    findings.push("registration.targets must be an array");
  } else {
    for (const target of value.targets) {
      if (typeof target !== "string" || !allowed.has(target)) {
        findings.push("registration.targets must contain only mdpr-theme-pack, mdpr-profile, mdpr-rulebook, or deck-local-style-pack");
        break;
      }
    }
  }
  if (value.workflow !== "proposal-review-approve-mdpr-import") {
    findings.push("registration.workflow must be proposal-review-approve-mdpr-import");
  }
}

function validateThemeCandidateConstraints(value: Record<string, unknown> | undefined, findings: string[]): void {
  if (!value) {
    findings.push("constraints must be an object");
    return;
  }
  for (const key of ["mdprOwnsFinalLayout", "mdprOwnsFinalThemeBinding", "noRawUseInAgentHints", "requiresDesignLockUpdate"]) {
    if (value[key] !== true) findings.push(`constraints.${key} must be true`);
  }
}

function validateStringArray(value: unknown, path: string, findings: string[]): void {
  if (!Array.isArray(value)) {
    findings.push(`${path} must be an array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item) findings.push(`${path}[${index}] must be a non-empty string`);
  });
}

function validateTypographyMap(value: Record<string, unknown> | undefined, findings: string[]): void {
  if (!value) {
    findings.push("tokens.typography must be an object");
    return;
  }
  for (const [role, rawSpec] of Object.entries(value)) {
    const spec = asRecord(rawSpec);
    if (!spec) {
      findings.push(`tokens.typography.${role} must be an object`);
      continue;
    }
    for (const [key, child] of Object.entries(spec)) {
      if (typeof child !== "string" && typeof child !== "number") {
        findings.push(`tokens.typography.${role}.${key} must be a string or number`);
      }
    }
  }
}

function emptyGateResult(findings: string[]): ThemeCandidateGateResult {
  return {
    status: "fail",
    findings,
    metrics: {
      colorTokenCount: 0,
      typographyRoleCount: 0,
      spacingTokenCount: 0,
      shapeTokenCount: 0,
      layoutBlueprintCount: 0,
      decorationFamilyCount: 0,
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function collectCssDeclarations(html: string): Array<{ property: string; value: string }> {
  const declarationTexts: string[] = [];
  declarationTexts.push(...collectStyleAttributeValues(html));
  for (const styleBlock of collectStyleBlocks(html)) {
    declarationTexts.push(...collectCssRuleDeclarations(styleBlock));
  }
  return declarationTexts.flatMap(parseCssDeclarationText);
}

function collectStyleAttributeValues(html: string): string[] {
  const values: string[] = [];
  let cursor = 0;
  const lowerHtml = html.toLowerCase();
  while (cursor < html.length) {
    const styleIndex = lowerHtml.indexOf("style", cursor);
    if (styleIndex < 0) break;
    cursor = styleIndex + "style".length;

    let scan = cursor;
    while (scan < html.length && isHtmlSpace(html[scan])) scan += 1;
    if (html[scan] !== "=") continue;
    scan += 1;
    while (scan < html.length && isHtmlSpace(html[scan])) scan += 1;

    const quote = html[scan];
    if (quote !== '"' && quote !== "'") continue;
    const valueStart = scan + 1;
    const valueEnd = html.indexOf(quote, valueStart);
    if (valueEnd < 0) break;
    values.push(html.slice(valueStart, valueEnd));
    cursor = valueEnd + 1;
  }
  return values;
}

function collectStyleBlocks(html: string): string[] {
  const blocks: string[] = [];
  const lowerHtml = html.toLowerCase();
  let cursor = 0;
  while (cursor < html.length) {
    const tagStart = lowerHtml.indexOf("<style", cursor);
    if (tagStart < 0) break;
    const openEnd = html.indexOf(">", tagStart + "<style".length);
    if (openEnd < 0) break;
    const closeStart = lowerHtml.indexOf("</style>", openEnd + 1);
    if (closeStart < 0) break;
    blocks.push(html.slice(openEnd + 1, closeStart));
    cursor = closeStart + "</style>".length;
  }
  return blocks;
}

function collectCssRuleDeclarations(css: string): string[] {
  const declarations: string[] = [];
  let cursor = 0;
  while (cursor < css.length) {
    const open = css.indexOf("{", cursor);
    if (open < 0) break;
    const close = css.indexOf("}", open + 1);
    if (close < 0) break;
    declarations.push(css.slice(open + 1, close));
    cursor = close + 1;
  }
  return declarations;
}

function isHtmlSpace(value: string | undefined): boolean {
  return value === " " || value === "\t" || value === "\n" || value === "\r" || value === "\f";
}

function parseCssDeclarationText(text: string): Array<{ property: string; value: string }> {
  return text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const index = part.indexOf(":");
      if (index <= 0) return [];
      return [{
        property: part.slice(0, index).trim().toLowerCase(),
        value: part.slice(index + 1).trim(),
      }];
    });
}

function detectHtmlMotifs(lowerHtml: string, declarations: Array<{ property: string; value: string }>): Array<{ kind: string; confidence: number; evidence: string }> {
  const motifs: Array<{ kind: string; confidence: number; evidence: string }> = [];
  const hasGrid = declarations.some(({ property, value }) => property === "display" && value.toLowerCase().includes("grid"));
  const hasGap = declarations.some(({ property }) => property === "gap");
  if (hasGrid && hasGap) motifs.push({ kind: "card-grid", confidence: 0.82, evidence: "display:grid with gap" });
  const hasPillRadius = declarations.some(({ property, value }) => property === "border-radius" && extractPixelNumbers(value).some((number) => number >= 48 || value.includes("999")));
  if (hasPillRadius || /\b(badge|chip|pill)\b/.test(lowerHtml)) {
    motifs.push({ kind: "pill-badge", confidence: 0.78, evidence: "badge-like class or pill radius" });
  }
  const hasFlex = declarations.some(({ property, value }) => property === "display" && value.toLowerCase().includes("flex"));
  if (hasFlex && lowerHtml.includes("<img")) motifs.push({ kind: "split-media", confidence: 0.7, evidence: "flex layout with image" });
  return motifs;
}

function extractHexColors(value: string): string[] {
  return [...value.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0]!.toLowerCase());
}

function extractPixelNumbers(value: string): number[] {
  const numbers: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const parsed = readCssPixelNumberAt(value, index);
    if (!parsed) continue;
    numbers.push(parsed.value);
    index = parsed.nextIndex - 1;
  }
  return numbers;
}

function readCssPixelNumberAt(input: string, start: number): { value: number; nextIndex: number } | undefined {
  let cursor = start;
  if (input[cursor] === "-") cursor += 1;

  const integerStart = cursor;
  while (cursor < input.length && isAsciiDigit(input[cursor])) cursor += 1;
  if (cursor === integerStart) return undefined;

  if (input[cursor] === ".") {
    const fractionStart = cursor + 1;
    cursor = fractionStart;
    while (cursor < input.length && isAsciiDigit(input[cursor])) cursor += 1;
    if (cursor === fractionStart) return undefined;
  }

  if (input.slice(cursor, cursor + 2).toLowerCase() !== "px") return undefined;
  const afterUnit = cursor + 2;
  if (afterUnit < input.length && isAsciiIdentifier(input[afterUnit])) return undefined;

  const value = Number(input.slice(start, cursor));
  if (!Number.isFinite(value)) return undefined;
  return { value, nextIndex: afterUnit };
}

function isAsciiDigit(value: string | undefined): boolean {
  return value !== undefined && value >= "0" && value <= "9";
}

function isAsciiIdentifier(value: string | undefined): boolean {
  return value !== undefined && ((value >= "a" && value <= "z") || (value >= "A" && value <= "Z") || (value >= "0" && value <= "9") || value === "_" || value === "-");
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}
