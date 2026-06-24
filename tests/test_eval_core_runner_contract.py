from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class EvalCoreRunnerContractTests(unittest.TestCase):
    def test_eval_core_exposes_real_baseline_guided_runner(self):
        source = (ROOT / "packages" / "eval-core" / "src" / "index.ts").read_text(encoding="utf-8")
        for required in [
            "runBaseline",
            "runSkillGuided",
            "runMdprSkillEval",
            "emitEvalReport",
            "regressionGate",
            "mdpr-skill-eval-v1",
            "runMdprBuild",
            "loadMdprArtifacts",
            "collectMdprMetrics",
            "assertNoForbiddenFields",
        ]:
            self.assertIn(required, source)

    def test_eval_core_records_baseline_guided_artifacts_and_gates(self):
        source = (ROOT / "packages" / "eval-core" / "src" / "index.ts").read_text(encoding="utf-8")
        for required in [
            "baseline",
            "skillGuided",
            "manifestPath",
            "hintsPath",
            "schemaSync",
            "boundary",
            "regression",
            "sourceSha256",
        ]:
            self.assertIn(required, source)

    def test_eval_core_has_non_mvp_quality_gates(self):
        source = (ROOT / "packages" / "eval-core" / "src" / "index.ts").read_text(encoding="utf-8")
        for required in [
            "EvalGateResult",
            "EvalRegressionThresholds",
            "DEFAULT_REGRESSION_THRESHOLDS",
            "buildRegressionGate",
            "validateEvalHints",
            "summary",
            "overallStatus",
            "findings",
            "thresholds",
            "minFontPt",
            "textClipRiskCount",
            "contrastFailures",
            "connectorWarnings",
        ]:
            self.assertIn(required, source)
        self.assertNotIn('schemaSync: "pass"', source)
        self.assertNotIn('boundary: "pass"', source)
        self.assertNotIn('regression: regressionGate(comparison)', source)

    def test_cli_compare_exports_eval_runner(self):
        source = (ROOT / "packages" / "cli" / "src" / "commands" / "compare.ts").read_text(encoding="utf-8")
        self.assertIn("runMdprSkillEval", source)

    def test_eval_core_has_executable_typescript_validation(self):
        package_json = (ROOT / "package.json").read_text(encoding="utf-8")
        self.assertIn('"typecheck"', package_json)
        self.assertIn('"test:eval-core"', package_json)
        self.assertIn('"test:eval-core:e2e"', package_json)
        self.assertTrue((ROOT / "tsconfig.json").is_file())
        self.assertTrue((ROOT / "tests" / "eval-core-runtime.test.ts").is_file())
        self.assertTrue((ROOT / "tests" / "eval-core-mdpresent-e2e.test.ts").is_file())


if __name__ == "__main__":
    unittest.main()
