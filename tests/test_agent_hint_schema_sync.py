from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


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
