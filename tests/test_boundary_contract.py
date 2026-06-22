from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


class BoundaryContractTest(unittest.TestCase):
    def test_packages_do_not_import_src_scaffolds(self):
        offenders = []
        for path in (ROOT / "packages").rglob("*.ts"):
            text = path.read_text(encoding="utf-8")
            if "src-scaffolds" in text:
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [], "package code must not depend on src-scaffolds proposal files")

    def test_local_report_packages_are_not_named_as_deck_renderers(self):
        self.assertFalse((ROOT / "packages" / "render-html" / "src").exists())
        self.assertFalse((ROOT / "packages" / "render-pdf" / "src").exists())
        self.assertTrue((ROOT / "packages" / "report-html" / "src" / "renderReportDeck.ts").exists())
        self.assertTrue((ROOT / "packages" / "report-pdf" / "src" / "renderReportDeck.ts").exists())

    def test_companion_package_boundaries_exist(self):
        for rel in [
            "packages/mdpr-adapter/src/index.ts",
            "packages/hints-core/src/index.ts",
            "packages/review-core/src/index.ts",
            "packages/eval-core/src/index.ts",
            "packages/cli/src/commands/hint.ts",
            "packages/cli/src/commands/review.ts",
            "packages/cli/src/commands/compare.ts",
            "packages/cli/src/commands/inspectBoundary.ts",
            "packages/cli/src/commands/validateSchemaSync.ts",
        ]:
            self.assertTrue((ROOT / rel).exists(), rel)

    def test_design_components_readme_is_reference_not_runtime_surface(self):
        text = (ROOT / "design_components" / "README.md").read_text(encoding="utf-8").lower()
        self.assertIn("reference grammar", text)
        self.assertIn("mdpr owns runtime", text)
        self.assertNotIn("implementation surface", text)

    def test_skill_docs_forbid_final_decision_fields(self):
        docs = [
            ROOT / "skills" / "mdpr-design-components" / "SKILL.md",
            ROOT / "skills" / "mdpr-design-review" / "SKILL.md",
            ROOT / "docs" / "agent-hint-guide.md",
        ]
        required = ["coordinates", "colors", "typography", "z-order", "renderer"]
        for path in docs:
            text = path.read_text(encoding="utf-8").lower()
            missing = [term for term in required if not re.search(rf"\b{re.escape(term)}\b", text)]
            self.assertEqual(missing, [], f"{path.relative_to(ROOT)} misses boundary terms")


if __name__ == "__main__":
    unittest.main()
