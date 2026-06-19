#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MDPR = ROOT / ".cache" / "mdpr"

REQUIRED_FILES = [
    "packages/core/src/parser/parsePandoc.ts",
    "packages/core/src/parser/parseMarkdown.ts",
    "packages/core/src/ir/types.ts",
    "packages/core/src/index.ts",
    "packages/cli/src/orchestrate.ts",
    "packages/cli/src/index.ts",
]

REQUIRED_TEXT = {
    "packages/core/src/parser/parsePandoc.ts": [
        "parsePandocJson",
        "parseMarkdownWithPandoc",
        "spawnSync",
        "Pandoc JSON",
    ],
    "packages/core/src/ir/types.ts": [
        "ParserMode",
        '"simple" | "pandoc"',
        "PandocAttr",
    ],
    "packages/core/src/index.ts": [
        "./parser/parsePandoc.js",
    ],
    "packages/cli/src/orchestrate.ts": [
        "parseMarkdownWithPandoc",
        "parser?: ParserMode",
        'options.parser === "pandoc"',
    ],
    "packages/cli/src/index.ts": [
        "--parser simple|pandoc",
        "readParserMode",
    ],
}


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read(relative_path: str) -> str:
    return (MDPR / relative_path).read_text(encoding="utf-8")


def main() -> None:
    if not MDPR.is_dir():
        fail("MDPR checkout is missing. Run npm run install:mdpr first.")

    missing = [path for path in REQUIRED_FILES if not (MDPR / path).is_file()]
    if missing:
        fail("MDPR checkout is missing required Pandoc integration files: " + ", ".join(missing))

    for path, needles in REQUIRED_TEXT.items():
        text = read(path)
        for needle in needles:
            if needle not in text:
                fail(f"{path} missing required text: {needle}")

    print("MDPR Pandoc parser boundary check passed")


if __name__ == "__main__":
    main()

