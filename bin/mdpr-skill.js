#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "packages", "cli", "src", "main.ts");
const result = spawnSync(process.execPath, ["--import", "tsx", entry, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
