import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  MdprAdapterError,
  assertMdprRunSucceeded,
  collectMdprMetrics,
  loadMdprArtifacts,
  runMdprBuild,
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

test("runMdprBuild forwards approved pack paths to MDPR CLI", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mdpr-adapter-pack-"));
  const cliPath = join(outDir, "fake-mdpr.js");
  try {
    writeFileSync(cliPath, "console.log(JSON.stringify(process.argv.slice(2)));", "utf-8");
    const result = runMdprBuild({
      deckPath: "deck.md",
      outDir: join(outDir, "dist"),
      packPath: "mdpr.pack.json",
      mdprBinary: cliPath,
      formats: ["html"],
    });
    const args = JSON.parse(result.stdout) as string[];
    assert.deepEqual(args.slice(0, 5), ["build", "deck.md", "--to", "html", "--out"]);
    assert.equal(args.includes("--pack"), true);
    assert.equal(args[args.indexOf("--pack") + 1], "mdpr.pack.json");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("collectMdprMetrics prefers normalized MDPR manifest metrics", () => {
  const metrics = collectMdprMetrics({
    slideCount: 99,
    diagnostics: [
      { code: "COHERENCE_LEGACY" },
      { code: "TEXT_OVERFLOW_LEGACY" },
    ],
    visualValidation: { errors: 99 },
    metrics: {
      slideCount: 12,
      overflowCount: 2,
      coherenceWarningCount: 3,
      visualErrorCount: 4,
    },
  });

  assert.deepEqual(metrics, {
    slideCount: 12,
    overflowCount: 2,
    coherenceWarnings: 3,
    visualErrors: 4,
  });
});

test("collectMdprMetrics reads validation summaries before diagnostic fallback", () => {
  const metrics = collectMdprMetrics({
    slideCount: 7,
    diagnostics: [
      { code: "UNRELATED_OVERFLOW_WORD_SHOULD_NOT_WIN" },
      { code: "COHERENCE_WORD_SHOULD_NOT_WIN" },
    ],
    validation: {
      layoutOverflow: [
        { level: "error", code: "TEXT_OVERFLOW" },
        { level: "warning", code: "TEXT_FIT_LOW_CONFIDENCE" },
      ],
      coherence: {
        claimlessSlides: 1,
        captionDetached: 1,
        orphanEvidenceBlocks: 1,
        sectionMotifDrift: 1,
      },
      visual: {
        diagnostics: [
          { level: "warning", code: "CONTRAST_LOW" },
          { level: "error", code: "TEXT_CLIPPED" },
        ],
      },
    },
  });

  assert.deepEqual(metrics, {
    slideCount: 7,
    overflowCount: 1,
    coherenceWarnings: 4,
    visualErrors: 1,
  });
});
