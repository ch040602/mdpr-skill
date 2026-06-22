from pathlib import Path
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


if __name__ == "__main__":
    unittest.main()
