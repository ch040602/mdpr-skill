import importlib.util
import json
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "run_external_markdown_visual_eval.py"


def load_eval_module():
    spec = importlib.util.spec_from_file_location("external_md_eval", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class ExternalMarkdownVisualEvalTests(unittest.TestCase):
    def test_layout_composition_flags_repeated_card_sequences(self):
        module = load_eval_module()
        plan = {
            "slides": [
                {"layout": {"preset": "cover"}, "regions": [{"role": "title", "typography": {"fontSize": 48}}]},
                {"layout": {"preset": "grid"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "item", "typography": {"fontSize": 22}}]},
                {"layout": {"preset": "grid"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "item", "typography": {"fontSize": 22}}]},
                {"layout": {"preset": "vertical-list"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "item", "typography": {"fontSize": 22}}]},
                {"layout": {"preset": "grid"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "item", "typography": {"fontSize": 22}}]},
            ]
        }

        result = module.analyze_layout_composition(plan)

        self.assertFalse(result["ok"])
        self.assertIn("repeated card-heavy", " ".join(result["issues"]))
        self.assertGreaterEqual(result["cardHeavyRatio"], 0.6)

    def test_layout_composition_accepts_diverse_hierarchical_decks(self):
        module = load_eval_module()
        plan = {
            "slides": [
                {"layout": {"preset": "cover"}, "regions": [{"role": "title", "typography": {"fontSize": 52}}]},
                {"layout": {"preset": "key-message"}, "regions": [{"role": "title", "typography": {"fontSize": 36}}, {"role": "body", "typography": {"fontSize": 34}}]},
                {"layout": {"preset": "chart-table"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "chart", "typography": {"fontSize": 18}}, {"role": "table", "typography": {"fontSize": 18}}]},
                {"layout": {"preset": "pipeline"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "diagram", "typography": {"fontSize": 22}}]},
                {"layout": {"preset": "comparison"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "body", "typography": {"fontSize": 22}}]},
                {"layout": {"preset": "table-focus"}, "regions": [{"role": "title", "typography": {"fontSize": 34}}, {"role": "table", "typography": {"fontSize": 18}}]},
            ]
        }

        result = module.analyze_layout_composition(plan)

        self.assertTrue(result["ok"])
        self.assertGreaterEqual(result["layoutFamilyCount"], 5)
        self.assertEqual(result["scaleHierarchyViolations"], [])

    def test_source_title_prefers_stable_hint_over_readme_subsections(self):
        module = load_eval_module()

        self.assertEqual(
            module.select_source_title("# if you are updating an existing checkout\n\nBody", "PyTorch"),
            "PyTorch",
        )
        self.assertEqual(
            module.select_source_title("# venv\n\nInstall notes", "Transformers"),
            "Transformers",
        )

    def test_visual_battle_contract_requires_five_iterations_and_twenty_criteria(self):
        module = load_eval_module()

        self.assertGreaterEqual(module.ITERATIONS, 5)
        self.assertGreaterEqual(module.MIN_SOURCE_COUNT, 20)
        self.assertGreaterEqual(len(module.VISUAL_QUALITY_CRITERIA), 20)
        self.assertIn("coherence", module.VISUAL_QUALITY_CRITERIA)
        self.assertIn("visual guidance", module.VISUAL_QUALITY_CRITERIA)
        self.assertIn("pretty", module.VISUAL_QUALITY_CRITERIA)
        self.assertIn("readability", module.VISUAL_QUALITY_CRITERIA)

    def test_codex_ppt_reference_project_uses_image_only_slide_contract(self):
        module = load_eval_module()
        report = module.describe_codex_ppt_baseline_contract("iteration-05")

        self.assertEqual(report["generator"], "codex-ppt-skill")
        self.assertEqual(report["outputModel"], "image-only PPTX")
        self.assertIn("origin_image/slide_XX.png", report["contract"])
        self.assertTrue(report["editableTextExpected"] is False)
        self.assertTrue(report["assemblyScript"].endswith("assemble_ppt.py"))

    def test_presentations_reference_contract_distinguishes_script_and_runtime(self):
        module = load_eval_module()
        report = module.describe_presentations_reference_contract()

        self.assertEqual(report["generator"], "Presentations skill")
        self.assertIn("comeback rubric", report["contract"])
        self.assertIn("scriptAvailable", report)
        self.assertIn("artifactToolRuntimeAvailable", report)
        self.assertIn("runnable", report)

    def test_presentations_probe_battle_requires_twenty_artifact_tool_outputs(self):
        module = load_eval_module()
        report = module.describe_presentations_reference_contract()
        probe = report["probeBattle"]

        self.assertIsNotNone(probe)
        self.assertTrue(probe["ok"])
        self.assertGreaterEqual(probe["promptCount"], 20)
        self.assertEqual(probe["pptxCount"], probe["promptCount"])
        self.assertEqual(probe["contactSheetCount"], probe["promptCount"])
        self.assertEqual(probe["firstSlideImageCount"], probe["promptCount"])
        self.assertEqual(probe["proofSlideImageCount"], probe["promptCount"])
        self.assertGreaterEqual(probe["minScore"], 40)
        self.assertGreaterEqual(len(probe["aggregateContactSheets"]), 2)

    def test_dominance_ledger_requires_source_level_image_evidence_and_reference_deltas(self):
        module = load_eval_module()
        records = [
            {"slug": f"source-{index:02d}", "title": f"Source {index:02d}", "url": f"https://example.test/{index}", "chars": 1000}
            for index in range(1, 22)
        ]
        final_report = {
            "iteration": 5,
            "pptx": "artifacts/external-markdown-visual-eval/iteration-05/build/deck.pptx",
            "contactSheet": {"file": "artifacts/external-markdown-visual-eval/iteration-05/contact-sheet.png"},
            "slideCount": 41,
            "visualCriteriaScores": {
                "scores": {criterion: 5 for criterion in module.VISUAL_QUALITY_CRITERIA},
                "minimumScore": 5,
                "averageScore": 5,
                "scoreCount": len(module.VISUAL_QUALITY_CRITERIA),
            },
            "codexPptBaseline": {
                "ok": True,
                "pptx": "artifacts/external-markdown-visual-eval/iteration-05/codex-ppt-baseline/final.pptx",
                "editableTextExpected": False,
            },
            "presentationsReference": module.describe_presentations_reference_contract(),
        }

        ledger = module.build_dominance_comparison_ledger(records, final_report)

        self.assertTrue(ledger["ok"])
        self.assertGreaterEqual(ledger["comparisonCount"], 20)
        self.assertEqual(ledger["criteriaCount"], len(module.VISUAL_QUALITY_CRITERIA))
        self.assertIn("codex-ppt-image-only", ledger["referenceFamilies"])
        self.assertIn("Presentations-comeback-rubric", ledger["referenceFamilies"])
        self.assertGreaterEqual(ledger["finalMdprSuperiority"]["minimumCriteriaScore"], 4)
        self.assertGreaterEqual(ledger["finalMdprSuperiority"]["wonDimensions"], 6)
        first = ledger["entries"][0]
        self.assertIn("pageImageEvidence", first)
        self.assertTrue(first["pageImageEvidence"].endswith("slide-01.png"))
        self.assertIn("native editability", first["wins"])
        self.assertIn("image-only baseline delta", first["wins"])
        self.assertIn("presentations comeback-rubric alignment", first["wins"])

    def test_request_completion_ledger_ties_full_user_request_to_artifacts(self):
        module = load_eval_module()
        report_path = ROOT / "artifacts" / "external-markdown-visual-eval" / "external-markdown-visual-eval-report.json"
        self.assertTrue(report_path.is_file())
        summary = json.loads(report_path.read_text(encoding="utf-8"))

        ledger = module.build_request_completion_ledger(summary)

        self.assertTrue(ledger["ok"])
        self.assertTrue(all(ledger["checks"].values()))
        self.assertEqual(ledger["compatibilityCoverage"]["unmappedFeatureCount"], 0)
        self.assertEqual(ledger["compatibilityCoverage"]["mdprRuntimeRequiredCount"], 0)
        self.assertGreaterEqual(ledger["comparisonDataset"]["sourceCount"], 20)
        self.assertGreaterEqual(ledger["comparisonDataset"]["iterations"], 5)
        self.assertGreaterEqual(ledger["comparisonDataset"]["visualQualityCriteriaCount"], 20)
        self.assertGreaterEqual(ledger["presentationsProbeBattle"]["promptCount"], 20)
        self.assertGreaterEqual(ledger["codexPptBaselineCount"], 5)
        for dimension in ["coherence", "visual guidance", "pretty", "readability"]:
            self.assertIn(dimension, ledger["superiority"]["wonDimensions"])
        self.assertEqual(ledger["missingEvidenceArtifacts"], [])

    def test_request_completion_ledger_normalizes_windows_artifact_paths_for_ci(self):
        module = load_eval_module()
        report_path = ROOT / "artifacts" / "external-markdown-visual-eval" / "external-markdown-visual-eval-report.json"
        summary = json.loads(report_path.read_text(encoding="utf-8"))

        summary["dominanceComparisonLedgerPath"] = summary["dominanceComparisonLedgerPath"].replace("/", "\\")
        summary["finalPptx"] = summary["finalPptx"].replace("/", "\\")
        summary["finalContactSheet"] = summary["finalContactSheet"].replace("/", "\\")
        probe = summary["presentationsReference"]["probeBattle"]
        probe["manifest"] = probe["manifest"].replace("/", "\\")
        probe["aggregateContactSheets"] = [path.replace("/", "\\") for path in probe["aggregateContactSheets"]]
        for report in summary["iterationReports"]:
            report["codexPptPptx"] = report["codexPptPptx"].replace("/", "\\")

        ledger = module.build_request_completion_ledger(summary)

        self.assertTrue(ledger["ok"])
        self.assertEqual(ledger["missingEvidenceArtifacts"], [])
        self.assertTrue(all("\\" not in path for path in ledger["evidenceArtifacts"]))


if __name__ == "__main__":
    unittest.main()
