from pathlib import Path
import importlib.util
import sys
import tempfile
import unittest

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "scripts" / "export_pptx_slide_isolated.ps1"


def load_comparison_script():
    path = ROOT / "scripts" / "create_mdpr_vs_skill_decks.py"
    spec = importlib.util.spec_from_file_location("create_mdpr_vs_skill_decks_visual_export_test", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VisualExportContractTests(unittest.TestCase):
    def test_comparison_export_rejects_a_concurrent_writer_for_the_same_artifacts(self) -> None:
        comparison = load_comparison_script()
        with tempfile.TemporaryDirectory() as tmp:
            lock_path = Path(tmp) / "comparison.lock"
            with comparison.exclusive_run_lock(lock_path):
                with self.assertRaisesRegex(RuntimeError, "already running"):
                    with comparison.exclusive_run_lock(lock_path):
                        self.fail("a second writer must not enter the comparison artifact directory")
            self.assertFalse(lock_path.exists())

    def test_palette_powerpoint_png_is_normalized_to_true_color_without_pixel_drift(self) -> None:
        comparison = load_comparison_script()
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "powerpoint-slide.png"
            palette_image = Image.new("P", (2, 1))
            palette = [247, 242, 234, 17, 17, 17] + [0, 0, 0] * 254
            palette_image.putpalette(palette)
            palette_image.putdata([0, 1])
            expected_pixels = list(palette_image.convert("RGB").getdata())
            palette_image.save(path)

            comparison.normalize_visual_review_png(path)

            with Image.open(path) as normalized:
                self.assertEqual(normalized.mode, "RGB")
                self.assertEqual(list(normalized.getdata()), expected_pixels)

    def test_powerpoint_window_handle_is_optional_for_export(self) -> None:
        script = HELPER.read_text(encoding="utf-8")

        self.assertIn("$windowHandle = $app.HWND", script)
        self.assertIn("if ($null -ne $windowHandle -and [Int64]$windowHandle -ne 0)", script)
        self.assertNotIn("[IntPtr]$app.HWND", script)
        self.assertIn("PowerPoint did not create $OutputPath", script)


if __name__ == "__main__":
    unittest.main()
