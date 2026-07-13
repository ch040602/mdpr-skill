from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "scripts" / "export_pptx_slide_isolated.ps1"


class VisualExportContractTests(unittest.TestCase):
    def test_powerpoint_window_handle_is_optional_for_export(self) -> None:
        script = HELPER.read_text(encoding="utf-8")

        self.assertIn("$windowHandle = $app.HWND", script)
        self.assertIn("if ($null -ne $windowHandle -and [Int64]$windowHandle -ne 0)", script)
        self.assertNotIn("[IntPtr]$app.HWND", script)
        self.assertIn("PowerPoint did not create $OutputPath", script)


if __name__ == "__main__":
    unittest.main()
