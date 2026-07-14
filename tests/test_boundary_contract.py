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
            ROOT / "skills" / "mdpr-skill" / "SKILL.md",
            ROOT / "docs" / "agent-hint-guide.md",
        ]
        required = ["coordinates", "colors", "typography", "z-order", "renderer"]
        for path in docs:
            text = path.read_text(encoding="utf-8").lower()
            missing = [term for term in required if not re.search(rf"\b{re.escape(term)}\b", text)]
            self.assertEqual(missing, [], f"{path.relative_to(ROOT)} misses boundary terms")

    def test_unified_skill_covers_semantic_hints_and_design_review(self):
        text = (ROOT / "skills" / "mdpr-skill" / "SKILL.md").read_text(encoding="utf-8").lower()

        semantic_terms = [
            "semantic hints",
            "intent",
            "grouping",
            "importance",
            "icon-search keywords",
            "agent-hint.json",
        ]
        review_terms = [
            "design coherence audit",
            "raw hex",
            "mixed radius family",
            "mixed shadow family",
            "mixed spacing scale",
            "mixed type scale",
            "non-editable",
        ]

        missing_semantic = [term for term in semantic_terms if term not in text]
        missing_review = [term for term in review_terms if term not in text]

        self.assertEqual(missing_semantic, [], "unified skill misses semantic hint responsibilities")
        self.assertEqual(missing_review, [], "unified skill misses design review responsibilities")

    def test_unified_skill_forbids_llm_replacement_of_mdpr_validation(self):
        text = (ROOT / "skills" / "mdpr-skill" / "SKILL.md").read_text(encoding="utf-8").lower()

        required_boundary_terms = [
            "overflow",
            "text clipping",
            "overline",
            "coherence",
            "mdpr validation",
            "llm judgment",
            "must not override",
        ]
        missing = [term for term in required_boundary_terms if term not in text]

        self.assertEqual(missing, [], "unified skill must not let LLM review replace MDPR validation gates")

    def test_generator_comparison_doc_is_not_runtime_fallback_policy(self):
        path = ROOT / "docs" / "generator-comparison.md"
        self.assertTrue(path.exists(), "generator comparison doc must exist")
        text = path.read_text(encoding="utf-8").lower()

        required_terms = [
            "pptxgenjs",
            "python-pptx",
            "comparison points only",
            "not dependencies",
            "not fallback renderers",
            "mdpr remains the deterministic runtime",
        ]
        missing = [term for term in required_terms if term not in text]

        self.assertEqual(missing, [], "generator comparison doc must keep external generators out of runtime policy")

    def test_polish_gate_decision_and_mirror_finding_have_distinct_owners(self):
        comparison = (ROOT / "docs" / "mdpr-vs-skill-results.md").read_text(encoding="utf-8")
        visual_row = next(
            line for line in comparison.splitlines()
            if line.startswith("| Visual pass/fail |")
        )
        cells = [cell.strip() for cell in visual_row.strip("|").split("|")]
        self.assertEqual(len(cells), 3)
        mdpr_cell, skill_cell = cells[1], cells[2]

        self.assertIn("validation.polish.requiredFailureCount", mdpr_cell)
        self.assertNotIn("MDPR_POLISH_GATE_FAILED", mdpr_cell)
        self.assertIn("MDPR_POLISH_GATE_FAILED", skill_cell)

        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("`mdpr-skill review` mirrors that", readme)
        self.assertIn('"runtimeOwner": "MDPR"', readme)


if __name__ == "__main__":
    unittest.main()
