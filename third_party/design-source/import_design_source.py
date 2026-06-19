#!/usr/bin/env python3
"""Documented import boundary for Design Components metadata.

This script intentionally emits the approved import scope instead of importing
React runtime files. A future MDPR repository integration can replace the
manifest reads with pinned checkout reads from the recorded upstream ref.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

manifest = {
    "source": "external-design-source",
    "ref": "34e9fcf2d3da69355defad7afa5e50ff15ed8cb2",
    "imports": [
        "engine/DESIGN-LANGUAGE.md",
        "engine/VISUAL-CRAFT.md",
        "engine/tokens/semantic-tokens.json",
        "engine/motion/motion-map.json",
        "skins/*.json"
    ],
    "excludedRuntimeDependencies": ["React components", "Tailwind assumptions", "Framer Motion runtime"],
}

print(json.dumps(manifest, indent=2))
