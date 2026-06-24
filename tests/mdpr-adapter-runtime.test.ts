import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  MdprAdapterError,
  assertMdprRunSucceeded,
  loadMdprArtifacts,
} from "../packages/mdpr-adapter/src/index";

test("assertMdprRunSucceeded reports command failure with command and cwd", () => {
  assert.throws(() => assertMdprRunSucceeded({
    command: ["mdpresent", "build", "deck.md"],
    cwd: "C:/work",
    exitCode: 2,
    stdout: "",
    stderr: "boom",
  }), (error) => {
    assert.ok(error instanceof MdprAdapterError);
    assert.equal(error.kind, "command-failed");
    assert.match(error.message, /mdpresent build deck\.md/);
    assert.match(error.message, /C:\/work/);
    assert.match(error.message, /exit code 2/);
    return true;
  });
});

test("loadMdprArtifacts reports missing manifest as artifact failure", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mdpr-adapter-missing-"));
  try {
    assert.throws(() => loadMdprArtifacts(outDir), (error) => {
      assert.ok(error instanceof MdprAdapterError);
      assert.equal(error.kind, "artifact-missing");
      assert.match(error.message, /mdpresent-manifest\.json/);
      return true;
    });
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
