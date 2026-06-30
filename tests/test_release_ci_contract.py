from pathlib import Path
import json
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReleaseCiContractTest(unittest.TestCase):
    def test_package_metadata_supports_npm_provenance(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        npm_install_smoke_text = (ROOT / "tests" / "npm-install-smoke.test.ts").read_text(encoding="utf-8")

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
        self.assertIn("test:npm-install-smoke", package_json["scripts"])
        self.assertIn("audit:security", package_json["scripts"])
        self.assertIn("npm audit --audit-level=moderate", package_json["scripts"]["audit:security"])
        self.assertIn("release:preflight", package_json["scripts"])
        self.assertIn("npm run test:ci", package_json["scripts"]["release:preflight"])
        self.assertIn("npm run audit:security", package_json["scripts"]["release:preflight"])
        self.assertIn("npm run pack:dry-run", package_json["scripts"]["release:preflight"])
        self.assertEqual(package_json["scripts"]["prepublishOnly"], "npm run release:preflight")
        self.assertIn("npm run test:npm-install-smoke", package_json["scripts"]["test:ci"])
        self.assertIn("mdpr-agent-hint-v1", npm_install_smoke_text)
        self.assertIn("agent-hint.json", npm_install_smoke_text)
        self.assertIn("npm_config_dry_run", npm_install_smoke_text)

    def test_package_exposes_cli_bin_for_npm_install(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        bin_path = package_json["bin"]["mdpr-skill"]
        bin_file = ROOT / bin_path

        self.assertEqual(bin_path, "bin/mdpr-skill.js")
        self.assertTrue(bin_file.exists(), "CLI bin target must be included in the package")
        self.assertTrue(bin_file.read_text(encoding="utf-8").startswith("#!/usr/bin/env node"))
        self.assertIn("bin", package_json["files"])

    def test_package_has_root_mit_license_file(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        license_path = ROOT / "LICENSE"

        self.assertEqual(package_json["license"], "MIT")
        self.assertTrue(license_path.exists(), "public npm packages should include a root LICENSE file")
        license_text = license_path.read_text(encoding="utf-8")
        self.assertIn("MIT License", license_text)
        self.assertIn("Copyright (c)", license_text)
        self.assertIn("Permission is hereby granted", license_text)

    def test_cli_runtime_uses_compiled_dist_without_tsx_dependency(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        package_lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
        bin_text = (ROOT / package_json["bin"]["mdpr-skill"]).read_text(encoding="utf-8")
        build_config = ROOT / "tsconfig.build.json"

        self.assertEqual(package_json["type"], "module")
        self.assertEqual(package_json["main"], "./dist/packages/cli/src/index.js")
        self.assertEqual(package_json["types"], "./dist/packages/cli/src/index.d.ts")
        self.assertEqual(package_json["exports"]["."], {
            "types": "./dist/packages/cli/src/index.d.ts",
            "default": "./dist/packages/cli/src/index.js",
        })
        self.assertEqual(package_json["exports"]["./package.json"], "./package.json")
        self.assertIn("dist", package_json["files"])
        self.assertIn("docs/**/*.md", package_json["files"])
        self.assertIn("docs/**/*.json", package_json["files"])
        self.assertIn("!docs/assets/**", package_json["files"])
        self.assertNotIn("packages", package_json["files"])
        self.assertIn("build", package_json["scripts"])
        self.assertIn("npm run build", package_json["scripts"]["prepack"])
        self.assertTrue(build_config.exists(), "compiled npm package should have a dedicated build tsconfig")
        build_text = build_config.read_text(encoding="utf-8")
        self.assertIn('"outDir": "dist"', build_text)
        self.assertIn('"declaration": true', build_text)

        self.assertIn('"dist", "packages", "cli", "src", "main.js"', bin_text)
        self.assertNotIn("--import", bin_text)
        self.assertNotIn("tsx", bin_text)
        self.assertNotIn("tsx", package_json.get("dependencies", {}))
        self.assertIn("tsx", package_json.get("devDependencies", {}))
        self.assertNotIn("tsx", package_lock["packages"][""].get("dependencies", {}))
        self.assertIn("tsx", package_lock["packages"][""].get("devDependencies", {}))

    def test_package_declares_supported_node_runtime(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        package_lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
        ci_text = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        release_text = (ROOT / ".github" / "workflows" / "release.yml").read_text(encoding="utf-8")
        readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")

        self.assertEqual(package_json["engines"]["node"], ">=22")
        self.assertEqual(package_lock["packages"][""]["engines"]["node"], ">=22")
        self.assertIn("22.x", ci_text)
        self.assertIn("24.x", ci_text)
        self.assertIn("24.x", release_text)
        self.assertIn("Node.js 22+", readme_text)
        self.assertIn("Node.js 22+", checklist_text)

    def test_docs_explain_published_npm_consumer_install_path(self):
        readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
        install_text = (ROOT / "docs" / "mdpr-installation.md").read_text(encoding="utf-8")

        for text in (readme_text, install_text):
            self.assertIn("npm install -g mdpr-skill", text)
            self.assertIn("npx mdpr-skill --help", text)
            self.assertIn("After the package is published to npm", text)

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
        self.assertIn("os:", ci_text)
        self.assertIn("ubuntu-latest", ci_text)
        self.assertIn("windows-latest", ci_text)
        self.assertIn("runs-on: ${{ matrix.os }}", ci_text)

        self.assertIn("release:\n    types: [published]", release_text)
        self.assertIn("id-token: write", release_text)
        self.assertIn("contents: read", release_text)
        self.assertIn("registry-url: https://registry.npmjs.org", release_text)
        self.assertIn("npm run release:preflight", release_text)
        self.assertIn("Validate release tag matches package version", release_text)
        self.assertIn("RELEASE_TAG: ${{ github.event.release.tag_name }}", release_text)
        self.assertIn("v${pkg.version}", release_text)
        self.assertIn("npm publish --provenance --access public", release_text)
        self.assertIn("if: ${{ github.event_name == 'release' }}", release_text)
        self.assertNotIn("|| inputs.dry_run == 'false'", release_text)
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

    def test_public_security_governance_is_configured(self):
        security = ROOT / "SECURITY.md"
        dependabot = ROOT / ".github" / "dependabot.yml"
        codeql = ROOT / ".github" / "workflows" / "codeql.yml"
        scorecard = ROOT / ".github" / "workflows" / "scorecard.yml"
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")

        self.assertTrue(security.exists(), "public repositories should define SECURITY.md")
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        self.assertIn("SECURITY.md", package_json["files"])
        self.assertIn("SECURITY.md", (ROOT / "README.md").read_text(encoding="utf-8"))
        security_text = security.read_text(encoding="utf-8")
        self.assertIn("Supported Versions", security_text)
        self.assertIn("Reporting a Vulnerability", security_text)
        self.assertIn("Do not report security vulnerabilities through public GitHub issues", security_text)
        self.assertIn("GitHub private vulnerability reporting", security_text)

        self.assertTrue(dependabot.exists(), "public repositories should configure Dependabot")
        dependabot_text = dependabot.read_text(encoding="utf-8")
        self.assertIn("version: 2", dependabot_text)
        self.assertIn('package-ecosystem: "npm"', dependabot_text)
        self.assertIn('package-ecosystem: "github-actions"', dependabot_text)
        self.assertIn("interval: weekly", dependabot_text)

        self.assertTrue(codeql.exists(), "public repositories should run CodeQL scanning")
        codeql_text = codeql.read_text(encoding="utf-8")
        self.assertIn("github/codeql-action/init@v4", codeql_text)
        self.assertIn("github/codeql-action/analyze@v4", codeql_text)
        self.assertIn("security-events: write", codeql_text)
        self.assertIn("javascript-typescript", codeql_text)
        self.assertIn("python", codeql_text)
        self.assertIn("schedule:", codeql_text)

        self.assertTrue(scorecard.exists(), "public repositories should run OpenSSF Scorecard")
        scorecard_text = scorecard.read_text(encoding="utf-8")
        workflow_permissions = scorecard_text.split("jobs:", 1)[0]
        self.assertRegex(scorecard_text, r"ossf/scorecard-action@v\d+\.\d+\.\d+")
        self.assertIn("github/codeql-action/upload-sarif@v4", scorecard_text)
        self.assertIn("permissions: read-all", workflow_permissions)
        self.assertNotIn("security-events: write", workflow_permissions)
        self.assertNotIn("id-token: write", workflow_permissions)
        self.assertIn("contents: read", scorecard_text)
        self.assertIn("actions: read", scorecard_text)
        self.assertIn("security-events: write", scorecard_text)
        self.assertIn("id-token: write", scorecard_text)
        self.assertIn("results_format: sarif", scorecard_text)
        self.assertIn("publish_results: true", scorecard_text)

        self.assertIn("SECURITY.md", checklist_text)
        self.assertIn("Dependabot", checklist_text)
        self.assertIn("CodeQL", checklist_text)
        self.assertIn("OpenSSF Scorecard", checklist_text)

    def test_public_community_and_release_health_files_are_configured(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")
        changelog = ROOT / "CHANGELOG.md"
        conduct = ROOT / "CODE_OF_CONDUCT.md"

        self.assertTrue(changelog.exists(), "public release candidates should document user-visible changes")
        changelog_text = changelog.read_text(encoding="utf-8")
        self.assertIn("# Changelog", changelog_text)
        self.assertIn("## 0.1.0 - Unreleased", changelog_text)
        self.assertIn("release:preflight", changelog_text)
        self.assertIn("SECURITY.md", changelog_text)
        self.assertIn("npm publish", changelog_text)

        self.assertTrue(conduct.exists(), "public repositories should define collaboration standards")
        conduct_text = conduct.read_text(encoding="utf-8")
        self.assertIn("# Code of Conduct", conduct_text)
        self.assertIn("Our Pledge", conduct_text)
        self.assertIn("Our Standards", conduct_text)
        self.assertIn("Enforcement", conduct_text)

        self.assertIn("CHANGELOG.md", readme_text)
        self.assertIn("CODE_OF_CONDUCT.md", readme_text)
        self.assertIn("CHANGELOG.md", package_json["files"])
        self.assertIn("CODE_OF_CONDUCT.md", package_json["files"])

        self.assertEqual(package_json["devEngines"]["runtime"], {
            "name": "node",
            "version": ">=22",
            "onFail": "error",
        })
        self.assertEqual(package_json["devEngines"]["packageManager"], {
            "name": "npm",
            "version": ">=10",
            "onFail": "error",
        })

        self.assertIn("CHANGELOG.md", checklist_text)
        self.assertIn("CODE_OF_CONDUCT.md", checklist_text)
        self.assertIn("devEngines", checklist_text)

    def test_public_support_policy_guides_users_to_right_channels(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")
        issue_config_text = (ROOT / ".github" / "ISSUE_TEMPLATE" / "config.yml").read_text(encoding="utf-8")
        support = ROOT / "SUPPORT.md"

        self.assertTrue(support.exists(), "public repositories should route support requests")
        support_text = support.read_text(encoding="utf-8")
        self.assertIn("# Support", support_text)
        for expected in (
            "mdpr-skill",
            "MDPR runtime",
            "Security",
            "Bug reports",
            "Feature requests",
            "Before Opening an Issue",
            "Node.js",
            "npm",
            "npx mdpr-skill --help",
            "https://github.com/ch040602/MdPr/issues/new/choose",
        ):
            self.assertIn(expected, support_text)

        self.assertIn("SUPPORT.md", readme_text)
        self.assertIn("SUPPORT.md", package_json["files"])
        self.assertIn("SUPPORT.md", checklist_text)
        self.assertIn("support policy", checklist_text)
        self.assertIn("MDPR runtime issue", issue_config_text)

    def test_public_issue_and_pr_templates_are_configured(self):
        issue_template_dir = ROOT / ".github" / "ISSUE_TEMPLATE"
        bug_report = issue_template_dir / "bug_report.yml"
        feature_request = issue_template_dir / "feature_request.yml"
        config = issue_template_dir / "config.yml"
        pr_template = ROOT / ".github" / "pull_request_template.md"
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")

        self.assertTrue(bug_report.exists(), "public repositories should have a general bug issue form")
        bug_text = bug_report.read_text(encoding="utf-8")
        self.assertIn("name: Bug Report", bug_text)
        self.assertIn("description: Report a reproducible mdpr-skill problem", bug_text)
        self.assertIn("type: bug", bug_text)
        for field in (
            "id: affected-area",
            "id: version",
            "id: reproduction",
            "id: expected",
            "id: actual",
            "id: validation",
            "id: code-of-conduct",
        ):
            self.assertIn(field, bug_text)
        self.assertIn("SECURITY.md", bug_text)
        self.assertIn("required: true", bug_text)

        self.assertTrue(feature_request.exists(), "public repositories should have a general feature issue form")
        feature_text = feature_request.read_text(encoding="utf-8")
        self.assertIn("name: Feature Request", feature_text)
        self.assertIn("description: Propose a user-visible mdpr-skill improvement", feature_text)
        self.assertIn("type: feature", feature_text)
        for field in (
            "id: problem",
            "id: proposal",
            "id: boundary",
            "id: alternatives",
            "id: validation",
            "id: code-of-conduct",
        ):
            self.assertIn(field, feature_text)

        self.assertTrue(config.exists(), "public repositories should configure the issue template chooser")
        config_text = config.read_text(encoding="utf-8")
        self.assertIn("blank_issues_enabled: false", config_text)
        self.assertIn("contact_links:", config_text)
        self.assertIn("Security vulnerability", config_text)
        self.assertIn("SECURITY.md", config_text)

        self.assertTrue(pr_template.exists(), "public repositories should have a PR template")
        pr_text = pr_template.read_text(encoding="utf-8")
        for section in (
            "## Summary",
            "## Boundary Check",
            "## Validation",
            "## Release Impact",
            "## Reviewer Notes",
        ):
            self.assertIn(section, pr_text)
        self.assertIn("- [ ]", pr_text)
        self.assertNotIn("- [x]", pr_text)
        self.assertIn("CHANGELOG.md", pr_text)
        self.assertIn("SECURITY.md", pr_text)

        self.assertIn(".github/ISSUE_TEMPLATE", checklist_text)
        self.assertIn("pull_request_template.md", checklist_text)

    def test_release_notes_are_configured_for_github_release_body(self):
        release_config = ROOT / ".github" / "release.yml"
        release_notes = ROOT / "docs" / "release-notes.md"
        changelog_text = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")

        self.assertTrue(release_config.exists(), "GitHub releases should have generated release notes config")
        release_config_text = release_config.read_text(encoding="utf-8")
        self.assertIn("changelog:", release_config_text)
        self.assertIn("exclude:", release_config_text)
        self.assertIn("labels:", release_config_text)
        self.assertIn("ignore-for-release", release_config_text)
        self.assertIn("dependencies", release_config_text)
        for title in (
            "Breaking Changes",
            "Features",
            "Fixes",
            "Documentation",
            "Security",
            "Dependencies",
            "Other Changes",
        ):
            self.assertIn(f"title: {title}", release_config_text)
        self.assertIn("- \"*\"", release_config_text)

        self.assertTrue(release_notes.exists(), "packaged release notes should exist")
        release_notes_text = release_notes.read_text(encoding="utf-8")
        self.assertIn("# Release Notes", release_notes_text)
        self.assertIn("CHANGELOG.md", release_notes_text)
        self.assertIn("0.1.0", release_notes_text)
        self.assertIn("release:preflight", release_notes_text)
        self.assertIn("npm publish --provenance --access public", release_notes_text)
        self.assertIn("Trusted Publisher", release_notes_text)
        self.assertIn("E404", release_notes_text)
        self.assertIn("GitHub Release", release_notes_text)
        self.assertIn(".github/release.yml", release_notes_text)
        self.assertIn("Initial public npm release candidate", changelog_text)

        self.assertIn(".github/release.yml", checklist_text)
        self.assertIn("docs/release-notes.md", checklist_text)

    def test_github_label_taxonomy_documents_issue_and_release_labels(self):
        labels_doc = ROOT / "docs" / "github-labels.md"
        release_config_text = (ROOT / ".github" / "release.yml").read_text(encoding="utf-8")
        bug_text = (ROOT / ".github" / "ISSUE_TEMPLATE" / "bug_report.yml").read_text(encoding="utf-8")
        feature_text = (ROOT / ".github" / "ISSUE_TEMPLATE" / "feature_request.yml").read_text(encoding="utf-8")
        checklist_text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")
        contributing_text = (ROOT / "CONTRIBUTING.md").read_text(encoding="utf-8")

        self.assertTrue(labels_doc.exists(), "labels referenced by issue and release configs should be documented")
        labels_text = labels_doc.read_text(encoding="utf-8")
        for heading in (
            "# GitHub Labels",
            "Issue Intake Labels",
            "Release Note Labels",
            "Labels to Create Before First Publish",
            "gh label create",
        ):
            self.assertIn(heading, labels_text)

        for label in (
            "triage",
            "type: bug",
            "type: feature",
            "ignore-for-release",
            "duplicate",
            "invalid",
            "question",
            "breaking-change",
            "Semver-Major",
            "enhancement",
            "feature",
            "bug",
            "fix",
            "documentation",
            "docs",
            "security",
            "dependencies",
        ):
            self.assertIn(f"`{label}`", labels_text)

        self.assertIn('labels: ["type: bug", "triage"]', bug_text)
        self.assertIn('labels: ["type: feature", "triage"]', feature_text)
        self.assertIn("type: bug", release_config_text)
        self.assertIn("type: feature", release_config_text)
        self.assertIn("ignore-for-release", release_config_text)
        self.assertIn("docs/github-labels.md", checklist_text)
        self.assertIn("docs/github-labels.md", contributing_text)

    def test_public_tree_hides_private_benchmark_and_internal_sequence(self):
        blocked_terms = [
            "figure" + "labs",
            "figure" + " " + "labs",
            "applied" + "-development" + "-comparison",
            "development" + "-mode" + "-comparison",
            "simple" + "-codex" + "-skill",
            "mdpr" + "-only",
            "mdpr" + "-skill" + "-plus" + "-mdpr",
            "46" + "-slide MDPR corpus",
            "10" + "-slide mdpr-skill evidence deck",
        ]
        tracked_output = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            capture_output=True,
            check=True,
        ).stdout
        tracked_files = [
            item.decode("utf-8", errors="surrogateescape")
            for item in tracked_output.split(b"\0")
            if item
        ]
        visible_hits = []

        for relative_path in tracked_files:
            path = ROOT / relative_path
            if not path.exists():
                continue
            normalized_path = relative_path.lower()
            for term in blocked_terms:
                if term.lower() in normalized_path:
                    visible_hits.append(f"{relative_path}: path contains {term}")
            if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".pdf", ".pptx"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            normalized = text.lower()
            for term in blocked_terms:
                if term.lower() in normalized:
                    visible_hits.append(f"{relative_path}: {term}")

        self.assertEqual(visible_hits, [])

    def test_readme_comparison_image_is_committed(self):
        readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
        comparison_image = ROOT / "docs" / "assets" / "mdpr-mode-comparison.png"

        self.assertIn("docs/assets/mdpr-mode-comparison.png", readme_text)
        self.assertIn("Codex $presentations", readme_text)
        self.assertIn("MDPR", readme_text)
        self.assertIn("mdpr-skill + MDPR", readme_text)
        self.assertNotIn("| " + "Workflow" + " |", readme_text)
        self.assertNotIn("What it is " + "best at", readme_text)
        self.assertNotIn("Practical " + "limit", readme_text)
        self.assertNotIn("Plain " + "Codex " + "advice", readme_text)
        self.assertNotIn("Evidence " + "source", readme_text)
        self.assertTrue(comparison_image.exists(), "README comparison image should be committed")
        self.assertGreater(comparison_image.stat().st_size, 10_000)

    def test_release_checklist_records_external_trusted_publisher_step(self):
        text = (ROOT / "docs" / "release-checklist.md").read_text(encoding="utf-8")

        self.assertIn("npm Trusted Publisher", text)
        self.assertIn("release.yml", text)
        self.assertIn("release:preflight", text)
        self.assertIn("npm run test:ci", text)
        self.assertIn("npm run audit:security", text)
        self.assertIn("npm run pack:dry-run", text)
        self.assertIn("consumer-install smoke", text)
        self.assertIn("agent-hint.json", text)
        self.assertIn("root LICENSE file", text)
        self.assertIn("compiled `dist`", text)
        self.assertIn("without runtime `tsx`", text)
        self.assertIn("excludes heavy `docs/assets`", text)
        self.assertIn("tag matches `package.json` version", text)
        self.assertIn("E404", text)
        self.assertIn("Signed provenance statement", text)
        self.assertIn("package ownership", text)


if __name__ == "__main__":
    unittest.main()
