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

    def test_cli_compare_exports_eval_runner(self):
        source = (ROOT / "packages" / "cli" / "src" / "commands" / "compare.ts").read_text(encoding="utf-8")
        self.assertIn("runMdprSkillEval", source)


if __name__ == "__main__":
    unittest.main()
