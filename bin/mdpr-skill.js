#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "dist", "packages", "cli", "src", "main.js");
const result = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, MDPR_SKILL_INVOKE_CWD: process.cwd() },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
