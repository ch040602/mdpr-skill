import importlib.util
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


if __name__ == "__main__":
    unittest.main()
