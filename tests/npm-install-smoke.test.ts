import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = "npm";
const forbiddenRuntimeKeys = new Set([
  "x",
  "y",
  "w",
  "h",
  "cropRect",
  "iconPath",
  "imagePath",
  "rendererObjectId",
  "masterId",
  "layoutId",
  "fontFamily",
  "fontName",
  "zOrder",
]);

function collectRuntimeDecisionLeaks(value: unknown, path = "$"): string[] {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && path !== "$.markdown" && /#[0-9a-fA-F]{6}\b/.test(value)) return [`${path}:raw-hex`];
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRuntimeDecisionLeaks(item, `${path}[${index}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    const nextPath = `${path}.${key}`;
    const ownLeak = forbiddenRuntimeKeys.has(key) ? [nextPath] : [];
    return [...ownLeak, ...collectRuntimeDecisionLeaks(item, nextPath)];
  });
}

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

    const docsList = JSON.parse(run(["exec", "--", "mdpr-skill", "docs", "--json"], consumerDir));
    const docTopics = docsList.topics.map((topic: { topic: string }) => topic.topic).sort();
    assert.deepEqual(docTopics, [
      "astryx-comparison",
      "bootstrap",
      "boundaries",
      "commands",
      "design-import",
      "media",
      "preflight",
      "review",
      "template-fill",
    ]);

    const templateFillDocs = run(["exec", "--", "mdpr-skill", "docs", "template-fill", "--dense"], consumerDir);
    assert.match(templateFillDocs, /preserve-master-slides true/);
    assert.match(templateFillDocs, /image-policy no-image/);
    assert.match(templateFillDocs, /icon-policy no-new-icons/);

    const mediaDocs = JSON.parse(run(["exec", "--", "mdpr-skill", "docs", "media", "--json"], consumerDir));
    assert.equal(mediaDocs.schemaVersion, "mdpr-skill-agent-docs-v1");
    assert.equal(mediaDocs.topic, "media");
    assert.match(mediaDocs.markdown, /Default image search to disabled/);
    assert.match(mediaDocs.markdown, /Generated-image candidates require explicit request evidence/);

    const astryxDocs = JSON.parse(run(["exec", "--", "mdpr-skill", "docs", "astryx-comparison", "--json"], consumerDir));
    assert.equal(astryxDocs.topic, "astryx-comparison");
    assert.match(astryxDocs.markdown, /local branch CLI docs/);
    assert.match(astryxDocs.markdown, /Do not borrow: React component APIs/);

    const preflightDocs = JSON.parse(run(["exec", "--", "mdpr-skill", "docs", "preflight", "--json"], consumerDir));
    assert.equal(preflightDocs.topic, "preflight");
    assert.match(preflightDocs.markdown, /MDPR owns parsing/);
    assert.match(preflightDocs.markdown, /mdpr-skill owns semantic hints/);
    assert.deepEqual(collectRuntimeDecisionLeaks([
      docsList,
      { topic: "template-fill", markdown: templateFillDocs },
      mediaDocs,
      astryxDocs,
      preflightDocs,
    ]), []);
    assert.deepEqual(collectRuntimeDecisionLeaks({ markdown: "do not emit x/y/w/h or imagePath in hints" }), []);
    assert.deepEqual(collectRuntimeDecisionLeaks({ layout: { x: 1, y: 2, w: 3, h: 4 }, cropRect: {} }), [
      "$.layout.x",
      "$.layout.y",
      "$.layout.w",
      "$.layout.h",
      "$.cropRect",
    ]);

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

    writeFileSync(join(consumerDir, "selection-context.json"), JSON.stringify({
      schemaVersion: "mdpr-selection-context-v1",
      source: {
        kind: "mdpr-preview",
        sourceSha256: "b".repeat(64),
      },
      slideId: "slide-template-bridge",
      overlappedBlocks: ["claim-1", "proof-1"],
      userInstruction: "기존 HCS PPT 테마와 마스터 슬라이드를 유지하고 이미지는 추가하지 마.",
    }), "utf-8");
    const bridgeHintOut = join("artifacts", "bridge-agent-hint.json");
    const bridgeHintStdout = run([
      "exec",
      "--",
      "mdpr-skill",
      "hint",
      "--selection-context",
      "selection-context.json",
      "--workflow-intent",
      "template-fill",
      "--template-source",
      "hcs-template",
      "--preserve-master-slides",
      "true",
      "--image-policy",
      "no-image",
      "--image-search-policy",
      "disabled",
      "--icon-policy",
      "no-new-icons",
      "--out",
      bridgeHintOut,
    ], consumerDir);
    assert.equal(JSON.parse(bridgeHintStdout).status, "pass");
    const bridgeHint = JSON.parse(readFileSync(join(consumerDir, bridgeHintOut), "utf-8"));
    const bridgeItem = bridgeHint.hints[0];
    assert.equal(bridgeItem.workflowIntentCandidate.intent, "template-fill");
    assert.equal(bridgeItem.templateUseCandidate.masterSlidePolicy, "preserve-existing-master-slides");
    assert.equal(bridgeItem.mediaPolicyCandidate.imageUse, "no-image");
    assert.equal(bridgeItem.mediaPolicyCandidate.imageSearch, "disabled");
    assert.equal(bridgeItem.mediaPolicyCandidate.iconUse, "no-new-icons");
    assert.equal(bridgeItem.visualAssetCandidates, undefined);
    assert.equal(bridgeItem.iconKeywordCandidates, undefined);
    assert.deepEqual(collectRuntimeDecisionLeaks(bridgeHint), []);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
