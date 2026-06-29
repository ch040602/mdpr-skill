import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = "npm";

function run(args: string[], cwd: string): string {
  const result = spawnSync(npm, args, {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      npm_config_dry_run: "false",
    },
    shell: process.platform === "win32",
    windowsHide: true,
  });

  if (result.status !== 0) {
    assert.fail([
      `npm ${args.join(" ")} failed with status ${result.status}`,
      result.error ? String(result.error) : "",
      result.stdout,
      result.stderr,
    ].join("\n"));
  }

  return result.stdout ?? "";
}

test("packed npm package installs into a consumer project and exposes mdpr-skill", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "mdpr-skill-npm-smoke-"));
  try {
    const packDir = join(tempRoot, "pack");
    const consumerDir = join(tempRoot, "consumer");
    mkdirSync(packDir);
    mkdirSync(consumerDir);

    const packOutput = JSON.parse(run(["pack", "--pack-destination", packDir, "--json"], root));
    const filename = packOutput[0].filename as string;
    const packedFiles = (packOutput[0].files as Array<{ path: string }>).map((file) => file.path);
    const tarballPath = filename.includes("/") || filename.includes("\\") ? filename : join(packDir, filename);
    assert.equal(existsSync(tarballPath), true);
    assert.ok(packOutput[0].size < 500_000, `packed package is unexpectedly large: ${packOutput[0].size}`);
    assert.equal(packedFiles.some((path) => path.startsWith("docs/assets/")), false);
    assert.equal(packedFiles.some((path) => path.startsWith("packages/")), false);
    assert.equal(packedFiles.some((path) => path.startsWith("dist/packages/")), true);

    writeFileSync(
      join(consumerDir, "package.json"),
      JSON.stringify({ name: "mdpr-skill-smoke-consumer", private: true, version: "0.0.0" }),
      "utf-8",
    );

    run(["install", tarballPath, "--ignore-scripts", "--no-audit", "--fund=false"], consumerDir);

    const installedPackagePath = join(consumerDir, "node_modules", "mdpr-skill", "package.json");
    const installedPackage = JSON.parse(readFileSync(installedPackagePath, "utf-8"));
    assert.equal(installedPackage.engines.node, ">=22");
    assert.equal(installedPackage.type, "module");
    assert.equal(installedPackage.main, "./dist/packages/cli/src/index.js");
    assert.equal(installedPackage.types, "./dist/packages/cli/src/index.d.ts");
    assert.equal(installedPackage.exports["."].default, "./dist/packages/cli/src/index.js");
    assert.equal(installedPackage.dependencies?.tsx, undefined);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "LICENSE")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "SECURITY.md")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "SUPPORT.md")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "CHANGELOG.md")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "CODE_OF_CONDUCT.md")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "dist", "packages", "cli", "src", "main.js")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "dist", "packages", "cli", "src", "index.d.ts")), true);
    assert.equal(existsSync(join(consumerDir, "node_modules", "mdpr-skill", "packages", "cli", "src", "main.ts")), false);
    assert.equal(existsSync(join(consumerDir, "node_modules", "tsx")), false);

    const help = run(["exec", "--", "mdpr-skill", "--help"], consumerDir);
    assert.match(help, /mdpr-skill/);
    assert.match(help, /hint/);
    assert.match(help, /review/);
    assert.match(help, /formats/);

    const hintOut = join("artifacts", "agent-hint.json");
    const hintStdout = run([
      "exec",
      "--",
      "mdpr-skill",
      "hint",
      "--source-sha256",
      "a".repeat(64),
      "--out",
      hintOut,
    ], consumerDir);
    assert.equal(JSON.parse(hintStdout).status, "pass");

    const hint = JSON.parse(readFileSync(join(consumerDir, hintOut), "utf-8"));
    assert.equal(hint.schemaVersion, "mdpr-agent-hint-v1");
    assert.equal(hint.generatedBy, "mdpr-skill");
    assert.equal(hint.sourceSha256, "a".repeat(64));
    assert.deepEqual(hint.hints, []);

    const formatOut = join("artifacts", "figurelabs-format-comparison", "format-capabilities.json");
    const compareStdout = run([
      "exec",
      "--",
      "mdpr-skill",
      "formats",
      "--compare",
      "figurelabs",
      "--out",
      formatOut,
    ], consumerDir);
    const comparison = JSON.parse(compareStdout);
    assert.equal(comparison.schemaVersion, "mdpr-skill-format-capabilities-v1");
    assert.equal(comparison.comparisonTarget.name, "FigureLabs");
    assert.equal(comparison.comparisonTarget.sourceReviewedDate, "2026-06-30");
    assert.equal(comparison.comparisonTarget.sourceReviewTimezone, "Asia/Seoul");
    assert.ok(comparison.comparisonTarget.sourceEvidence.some((item: { claimId: string }) => item.claimId === "output-format-exports"));
    assert.equal(comparison.coverage.figureLabs.publicEvidenceClaims, comparison.comparisonTarget.sourceEvidence.length);
    assert.deepEqual(comparison.mdprSkill.comparisonReportFormats, ["json", "markdown", "html"]);
    assert.equal(comparison.coverage.mdprSkill.comparisonReportFormats, comparison.mdprSkill.comparisonReportFormats.length);
    assert.equal(existsSync(join(consumerDir, formatOut)), true);
    assert.ok(
      comparison.coverage.mdprSkill.formatFamilies > comparison.coverage.figureLabs.publicFormatFamilies,
      "mdpr-skill should expose broader format-family coverage than the public FigureLabs baseline",
    );

    const validateStdout = run(["exec", "--", "mdpr-skill", "formats", "--validate", formatOut], consumerDir);
    const validation = JSON.parse(validateStdout);
    assert.equal(validation.status, "pass");
    assert.ok(validation.checks.includes("source-evidence"));
    assert.ok(validation.checks.includes("mdpr-skill-superiority"));

    const markdownOut = join("artifacts", "figurelabs-format-comparison", "format-capabilities.md");
    const markdownStdout = run([
      "exec",
      "--",
      "mdpr-skill",
      "formats",
      "--compare",
      "figurelabs",
      "--format",
      "markdown",
      "--out",
      markdownOut,
    ], consumerDir);
    assert.match(markdownStdout, /^# FigureLabs Format Capability Comparison/);
    assert.match(markdownStdout, /PPTX, HTML, PDF, SVG, JSON, Markdown/);
    assert.match(markdownStdout, /JSON, Markdown, HTML/);
    assert.match(markdownStdout, /Source reviewed: 2026-06-30 \(Asia\/Seoul\)/);
    assert.equal(existsSync(join(consumerDir, markdownOut)), true);

    const htmlOut = join("artifacts", "figurelabs-format-comparison", "format-capabilities.html");
    const htmlStdout = run([
      "exec",
      "--",
      "mdpr-skill",
      "formats",
      "--compare",
      "figurelabs",
      "--format",
      "html",
      "--out",
      htmlOut,
    ], consumerDir);
    assert.match(htmlStdout, /^<!doctype html>/);
    assert.match(htmlStdout, /<title>FigureLabs Format Capability Comparison<\/title>/);
    assert.match(htmlStdout, /JSON, Markdown, HTML/);
    assert.match(htmlStdout, /Source reviewed: 2026-06-30 \(Asia\/Seoul\)/);
    assert.equal(existsSync(join(consumerDir, htmlOut)), true);

    assert.equal(
      existsSync(join(consumerDir, "node_modules", "mdpr-skill", "schemas", "mdpr-format-capabilities.schema.json")),
      true,
    );
    assert.equal(
      existsSync(join(consumerDir, "node_modules", "mdpr-skill", "docs", "figurelabs-comparison.md")),
      true,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
