from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MdprAdapterRunnerContractTests(unittest.TestCase):
    def test_mdpr_adapter_exposes_runtime_runner_boundary(self):
        source = (ROOT / "packages" / "mdpr-adapter" / "src" / "index.ts").read_text(encoding="utf-8")
        for name in [
            "resolveMdprBinary",
            "runMdpr",
            "runMdprInspect",
            "runMdprBuild",
            "runMdprValidate",
            "loadMdprArtifacts",
            "collectMdprMetrics",
        ]:
            self.assertIn(f"function {name}", source)

    def test_selection_and_approval_schemas_are_present(self):
        for rel in [
            "schemas/mdpr-ppt-selection.schema.json",
            "schemas/mdpr-selection-context.schema.json",
            "schemas/mdpr-change-request.schema.json",
        ]:
            self.assertTrue((ROOT / rel).is_file(), rel)

    def test_bridge_boundary_is_documented(self):
        doc = (ROOT / "docs" / "mdpr-ppt-bridge.md").read_text(encoding="utf-8")
        for required in [
            "hint rail",
            "review rail",
            "approved override / pack rail",
            "agent-hint.json",
            "review-report.json",
            "mdpr-ppt-selection-v1",
            "mdpr-change-request-v1",
            "must not create final coordinates",
        ]:
            self.assertIn(required, doc)

        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("MDPR PowerPoint bridge boundary", readme)


if __name__ == "__main__":
    unittest.main()
