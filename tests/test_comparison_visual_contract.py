from __future__ import annotations

import contextlib
import importlib.util
import io
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pptx import Presentation


ROOT = Path(__file__).resolve().parents[1]


def load_script(name: str, relative_path: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {relative_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class ComparisonVisualContractTests(unittest.TestCase):
    def test_skill_contract_requires_rendered_visual_revalidation_without_synthetic_rules(self) -> None:
        skill = (ROOT / "skills" / "mdpr-skill" / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("automatic title underline", skill)
        self.assertIn("isolated bottom rule", skill)
        self.assertIn("Inspect every exported slide", skill)
        self.assertIn("including list\n  and diagram number badges", skill)

    def test_external_mdpr_checkout_path_can_be_recorded_as_evidence(self) -> None:
        module = load_script("create_mdpr_vs_skill_paths", "scripts/create_mdpr_vs_skill_decks.py")
        sibling = ROOT.parent / "mdpresent-spec-scaffold"
        recorded = module.evidence_path(sibling)

        self.assertEqual(recorded, str(sibling.resolve()))

    def test_source_corpus_keeps_manifest_out_of_slide_content_and_normalizes_numbered_titles(self) -> None:
        module = load_script("create_mdpr_vs_skill_corpus", "scripts/create_mdpr_vs_skill_decks.py")
        topic_paths = [
            "docs/01-architecture.md",
            "docs/03-page-splitting.md",
            "docs/04-layout-rules.md",
            "docs/07-rendering-rules.md",
            "docs/11-qa-overflow.md",
        ]
        summaries = [
            {
                "path": path,
                "title": f"{index:02d}. {Path(path).stem}",
                "headingCount": 1,
                "headings": [f"{index:02d}. Topic"],
                "bullets": ["Evidence"],
                "table": [],
                "code": [],
                "codeLanguage": None,
                "charCount": 100,
            }
            for index, path in enumerate(topic_paths, 1)
        ]
        with tempfile.TemporaryDirectory() as temp_dir:
            module.SOURCE_MD = Path(temp_dir) / "corpus.md"
            module.build_source_corpus(summaries)
            corpus = module.SOURCE_MD.read_text(encoding="utf-8")

        self.assertNotIn("## Source manifest", corpus)
        self.assertNotIn("## Parser and splitting topics", corpus)
        self.assertNotIn("## 01.", corpus)
        self.assertIn("## 01-architecture", corpus)

    def test_skill_evidence_deck_omits_decorative_one_line_regions_and_uses_readable_type(self) -> None:
        module = load_script("create_mdpr_vs_skill_decks", "scripts/create_mdpr_vs_skill_decks.py")
        summaries = [
            {
                "path": "README.md",
                "title": "MDPR",
                "headingCount": 4,
                "headings": ["MDPR", "Boundary"],
                "bullets": ["Deterministic runtime"],
                "hasTable": False,
                "table": [],
                "hasCode": False,
                "codeLanguage": None,
                "code": [],
                "charCount": 400,
            },
            {
                "path": "docs/01-architecture.md",
                "title": "Architecture",
                "headingCount": 3,
                "headings": ["Architecture", "Pipeline"],
                "bullets": ["Parser", "Layout"],
                "hasTable": False,
                "table": [],
                "hasCode": False,
                "codeLanguage": None,
                "code": [],
                "charCount": 300,
            },
            {
                "path": "examples/basic/deck.md",
                "title": "Example",
                "headingCount": 2,
                "headings": ["Example", "Result"],
                "bullets": ["Editable output"],
                "hasTable": False,
                "table": [],
                "hasCode": False,
                "codeLanguage": None,
                "code": [],
                "charCount": 200,
            },
        ]
        mdpr_result = {"slides": 8, "textFrames": 40, "tables": 1, "charts": 1}

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_root = Path(temp_dir)
            output = temp_root / "comparison.pptx"
            copy = temp_root / "comparison-copy.pptx"
            module.ROOT = temp_root
            module.SOURCE_MD = temp_root / "source.md"
            module.BASELINE_PPTX = temp_root / "baseline.pptx"
            module.SKILL_PPTX = output
            module.SKILL_FROM_MDPR_RUN_PPTX = copy
            module.build_skill_deck(summaries, mdpr_result)

            deck = Presentation(output)
            shape_names = {shape.name for slide in deck.slides for shape in slide.shapes}
            forbidden = {
                "subtitle",
                "title_rule",
                "coverage_band",
                "coverage_note",
                "actual_file_note",
                "icon_caption",
                "chart_note_card",
            }
            self.assertTrue(forbidden.isdisjoint(shape_names), sorted(forbidden & shape_names))
            self.assertGreaterEqual(module.validate_pptx(output)["minFontSizePt"], 16)

            pipeline = deck.slides[3]
            for prefix in ("mdpr", "skill"):
                card = next(shape for shape in pipeline.shapes if shape.name == f"{prefix}_card")
                body = [shape for shape in pipeline.shapes if shape.name.startswith(f"{prefix}_body_")]
                self.assertTrue(body)
                self.assertLessEqual(max(shape.top + shape.height for shape in body), card.top + card.height)

            optional_visual = deck.slides[8]
            optional_names = {shape.name for shape in optional_visual.shapes}
            self.assertNotIn("body_panel", optional_names)
            self.assertNotIn("icon_slot", optional_names)

    def test_preview_reset_removes_stale_render_evidence(self) -> None:
        module = load_script("create_mdpr_vs_skill_preview_reset", "scripts/create_mdpr_vs_skill_decks.py")
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            stale = [
                output / "mdpr_baseline_preview_1.png",
                output / "skill_preview_1.png",
            ]
            for path in stale:
                path.write_bytes(b"stale")

            module.clear_preview_files(output)

            self.assertFalse(any(path.exists() for path in stale))

    def test_exported_pngs_are_counted_once_on_case_insensitive_filesystems(self) -> None:
        module = load_script("create_mdpr_vs_skill_png_count", "scripts/create_mdpr_vs_skill_decks.py")
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir)
            (output / "Slide1.PNG").write_bytes(b"png")

            self.assertEqual(module.exported_png_paths(output), [output / "Slide1.PNG"])

    def test_powerpoint_export_uses_one_process_per_slide(self) -> None:
        module = load_script("create_mdpr_vs_skill_slide_export", "scripts/create_mdpr_vs_skill_decks.py")

        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "source.pptx"
            deck = Presentation()
            deck.slides.add_slide(deck.slide_layouts[6])
            deck.slides.add_slide(deck.slide_layouts[6])
            deck.save(source)
            output = root / "export"
            calls: list[tuple[list[str], dict]] = []

            def fake_run(command, **kwargs):
                calls.append((command, kwargs))
                path = Path(command[command.index("-OutputPath") + 1])
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"png")

            with patch.object(module.subprocess, "run", side_effect=fake_run):
                paths = module.export_with_powerpoint(source, output)

            self.assertEqual(paths, [output / "slide-001.png", output / "slide-002.png"])
            self.assertEqual(len(calls), 2)
            commands = [call[0] for call in calls]
            self.assertEqual([call[call.index("-SlideIndex") + 1] for call in commands], ["1", "2"])
            self.assertTrue(all(kwargs["encoding"] == "utf-8" for _, kwargs in calls))
            self.assertTrue(all(kwargs["errors"] == "replace" for _, kwargs in calls))
            helper = (ROOT / "scripts" / "export_pptx_slide_isolated.ps1").read_text(encoding="utf-8")
            self.assertIn("GetWindowThreadProcessId", helper)
            self.assertIn("Wait-Process", helper)
            self.assertIn("Start-Sleep", helper)
            self.assertIn("warmup.png", helper)
            self.assertIn("Remove-Item -LiteralPath $warmupPath", helper)

    def test_powerpoint_export_retries_one_transient_slide_failure(self) -> None:
        module = load_script("create_mdpr_vs_skill_slide_retry", "scripts/create_mdpr_vs_skill_decks.py")
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "source.pptx"
            deck = Presentation()
            deck.slides.add_slide(deck.slide_layouts[6])
            deck.save(source)
            output = root / "export"
            attempts = 0

            def flaky_run(command, **_kwargs):
                nonlocal attempts
                attempts += 1
                if attempts == 1:
                    raise module.subprocess.CalledProcessError(1, command, stderr="transient")
                path = Path(command[command.index("-OutputPath") + 1])
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"png")

            with patch.object(module.subprocess, "run", side_effect=flaky_run):
                paths = module.export_with_powerpoint(source, output)

            self.assertEqual(paths, [output / "slide-001.png"])
            self.assertEqual(attempts, 2)

    def test_comparison_gate_rejects_failed_or_incomplete_current_exports(self) -> None:
        module = load_script("create_mdpr_vs_skill_report_gate", "scripts/create_mdpr_vs_skill_decks.py")
        complete = {
            "sourceFileCount": 20,
            "mdprBaselineValidation": {"slides": 10, "minFontSizePt": 16},
            "skillValidation": {"slides": 9, "minFontSizePt": 16},
            "powerPointExport": {
                "ok": True,
                "baselineSlideCount": 10,
                "skillSlideCount": 9,
                "baselineValidation": {"invalidSlideCount": 0},
                "skillValidation": {"invalidSlideCount": 0},
            },
            "baselineRenderPreview": [{"hasContent": True}] * 4,
            "skillRenderPreview": [{"hasContent": True}] * 4,
        }

        self.assertTrue(module.comparison_report_ok(complete, actual_run_exists=True))
        complete["powerPointExport"]["ok"] = False
        self.assertFalse(module.comparison_report_ok(complete, actual_run_exists=True))
        complete["powerPointExport"]["ok"] = True
        complete["baselineRenderPreview"] = complete["baselineRenderPreview"][:3]
        self.assertFalse(module.comparison_report_ok(complete, actual_run_exists=True))

    def test_comparison_gate_rejects_sub_floor_typography_in_either_deck(self) -> None:
        module = load_script("create_mdpr_vs_skill_font_gate", "scripts/create_mdpr_vs_skill_decks.py")
        complete = {
            "sourceFileCount": 20,
            "mdprBaselineValidation": {"slides": 10, "minFontSizePt": 16},
            "skillValidation": {"slides": 9, "minFontSizePt": 16},
            "powerPointExport": {
                "ok": True,
                "baselineSlideCount": 10,
                "skillSlideCount": 9,
                "baselineValidation": {"invalidSlideCount": 0},
                "skillValidation": {"invalidSlideCount": 0},
            },
            "baselineRenderPreview": [{"hasContent": True}] * 4,
            "skillRenderPreview": [{"hasContent": True}] * 4,
        }

        complete["mdprBaselineValidation"]["minFontSizePt"] = 15.9
        self.assertFalse(module.comparison_report_ok(complete, actual_run_exists=True))
        complete["mdprBaselineValidation"]["minFontSizePt"] = 16
        complete["skillValidation"]["minFontSizePt"] = 15.9
        self.assertFalse(module.comparison_report_ok(complete, actual_run_exists=True))

    def test_comparison_gate_rejects_named_card_content_beyond_its_container(self) -> None:
        module = load_script("create_mdpr_vs_skill_named_container_gate", "scripts/create_mdpr_vs_skill_decks.py")
        complete = {
            "sourceFileCount": 20,
            "mdprBaselineValidation": {"slides": 10, "minFontSizePt": 16},
            "skillValidation": {"slides": 9, "minFontSizePt": 16, "namedContainerOverflowCount": 1},
            "powerPointExport": {
                "ok": True,
                "baselineSlideCount": 10,
                "skillSlideCount": 9,
                "baselineValidation": {"invalidSlideCount": 0},
                "skillValidation": {"invalidSlideCount": 0},
            },
            "baselineRenderPreview": [{"hasContent": True}] * 4,
            "skillRenderPreview": [{"hasContent": True}] * 4,
        }

        self.assertFalse(module.comparison_report_ok(complete, actual_run_exists=True))


class ValidatePackCheckboxContractTests(unittest.TestCase):
    def test_intentional_github_form_checkboxes_are_not_unfinished_project_work(self) -> None:
        module = load_script("validate_pack", "scripts/validate_pack.py")
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            template = root / ".github" / "pull_request_template.md"
            template.parent.mkdir(parents=True)
            template.write_text("- [ ] I ran the tests.\n", encoding="utf-8")
            docs = root / "docs" / "done.md"
            docs.parent.mkdir(parents=True)
            docs.write_text("- [x] complete\n", encoding="utf-8")

            module.ROOT = root
            module.check_no_unchecked_boxes()

    def test_unchecked_boxes_in_governed_docs_still_fail(self) -> None:
        module = load_script("validate_pack_governed", "scripts/validate_pack.py")
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            docs = root / "docs" / "work.md"
            docs.parent.mkdir(parents=True)
            docs.write_text("- [ ] unfinished implementation\n", encoding="utf-8")

            module.ROOT = root
            with contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit):
                    module.check_no_unchecked_boxes()


if __name__ == "__main__":
    unittest.main()
