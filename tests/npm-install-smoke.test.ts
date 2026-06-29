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
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
