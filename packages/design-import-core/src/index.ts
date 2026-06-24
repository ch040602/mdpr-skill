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
  rationale: {
    overview?: string;
    layout?: string;
    dosDonts: string[];
  };
  requiresApproval: true;
};

export type BuildThemeCandidateInput = {
  path: string;
  content: string;
  generatedAt?: string;
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
    rationale: {
      ...(parsed.sections.Overview ? { overview: parsed.sections.Overview } : {}),
      ...(parsed.sections.Layout ? { layout: parsed.sections.Layout } : {}),
      dosDonts: bulletLines(parsed.sections["Do's and Don'ts"] ?? parsed.sections["Dos and Donts"] ?? ""),
    },
    requiresApproval: true,
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

function assertNoDesignImportForbiddenFields(value: unknown, path = "$"): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoDesignImportForbiddenFields(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_DESIGN_IMPORT_FIELDS.has(key)) {
      throw new Error(`${path}.${key} is a forbidden final-decision field for mdpr-skill design import`);
    }
    assertNoDesignImportForbiddenFields(child, `${path}.${key}`);
  }
}
