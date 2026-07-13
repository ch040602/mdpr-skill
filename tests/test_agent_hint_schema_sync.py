from pathlib import Path
import hashlib
import json
import re
import unittest
import subprocess


ROOT = Path(__file__).resolve().parents[1]
SYNC_EVIDENCE = ROOT / "artifacts" / "pro-review" / "mdpr-skill-runtime-sync-review-20260713.json"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class AgentHintSchemaSyncTests(unittest.TestCase):
    def test_mdpr_skill_agent_hint_schema_matches_mdpr_source_of_truth(self):
        local_schema = ROOT / "schemas" / "agent-hint.schema.json"
        mdpr_schema = ROOT / ".cache" / "mdpr" / "schemas" / "agent-hint.schema.json"

        self.assertTrue(local_schema.exists(), "mdpr-skill agent hint schema is missing")
        self.assertTrue(mdpr_schema.exists(), "MDPR checkout schema is missing; run npm run install:mdpr")
        self.assertEqual(
            local_schema.read_text(encoding="utf-8"),
            mdpr_schema.read_text(encoding="utf-8"),
            "mdpr-skill agent-hint.schema.json must stay a synced copy of MDPR's schema",
        )

    def test_runtime_schema_sync_evidence_is_bound_to_current_schema_hashes(self):
        self.assertTrue(SYNC_EVIDENCE.exists(), "current schema sync evidence artifact is missing")
        artifact = json.loads(SYNC_EVIDENCE.read_text(encoding="utf-8"))
        self.assertEqual(artifact["schemaVersion"], "mdpr-skill-runtime-sync-evidence-v2")
        self.assertRegex(artifact["created_at"], r"^2026-07-13T")
        self.assertEqual(artifact["schemaSync"]["status"], "pass")
        self.assertEqual(artifact["schemaSync"]["findings"], [])

        mdpr_path = Path(artifact["scope"]["mdprPath"])
        self.assertTrue(mdpr_path.exists(), f"recorded MDPR path is missing: {mdpr_path}")
        current_mdpr_commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=mdpr_path,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        self.assertEqual(artifact["scope"]["mdprCommitAtValidation"], current_mdpr_commit)
        for schema_name, local_hash in artifact["schemaSync"]["localSchemaHashes"].items():
            mdpr_hash = artifact["schemaSync"]["mdprSchemaHashes"].get(schema_name)
            self.assertEqual(local_hash, mdpr_hash, f"recorded local/MDPR hash drift for {schema_name}")
            self.assertEqual(sha256_file(ROOT / "schemas" / schema_name), local_hash, f"local schema hash drift for {schema_name}")
            self.assertEqual(sha256_file(mdpr_path / "schemas" / schema_name), mdpr_hash, f"MDPR schema hash drift for {schema_name}")

        fixtures = artifact["runtimeBridgeFixtures"]
        self.assertIn("bridge-edge-allowed-hints.json", fixtures["accepted"])
        self.assertIn("bridge-edge-conflict-hints.json", fixtures["conflict"])
        self.assertIn("bridge-forbidden-hints.json", fixtures["forbidden"])

    def test_readme_exposes_the_same_typography_decision_boundary(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        required_identifiers = [
            "<!-- mdpr-runtime-skill-comparison -->",
            "| MDPR | mdpr-skill |",
            "fontHierarchy",
            "16pt",
            "MDPR_POLISH_GATE_FAILED",
            "--template",
            "typography.fontFamily",
            "artifacts/pro-review/mdpr-skill-runtime-sync-review-20260713.json",
        ]
        for identifier in required_identifiers:
            self.assertIn(identifier, readme, f"README.md is missing comparison identifier {identifier}")

    def test_hints_core_manifest_uses_mdpr_agent_hint_schema_version(self):
        source = (ROOT / "packages" / "hints-core" / "src" / "index.ts").read_text(encoding="utf-8")

        self.assertIn('schemaVersion: "mdpr-agent-hint-v1"', source)
        self.assertIn('generatedBy: "mdpr-skill"', source)
        self.assertIn("generatedAt", source)
        self.assertNotRegex(source, r'\bversion:\s*"1\.0"')

    def test_hints_core_forbidden_fields_match_final_decision_boundary(self):
        source = (ROOT / "packages" / "hints-core" / "src" / "index.ts").read_text(encoding="utf-8")
        match = re.search(r"FORBIDDEN_AGENT_HINT_FIELDS\s*=\s*\[(.*?)\]\s*as const", source, re.S)
        self.assertIsNotNone(match, "FORBIDDEN_AGENT_HINT_FIELDS const is missing")
        fields = set(re.findall(r'"([^"]+)"', match.group(1)))

        expected = {
            "recipeId",
            "variantId",
            "box",
            "x",
            "y",
            "w",
            "h",
            "color",
            "colors",
            "fontSize",
            "fontFamily",
            "typography",
            "zOrder",
            "z-order",
            "radius",
            "shadow",
            "effect",
            "arrow",
            "component",
            "style",
            "iconPath",
            "iconName",
            "coordinates",
            "geometry",
            "rendererObjectId",
        }
        self.assertEqual(expected - fields, set())


if __name__ == "__main__":
    unittest.main()
