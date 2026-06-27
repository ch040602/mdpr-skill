from pathlib import Path
import json
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReleaseCiContractTest(unittest.TestCase):
    def test_package_metadata_supports_npm_provenance(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

        self.assertEqual(package_json["name"], "mdpr-skill")
        self.assertEqual(package_json["repository"]["type"], "git")
        self.assertEqual(
            package_json["repository"]["url"],
            "git+https://github.com/ch040602/mdpr-skill.git",
        )
        self.assertEqual(package_json["bugs"]["url"], "https://github.com/ch040602/mdpr-skill/issues")
        self.assertEqual(package_json["homepage"], "https://github.com/ch040602/mdpr-skill#readme")
        self.assertEqual(package_json["publishConfig"]["access"], "public")
        self.assertEqual(package_json["publishConfig"]["registry"], "https://registry.npmjs.org/")
        self.assertIn("test:ci", package_json["scripts"])
        self.assertIn("pack:dry-run", package_json["scripts"])

    def test_package_exposes_cli_bin_for_npm_install(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        bin_path = package_json["bin"]["mdpr-skill"]
        bin_file = ROOT / bin_path

        self.assertEqual(bin_path, "bin/mdpr-skill.js")
        self.assertTrue(bin_file.exists(), "CLI bin target must be included in the package")
        self.assertTrue(bin_file.read_text(encoding="utf-8").startswith("#!/usr/bin/env node"))
        self.assertIn("bin", package_json["files"])

    def test_ci_and_release_workflows_exist_with_least_privilege_publish(self):
        ci = ROOT / ".github" / "workflows" / "ci.yml"
        release = ROOT / ".github" / "workflows" / "release.yml"

        self.assertTrue(ci.exists(), "CI workflow must exist")
        self.assertTrue(release.exists(), "release workflow must exist")

        ci_text = ci.read_text(encoding="utf-8")
        release_text = release.read_text(encoding="utf-8")

        self.assertIn("npm ci", ci_text)
        self.assertIn("npm run test:ci", ci_text)
        self.assertIn("permissions:\n  contents: read", ci_text)

        self.assertIn("release:\n    types: [published]", release_text)
        self.assertIn("id-token: write", release_text)
        self.assertIn("contents: read", release_text)
        self.assertIn("registry-url: https://registry.npmjs.org", release_text)
        self.assertIn("npm run test:ci", release_text)
        self.assertIn("npm run pack:dry-run", release_text)
        self.assertIn("npm publish --provenance --access public", release_text)
        self.assertNotIn("NPM_TOKEN", release_text)

    def test_ci_installs_python_test_dependencies(self):
        requirements = ROOT / "requirements-ci.txt"
        ci_text = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        release_text = (ROOT / ".github" / "workflows" / "release.yml").read_text(encoding="utf-8")

        self.assertTrue(requirements.exists(), "CI Python test requirements must be explicit")
        requirements_text = requirements.read_text(encoding="utf-8")
        self.assertIn("Pillow", requirements_text)
        self.assertIn("python -m pip install -r requirements-ci.txt", ci_text)
        self.assertIn("python -m pip install -r requirements-ci.txt", release_text)

    def test_release_checklist_records_external_trusted_publisher_step(self):
        text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")

        self.assertIn("npm Trusted Publisher", text)
        self.assertIn("release.yml", text)
        self.assertIn("npm run test:ci", text)
        self.assertIn("npm run pack:dry-run", text)


if __name__ == "__main__":
    unittest.main()
